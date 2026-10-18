// Pure decision rules of `/deliver` (issue #185): preflight, queue order, merge gate, base check, summary.
// No I/O here; deliver.test.mjs covers every row.
import { resolveModel } from "./agent-model.mjs";
import { classifyChecks } from "./ci-wait.mjs";
import { byPriority, parseDependencies } from "./dispatch.mjs";
import { findIssuePr, hasClosingKeyword } from "./issue-link.mjs";

/** Check names that must be present and green (or skipped) on the head; #188 may change this one line. */
export const REQUIRED_CHECKS = ["quality", "build", "e2e", "db-reset", "storybook"];
const REAL_STATUS = /^status:/;

/**
 * Lists the label names of an issue or pull request, from REST objects or plain strings.
 *
 * @param {{labels?: Array<string | {name: string}>}} item Issue or pull request.
 * @returns {string[]} Label names.
 */
export const labelNames = (item) => (item.labels ?? []).map((l) => (typeof l === "string" ? l : l.name));

/**
 * Decides whether `/deliver` may build an issue (rules in plan order; `/deliver` never approves a plan).
 *
 * @param {object} issue Issue with `number`, `state`, `labels`.
 * @param {object[]} openPrs Open pull requests.
 * @returns {{action: "build" | "resume" | "refuse", reason: string, agent: string | null}} Decision.
 */
export function preflightVerdict(issue, openPrs) {
  const labels = labelNames(issue);
  const refuse = (reason) => ({ action: "refuse", reason, agent: null });
  if (issue.state === "closed") return refuse("closed");
  if (labels.includes("agent:auto")) return refuse("owned by the dispatcher (agent:auto)");
  if (labels.includes("needs:decision")) return refuse("needs:decision is open");
  if (findIssuePr(issue.number, openPrs)) {
    if (labels.includes("status:blocked")) return refuse("blocked: see the issue");
    return { action: "resume", reason: "an open PR exists", agent: resolveModel("build", labels).agent };
  }
  if (labels.includes("status:in-progress")) return refuse("already being built by another session");
  if (!labels.includes("status:ready")) {
    const current = labels.filter((l) => REAL_STATUS.test(l)).join(", ") || "no status";
    return refuse(`not status:ready (${current})`);
  }
  return { action: "build", reason: "status:ready", agent: resolveModel("build", labels).agent };
}

/**
 * Orders entries by dependencies, then priority, then number; refuses entries with an open outside dependency.
 *
 * @param {object[]} entries Entries `{number, labels, body, action, reason, agent}`; refused ones go last unchanged.
 * @param {Set<number>} closed Numbers of closed issues.
 * @returns {object[]} Ordered entries, buildable first.
 */
export function orderQueue(entries, closed) {
  const refused = entries.filter((e) => e.action === "refuse");
  let pending = entries.filter((e) => e.action !== "refuse");
  for (let changed = true; changed;) {
    changed = false;
    const inQueue = new Set(pending.map((e) => e.number));
    for (const entry of [...pending]) {
      const open = parseDependencies(entry.body).find((d) => !closed.has(d) && !inQueue.has(d));
      if (open === undefined) continue;
      pending = pending.filter((e) => e !== entry);
      refused.push({ ...entry, action: "refuse", reason: `depends on #${open} (open)`, agent: null });
      changed = true;
    }
  }
  const ordered = [];
  const done = new Set(closed);
  while (pending.length > 0) {
    const ready = pending.filter((e) => parseDependencies(e.body).every((d) => done.has(d)));
    if (ready.length === 0) break;
    const next = ready.sort(byPriority)[0];
    ordered.push(next);
    done.add(next.number);
    pending = pending.filter((e) => e !== next);
  }
  const cycle = pending.map((e) => ({ ...e, action: "refuse", reason: "dependency cycle", agent: null }));
  return [...ordered, ...refused, ...cycle];
}

/**
 * Tells whether two failures have the same cause (rule 9: same problem twice).
 *
 * @param {Array<{name: string, line?: string}>} previous Failures of the previous round.
 * @param {Array<{name: string, line?: string}>} current Failures of this round.
 * @returns {boolean} True when a shared failed check has the same first failure line.
 */
export function sameCause(previous, current) {
  return current.some((c) => previous.some((p) => p.name === c.name && (p.line ?? "") === (c.line ?? "")));
}

/**
 * Lists the failures of check runs and commit statuses.
 *
 * @param {object[]} checks Check runs.
 * @param {object[]} statuses Commit statuses (Vercel).
 * @returns {Array<{name: string}>} Failed names.
 */
function failures(checks, statuses) {
  const bad = classifyChecks(checks).failed.map((c) => ({ name: c.name }));
  const badStatus = statuses.filter((s) => ["failure", "error"].includes(s.state));
  return [...bad, ...badStatus.map((s) => ({ name: s.context }))];
}

/**
 * Builds a gate verdict.
 *
 * @param {string} verdict Verdict name.
 * @param {string} [reason] One-line reason.
 * @param {Array<{name: string}>} [failed] Failed checks.
 * @returns {{verdict: string, reason: string, failed: Array<{name: string}>}} Verdict.
 */
const out = (verdict, reason = "", failed = []) => ({ verdict, reason, failed });

/**
 * Tells whether the head repository is another repository (a fork).
 *
 * @param {object} pr Pull request.
 * @returns {boolean} True for a fork.
 */
const isFork = (pr) => Boolean(pr.head?.repo) && pr.head.repo.full_name !== pr.base?.repo?.full_name;

/**
 * Tells whether GitHub or CI has not settled yet.
 *
 * @param {object} ctx Gate context.
 * @returns {boolean} True when something is pending, missing or unknown.
 */
function mustWait({ checks, statuses, pr }) {
  const names = new Set(checks.map((c) => c.name));
  const unsettled =
    checks.some((c) => c.status !== "completed") || REQUIRED_CHECKS.some((n) => !names.has(n));
  return (
    unsettled ||
    statuses.some((s) => s.state === "pending") ||
    (pr.mergeable ?? null) === null ||
    pr.mergeable_state === "unknown"
  );
}

/**
 * Tells whether the criteria are not all ticked and the PR body does not explain them.
 *
 * @param {object} ctx Gate context.
 * @returns {boolean} True when unticked criteria are unexplained.
 */
const unexplainedCriteria = ({ criteria, pr }) =>
  Boolean(criteria) && criteria.met < criteria.total && !/^## +Unticked criteria/m.test(pr.body ?? "");

/* eslint-disable jsdoc/require-param, jsdoc/require-returns -- the rule table is documented as a whole */
/** Gate rows 1 to 12 in order; the first rule that returns a verdict wins. */
const GATE_RULES = [
  ({ pr }) => (pr.state !== "open" || pr.merged) && out("refuse", "PR closed"),
  ({ pr }) => (pr.base?.ref !== "main" || isFork(pr)) && out("refuse", `base is ${pr.base?.ref}, not main`),
  ({ issue, pr }) =>
    [...labelNames(issue), ...labelNames(pr)].includes("needs:decision") && out("refuse", "needs:decision"),
  ({ issue, pr }) => !hasClosingKeyword(issue.number, pr.body) && out("fix-body", "no closing keyword"),
  ({ pr }) => pr.draft && out("draft", "PR is a draft"),
  (ctx) => mustWait(ctx) && out("wait", "CI or mergeability not settled"),
  (ctx) => {
    const failed = failures(ctx.checks, ctx.statuses);
    return failed.length > 0 && out("fix", failed.map((f) => f.name).join(", "), failed);
  },
  ({ pr }) => pr.mergeable_state === "dirty" && out("conflict", "merge conflict with main"),
  ({ pr }) => pr.mergeable_state === "blocked" && out("wait", "branch protection is waiting"),
  (ctx) =>
    unexplainedCriteria(ctx) &&
    out("refuse", `criteria ${ctx.criteria.met}/${ctx.criteria.total}, unticked not explained`),
  ({ issue, confirmed }) =>
    labelNames(issue).includes("needs:interactive") && !confirmed && out("confirm", "needs Merna's merge"),
];
/* eslint-enable jsdoc/require-param, jsdoc/require-returns */

/**
 * Applies the merge gate. First matching row wins (plan table, rows 1 to 12).
 *
 * @param {object} input `{issue, pr, checks, statuses, criteria, confirmed}`; `criteria` is `{met, total}`.
 * @returns {{verdict: string, reason: string, failed: Array<{name: string}>}} Verdict.
 */
export function gateVerdict(input) {
  const ctx = { statuses: [], confirmed: false, ...input };
  for (const rule of GATE_RULES) {
    const verdict = rule(ctx);
    if (verdict) return verdict;
  }
  return out("merge", "all gates passed");
}

/**
 * Judges the state of `main` from its head checks and the Staging workflow run.
 *
 * @param {object[]} checks Check runs on the `main` head.
 * @param {object | null} stagingRun Latest `Staging` workflow run for that SHA, if any.
 * @returns {{state: "green" | "pending" | "red", names: string[]}} Verdict with the red names.
 */
export function baseVerdict(checks, stagingRun) {
  const required = checks.filter((c) => REQUIRED_CHECKS.includes(c.name));
  const red = classifyChecks(required.filter((c) => c.status === "completed")).failed.map((c) => c.name);
  if (stagingRun?.status === "completed" && stagingRun.conclusion === "failure") red.push("Staging");
  if (red.length > 0) return { state: "red", names: red };
  const waiting =
    required.some((c) => c.status !== "completed") || (stagingRun && stagingRun.status !== "completed");
  return { state: waiting ? "pending" : "green", names: [] };
}

/**
 * Checks the local environment for `/deliver`.
 *
 * @param {{ghOk: boolean, repoOk: boolean, dirty: boolean, branch: string}} facts Observed facts.
 * @returns {string[]} Problems; empty when everything is fine.
 */
export function doctorProblems(facts) {
  const problems = [];
  if (!facts.ghOk) problems.push("gh is missing");
  if (!facts.repoOk) problems.push("gh api cannot read the repository");
  if (facts.dirty) problems.push("git tree is not clean");
  if (!facts.branch || facts.branch === "main") problems.push("not on a branch other than main");
  return problems;
}

/**
 * Formats the Arabic summary line of one issue.
 *
 * @param {{kind: "merged" | "blocked" | "refused", issue: number, pr?: number, sha?: string, reason?: string}} result Outcome.
 * @returns {string} One line for Merna.
 */
export function summaryLine(result) {
  const pr = result.pr ? `PR #${result.pr}، ` : "";
  if (result.kind === "merged")
    return `#${result.issue}: ${pr}CI أخضر، دُمج (${result.sha})، والـ issue مغلقة.`;
  if (result.kind === "blocked") return `#${result.issue}: ${pr}${result.reason}، لم يُدمج: status:blocked.`;
  return `#${result.issue}: رُفضت: ${result.reason}.`;
}

/**
 * Formats the whole Arabic summary: a header and one line per issue.
 *
 * @param {object[]} results Outcomes as for `summaryLine`.
 * @returns {string} Multi-line summary.
 */
export function summary(results) {
  const merged = results.filter((r) => r.kind === "merged").length;
  return [`/deliver: دُمجت ${merged} من ${results.length}.`, ...results.map(summaryLine)].join("\n");
}
