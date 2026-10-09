// Dispatcher selection logic (issue #16): picks the next `status:ready` issue for the cloud agent.
// Run by .github/workflows/dispatch.yml; the pure functions are unit-tested in dispatch.test.mjs.
import { appendFileSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { resolveModel } from "./agent-model.mjs";

const MAX_REVIEW_PRS = 3;
const DEFAULT_DAILY_LIMIT = 4;
/** Labels that keep an issue away from unattended builds: a pending decision, or work that needs approvals (issue #58). */
const UNATTENDED_BLOCKERS = ["needs:decision", "needs:interactive"];
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
 * @returns "opus", "sonnet" or "haiku" (sonnet when missing or unknown, see agent-model.mjs).
 */
export function buildModel(labels) {
  return resolveModel("build", labels).model;
}

/**
 * Reads the `DISPATCH_DAILY_LIMIT` repo variable (issue #17).
 *
 * @param value Raw variable value (may be empty or missing).
 * @returns A whole number of builds allowed per UTC day; 4 when unset or invalid.
 */
export function parseDailyLimit(value) {
  const n = Number(String(value ?? "").trim() || Number.NaN);
  return Number.isInteger(n) && n >= 0 ? n : DEFAULT_DAILY_LIMIT;
}

/**
 * Counts the dispatcher runs that started a build on the given UTC day.
 *
 * @param runs Dispatcher runs as `{ createdAt, built }` (`createdAt` is an ISO timestamp).
 * @param day UTC day as `YYYY-MM-DD`.
 * @returns Number of runs on that day whose build job ran.
 */
export function countBuildsOn(runs, day) {
  return runs.filter((r) => r.built && String(r.createdAt).startsWith(day)).length;
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
 * @returns True when dependencies are closed, no decision is pending, it may run unattended and its area is free.
 */
function canStart(candidate, ctx) {
  if (UNATTENDED_BLOCKERS.some((label) => candidate.labels.includes(label))) return false;
  if (!parseDependencies(candidate.body).every((n) => ctx.closed.has(n))) return false;
  const busy = new Set(ctx.inProgress.flatMap((i) => areasOf(i.labels)));
  return !areasOf(candidate.labels).some((a) => busy.has(a));
}

/**
 * Chooses the next issue to build, or explains why none is chosen.
 *
 * @param input Open issues, closed issue numbers, open review PR count, parallel limit, the pause switch,
 *   and the builds started today with the daily limit.
 * @returns `{ pick, model, reason }`; `pick` is null when nothing should start.
 */
export function selectIssue(input) {
  const { issues, closed, openReviewPrs, maxParallel, enabled } = input;
  const { buildsToday = 0, dailyLimit = DEFAULT_DAILY_LIMIT } = input;
  const none = (reason) => ({ pick: null, model: null, reason });
  if (!enabled) return none("Dispatcher is paused (DISPATCH_ENABLED=false).");
  if (buildsToday >= dailyLimit) {
    return none(`Daily limit reached: ${buildsToday} build(s) today (DISPATCH_DAILY_LIMIT=${dailyLimit}).`);
  }
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
 * Counts today's (UTC) dispatcher runs whose build job ran, excluding the current run.
 *
 * @returns Number of builds the dispatcher started today.
 */
function buildsStartedToday() {
  const today = new Date().toISOString().slice(0, "YYYY-MM-DD".length);
  const listArgs = ["run", "list", "--workflow", "dispatch.yml", "--created", `>=${today}`, "--limit", "100"];
  const runs = gh([...listArgs, "--json", "databaseId,createdAt"])
    .filter((r) => String(r.databaseId) !== process.env.GITHUB_RUN_ID)
    .map((r) => ({
      createdAt: r.createdAt,
      built: gh(["run", "view", String(r.databaseId), "--json", "jobs"]).jobs.some(
        (j) => j.name.startsWith("build") && j.conclusion !== "skipped",
      ),
    }));
  return countBuildsOn(runs, today);
}

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
    buildsToday: buildsStartedToday(),
    dailyLimit: parseDailyLimit(process.env.DISPATCH_DAILY_LIMIT),
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
