// GitHub steps of `/deliver` (issue #185): gate, merge, base check, start, block, fix-body and queue.
// Every function takes the injectable client from deliver-client.mjs; timers are injectable through `options`.
import { extractFailureLines } from "./ci-wait.mjs";
import { rp } from "./deliver-client.mjs";
import { baseVerdict, gateVerdict, labelNames, orderQueue, preflightVerdict } from "./deliver-rules.mjs";
import { parseDependencies } from "./dispatch.mjs";
import { hasClosingKeyword } from "./issue-link.mjs";

const POLL_MS = 20_000;
const TIMEOUT_MS = 25 * 60_000;
const CLOSE_POLL_MS = 5_000;
const CLOSE_POLL_TRIES = 12;
const MAX_FILES_CHECKED = 30;
const REAL_STATUS = /^status:/;

/**
 * Reads every check run of a commit, following pages.
 *
 * @param {object} client Client.
 * @param {string} sha Commit SHA.
 * @returns {object[]} Check runs.
 */
function readChecks(client, sha) {
  const all = [];
  for (let page = 1; ; page++) {
    const body = client.get(rp(client, `commits/${sha}/check-runs?per_page=100&page=${page}`));
    all.push(...body.check_runs);
    if (body.check_runs.length < 100) return all;
  }
}

/**
 * Reads the first failure line of every failed check, for `sameCause`.
 *
 * @param {object} client Client.
 * @param {object[]} checks Check runs.
 * @param {Array<{name: string}>} failed Failed names.
 * @param {object[]} statuses Commit statuses.
 * @returns {Array<{name: string, line: string}>} Failures with their first line.
 */
function withLines(client, checks, failed, statuses) {
  return failed.map(({ name }) => {
    const check = checks.find((c) => c.name === name && c.conclusion && c.conclusion !== "success");
    const status = statuses.find((s) => s.context === name);
    if (!check) return { name, line: status?.description ?? "" };
    try {
      return { name, line: extractFailureLines(client.log(check.id), 1)[0] ?? "" };
    } catch {
      return { name, line: "" };
    }
  });
}

/**
 * Computes the gate verdict for an issue and pull request once.
 *
 * @param {object} client Client.
 * @param {number} number Issue number.
 * @param {number} prNumber Pull request number.
 * @param {boolean} confirmed Whether Merna confirmed the merge.
 * @returns {object} Verdict with `pr` and `sha`.
 */
export function gateOnce(client, number, prNumber, confirmed = false) {
  const issue = client.get(rp(client, `issues/${number}`));
  const pr = client.get(rp(client, `pulls/${prNumber}`));
  const sha = pr.head.sha;
  const checks = readChecks(client, sha);
  const statuses = client.get(rp(client, `commits/${sha}/status`)).statuses ?? [];
  const criteria = client.criteria(number);
  const verdict = gateVerdict({ issue, pr, checks, statuses, criteria, confirmed });
  const failed = withLines(client, checks, verdict.failed, statuses);
  return { ...verdict, failed, pr: prNumber, sha };
}

/**
 * Polls until a function returns a settled result or the timeout passes.
 *
 * @param {() => object} step Returns a result; `settled(result)` ends the wait.
 * @param {(r: object) => boolean} settled Whether the result is final.
 * @param {object} deps `{sleep, now}` (injectable).
 * @returns {Promise<object>} Last result, or `{verdict: "timeout"}`-style marker via `timedOut`.
 */
async function pollUntil(step, settled, deps) {
  const started = deps.now();
  for (;;) {
    const result = step();
    if (settled(result)) return result;
    if (deps.now() - started >= TIMEOUT_MS) return { ...result, timedOut: true };
    await deps.sleep(POLL_MS);
  }
}

/**
 * Gate with optional waiting (`--wait`).
 *
 * @param {object} client Client.
 * @param {number} number Issue number.
 * @param {number} prNumber Pull request number.
 * @param {{wait?: boolean, confirmed?: boolean, sleep: (ms: number) => Promise<void>, now: () => number}} options Options and injectable timers.
 * @returns {Promise<object>} Verdict; `timeout` when CI did not finish.
 */
export async function gate(client, number, prNumber, options) {
  const once = () => gateOnce(client, number, prNumber, options.confirmed);
  if (!options.wait) return once();
  const result = await pollUntil(once, (r) => r.verdict !== "wait", options);
  return result.timedOut ? { ...result, verdict: "timeout", reason: "CI did not finish in 25 min" } : result;
}

/**
 * Merges a pull request after re-running the gate, with the head SHA pinned.
 *
 * @param {object} client Client.
 * @param {number} number Issue number.
 * @param {number} prNumber Pull request number.
 * @param {{confirmed?: boolean, sleep: (ms: number) => Promise<void>, now: () => number}} options Options and injectable timers.
 * @returns {Promise<object>} `{merged, reason?, sha?, closed?}`.
 */
export async function merge(client, number, prNumber, options) {
  const verdict = gateOnce(client, number, prNumber, options.confirmed);
  if (verdict.verdict !== "merge")
    return { merged: false, reason: `gate says ${verdict.verdict}: ${verdict.reason}` };
  const pr = client.get(rp(client, `pulls/${prNumber}`));
  let result;
  try {
    result = client.write("PUT", rp(client, `pulls/${prNumber}/merge`), {
      merge_method: "squash",
      sha: verdict.sha,
      commit_title: `${pr.title} (#${prNumber})`,
    });
  } catch (error) {
    return { merged: false, reason: `GitHub refused the merge (HTTP ${error.status}): ${error.message}` };
  }
  const closedBy = await ensureClosed(client, number, prNumber, options);
  deleteBranch(client, pr);
  const missingOnMain = missingFilesOnMain(client, prNumber);
  return { merged: true, sha: String(result.sha ?? verdict.sha).slice(0, 7), closedBy, missingOnMain };
}

/**
 * Lists files the merged pull request added or changed that cannot be found on `main` (issue #186: a PR once
 * merged into an already-merged branch closed its issue but never reached `main`).
 *
 * @param {object} client Client.
 * @param {number} prNumber Pull request number.
 * @returns {string[]} Paths missing on `main`; empty when all exist or the files cannot be read.
 */
export function missingFilesOnMain(client, prNumber) {
  let files;
  try {
    files = client.get(rp(client, `pulls/${prNumber}/files?per_page=100`));
  } catch {
    return [];
  }
  const paths = files.filter((f) => f.status !== "removed").map((f) => f.filename);
  return paths.slice(0, MAX_FILES_CHECKED).filter((path) => {
    try {
      client.get(rp(client, `contents/${path}?ref=main`));
      return false;
    } catch (error) {
      return error.status === 404;
    }
  });
}

/**
 * Waits for GitHub to close the issue after the merge and closes it itself when it does not.
 *
 * @param {object} client Client.
 * @param {number} number Issue number.
 * @param {number} prNumber Pull request number.
 * @param {{sleep: (ms: number) => Promise<void>}} options Injectable timer.
 * @returns {Promise<"github" | "deliver">} Who closed the issue.
 */
async function ensureClosed(client, number, prNumber, options) {
  for (let i = 0; i < CLOSE_POLL_TRIES; i++) {
    if (client.get(rp(client, `issues/${number}`)).state === "closed") return "github";
    await options.sleep(CLOSE_POLL_MS);
  }
  client.write("POST", rp(client, `issues/${number}/comments`), {
    body: `Closed by /deliver: PR #${prNumber} merged`,
  });
  client.write("PATCH", rp(client, `issues/${number}`), { state: "closed", state_reason: "completed" });
  return "deliver";
}

/**
 * Deletes the head branch when it lives in this repository and is not `main`.
 *
 * @param {object} client Client.
 * @param {object} pr Pull request.
 */
function deleteBranch(client, pr) {
  const sameRepo = !pr.head.repo || pr.head.repo.full_name === pr.base?.repo?.full_name;
  if (!sameRepo || pr.head.ref === "main") return;
  try {
    client.write("DELETE", rp(client, `git/refs/heads/${pr.head.ref}`));
  } catch {
    // The branch may already be deleted by the repository setting; nothing to do.
  }
}

/**
 * Judges `main` (head checks and the Staging run), optionally waiting.
 *
 * @param {object} client Client.
 * @param {{wait?: boolean, sleep: (ms: number) => Promise<void>, now: () => number}} options Options and injectable timers.
 * @returns {Promise<object>} `{state, names, sha}`.
 */
export async function base(client, options) {
  const once = () => {
    const sha = client.get(rp(client, "commits/main")).sha;
    const runs = client.get(rp(client, `actions/workflows/staging.yml/runs?head_sha=${sha}&per_page=1`));
    return { ...baseVerdict(readChecks(client, sha), runs.workflow_runs?.[0] ?? null), sha };
  };
  if (!options.wait) return once();
  const result = await pollUntil(once, (r) => r.state !== "pending", options);
  return result.timedOut ? { ...result, state: "red", names: ["timeout"] } : result;
}

/**
 * Starts work on an issue: adds `status:in-progress` and removes `status:ready` (never sets ready).
 *
 * @param {object} client Client.
 * @param {number} number Issue number.
 * @returns {{started: boolean}} Result.
 */
export function start(client, number) {
  const labels = labelNames(client.get(rp(client, `issues/${number}`)));
  client.write("POST", rp(client, `issues/${number}/labels`), { labels: ["status:in-progress"] });
  if (labels.includes("status:ready"))
    client.write("DELETE", rp(client, `issues/${number}/labels/${encodeURIComponent("status:ready")}`));
  return { started: true };
}

/**
 * Comments the reason on an issue and sets `status:blocked` (other `status:*` labels go, `needs:*` stay).
 *
 * @param {object} client Client.
 * @param {number} number Issue number.
 * @param {string} reason One-line reason.
 * @returns {{blocked: boolean}} Result.
 */
export function block(client, number, reason) {
  const labels = labelNames(client.get(rp(client, `issues/${number}`)));
  client.write("POST", rp(client, `issues/${number}/comments`), { body: `/deliver stopped: ${reason}` });
  const kept = labels.filter((l) => !REAL_STATUS.test(l));
  client.write("PUT", rp(client, `issues/${number}/labels`), { labels: [...kept, "status:blocked"] });
  return { blocked: true };
}

/**
 * Adds `Closes #N` as the first body line when the pull request has no closing keyword.
 *
 * @param {object} client Client.
 * @param {number} number Issue number.
 * @param {number} prNumber Pull request number.
 * @returns {{changed: boolean}} Result.
 */
export function fixBody(client, number, prNumber) {
  const pr = client.get(rp(client, `pulls/${prNumber}`));
  if (hasClosingKeyword(number, pr.body)) return { changed: false };
  client.write("PATCH", rp(client, `pulls/${prNumber}`), { body: `Closes #${number}\n\n${pr.body ?? ""}` });
  return { changed: true };
}

/**
 * Reads the issues for a queue command and returns the ordered entries.
 *
 * @param {object} client Client.
 * @param {string[]} args `["#1","#2"]` or `["next", "2"]`.
 * @returns {object[]} Entries `{issue, action, reason, agent}`.
 */
export function queue(client, args) {
  const prs = client.get(rp(client, "pulls?state=open&per_page=100"));
  const numbers =
    args[0] === "next"
      ? client
          .get(rp(client, "issues?state=open&labels=status:ready&per_page=100"))
          .filter((i) => !i.pull_request)
          .map((i) => i.number)
      : args.map((a) => Number(a.replace("#", "")));
  const entries = numbers.map((n) => {
    const issue = client.get(rp(client, `issues/${n}`));
    return { number: n, labels: labelNames(issue), body: issue.body ?? "", ...preflightVerdict(issue, prs) };
  });
  const limit = args[0] === "next" ? Number(args[1] ?? 1) : Infinity;
  const outside = new Set(
    entries.flatMap((e) => parseDependencies(e.body)).filter((d) => !numbers.includes(d)),
  );
  const closed = new Set(
    [...outside].filter((d) => client.get(rp(client, `issues/${d}`)).state === "closed"),
  );
  const ordered = orderQueue(entries, closed);
  const buildable = ordered.filter((e) => e.action !== "refuse").slice(0, limit);
  const shown = args[0] === "next" ? buildable : ordered;
  return shown.map((e) => ({ issue: e.number, action: e.action, reason: e.reason, agent: e.agent }));
}
