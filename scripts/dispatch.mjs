// Dispatcher selection logic (issue #16): picks the next `status:ready` issue for the cloud agent.
// Run by .github/workflows/dispatch.yml; the pure functions are unit-tested in dispatch.test.mjs.
import { appendFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const MAX_REVIEW_PRS = 3;
const PRIORITY_RANK = { "priority:P0": 0, "priority:P1": 1, "priority:P2": 2, "priority:P3": 3 };

/**
 * Reads the issue numbers after "Depends on" in an issue body.
 *
 * @param body Issue body text.
 * @returns Issue numbers this issue depends on.
 */
export function parseDependencies(body) {
  const numbers = [];
  for (const line of String(body ?? "").split("\n")) {
    const at = line.toLowerCase().indexOf("depends on");
    if (at >= 0) for (const m of line.slice(at).matchAll(/#(\d+)/g)) numbers.push(Number(m[1]));
  }
  return numbers;
}

/**
 * Maps the `build:*` label to a Claude model alias.
 *
 * @param labels Label names of the issue.
 * @returns "opus", "sonnet" or "haiku" (sonnet by default).
 */
export function buildModel(labels) {
  const found = labels.find((l) => l.startsWith("build:"));
  return found ? found.slice("build:".length) : "sonnet";
}

/**
 * Lists the `area:*` labels of an issue.
 *
 * @param labels Label names.
 * @returns Area labels.
 */
const areasOf = (labels) => labels.filter((l) => l.startsWith("area:"));

/**
 * Sorts candidates by priority, then by issue number.
 *
 * @param a First issue.
 * @param b Second issue.
 * @returns Sort order.
 */
function byPriority(a, b) {
  const rank = (i) => Math.min(...i.labels.map((l) => PRIORITY_RANK[l] ?? 9), 9);
  return rank(a) - rank(b) || a.number - b.number;
}

/**
 * Tells whether an issue may start now.
 *
 * @param candidate A `status:ready` issue.
 * @param ctx Closed issue numbers and the issues already in progress.
 * @returns True when dependencies are closed, no decision is pending and its area is free.
 */
function canStart(candidate, ctx) {
  if (candidate.labels.includes("needs:decision")) return false;
  if (!parseDependencies(candidate.body).every((n) => ctx.closed.has(n))) return false;
  const busy = new Set(ctx.inProgress.flatMap((i) => areasOf(i.labels)));
  return !areasOf(candidate.labels).some((a) => busy.has(a));
}

/**
 * Chooses the next issue to build, or explains why none is chosen.
 *
 * @param input Open issues, closed issue numbers, open review PR count, parallel limit and the pause switch.
 * @returns `{ pick, model, reason }`; `pick` is null when nothing should start.
 */
export function selectIssue({ issues, closed, openReviewPrs, maxParallel, enabled }) {
  const none = (reason) => ({ pick: null, model: null, reason });
  if (!enabled) return none("Dispatcher is paused (DISPATCH_ENABLED=false).");
  if (openReviewPrs >= MAX_REVIEW_PRS) {
    return none(`${openReviewPrs} pull requests are waiting for review (limit ${MAX_REVIEW_PRS}).`);
  }
  const inProgress = issues.filter((i) => i.labels.includes("status:in-progress"));
  if (inProgress.length >= maxParallel) {
    return none(`${inProgress.length} issue(s) in progress (limit ${maxParallel}).`);
  }
  const ready = issues.filter((i) => i.labels.includes("status:ready"));
  const pick = ready.filter((i) => canStart(i, { closed, inProgress })).sort(byPriority)[0];
  if (!pick)
    return none(
      `No ready issue can start (${ready.length} ready, blocked by dependencies, decisions or area).`,
    );
  return {
    pick,
    model: buildModel(pick.labels),
    reason: `Picked #${pick.number} (highest priority startable of ${ready.length} ready).`,
  };
}

/**
 * Runs `gh` and parses its JSON output.
 *
 * @param args Arguments for `gh`.
 * @returns Parsed JSON.
 */
// eslint-disable-next-line sonarjs/no-os-command-from-path -- `gh` is the GitHub CLI preinstalled on Actions runners
const gh = (args) => JSON.parse(execFileSync("gh", args, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 }));

/**
 * Collects the repository state, selects an issue and writes the outputs and summary for GitHub Actions.
 *
 * Sets the `issue` and `model` outputs (empty when nothing is picked).
 */
function main() {
  const fields = "number,labels,body";
  const toIssue = (i) => ({ number: i.number, body: i.body, labels: i.labels.map((l) => l.name) });
  const issues = gh(["issue", "list", "--state", "open", "--limit", "200", "--json", fields]).map(toIssue);
  const closed = new Set(
    gh(["issue", "list", "--state", "closed", "--limit", "300", "--json", "number"]).map((i) => i.number),
  );
  const prs = gh(["pr", "list", "--state", "open", "--limit", "100", "--json", "isDraft"]);
  const result = selectIssue({
    issues,
    closed,
    openReviewPrs: prs.filter((p) => !p.isDraft).length,
    maxParallel: Number(process.env.DISPATCH_MAX_PARALLEL || 1),
    enabled: process.env.DISPATCH_ENABLED !== "false",
  });
  console.log(result.reason);
  if (process.env.GITHUB_STEP_SUMMARY)
    appendFileSync(process.env.GITHUB_STEP_SUMMARY, `### Dispatcher\n\n${result.reason}\n`);
  if (process.env.GITHUB_OUTPUT) {
    appendFileSync(
      process.env.GITHUB_OUTPUT,
      `issue=${result.pick?.number ?? ""}\nmodel=${result.model ?? ""}\n`,
    );
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
