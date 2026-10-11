// Reads a claude-code-action execution file (issue #58): reports refused tools, and blocks the issue after a
// failed dispatcher build so the dispatcher can never pick it again in a loop.
//   node scripts/claude-run.mjs check <execution-file>                 exit 1 when a tool was refused
//   node scripts/claude-run.mjs block <issue> <execution-file> <run-url>  set status:blocked and comment why
//   node scripts/claude-run.mjs outcome <issue>                        exit 1 when a build left no PR and no new status
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";

/** Longest refused command or path shown in logs and comments. */
const MAX_INPUT = 200;
/** Status labels that let the dispatcher or /build pick the issue again; they are removed when it is blocked. */
const ACTIVE_STATUSES = ["status:ready", "status:in-progress", "status:changes-requested"];
/** Statuses an issue still has when a build ended without moving it forward. */
const UNFINISHED_STATUSES = ["status:in-progress", "status:ready"];
/** A pull request created this recently counts as the result of the run (the job times out after 60 minutes). */
const RECENT_PR_MS = 2 * 60 * 60 * 1000;
/** Token shapes that must never reach a comment, even when a refused command contains one. */
const SECRET_PATTERN = /\b(gh[opsur]_\w{20,}|github_pat_\w{20,}|sk-ant-[\w-]{20,})/g;

/**
 * Reads the execution file written by claude-code-action.
 *
 * @param {string | undefined} file Path to claude-execution-output.json.
 * @returns {object[] | null} The message list, or null when the file is missing or not valid JSON.
 */
export function readExecution(file) {
  if (!file || !existsSync(file)) return null;
  try {
    const parsed = JSON.parse(readFileSync(file, "utf8"));
    return Array.isArray(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

/**
 * Finds the final result message of a run.
 *
 * @param {object[] | null} messages Execution messages.
 * @returns {object | null} The last `type: "result"` message, or null.
 */
export function finalResult(messages) {
  return (messages ?? []).filter((m) => m?.type === "result").at(-1) ?? null;
}

/**
 * Shortens a refused command or path and removes token-shaped values.
 *
 * @param {string} text Raw tool input.
 * @returns {string} At most MAX_INPUT characters, secrets replaced by "[redacted]".
 */
export function sanitizeInput(text) {
  const clean = String(text).replace(SECRET_PATTERN, "[redacted]").replace(/\s+/g, " ").trim();
  return clean.length > MAX_INPUT ? `${clean.slice(0, MAX_INPUT)}…` : clean;
}

/**
 * Lists the tool calls Claude was refused, with what each one tried to do.
 *
 * @param {object[] | null} messages Execution messages.
 * @returns {{ tool: string, input: string }[]} One entry per refusal.
 */
export function refusals(messages) {
  const denials = finalResult(messages)?.permission_denials ?? [];
  return denials.map((d) => {
    const input = d.tool_input ?? {};
    return { tool: d.tool_name ?? "unknown", input: sanitizeInput(input.command ?? input.file_path ?? "") };
  });
}

/**
 * Explains in one line why a run failed.
 *
 * @param {object[] | null} messages Execution messages.
 * @returns {string} The failure reason.
 */
export function failureReason(messages) {
  const result = finalResult(messages);
  if (!result) return "Claude produced no result (it did not start, or an earlier step failed).";
  const count = refusals(messages).length;
  if (count > 0) return `Claude was refused ${count} tool call(s) after ${result.num_turns ?? "?"} turn(s).`;
  if (result.subtype === "error_max_turns") return `Claude hit the turn limit (${result.num_turns} turns).`;
  if (result.is_error || result.subtype !== "success") return `Claude ended with "${result.subtype}".`;
  return (
    "Claude finished without an error, but no pull request or blocker came out of it (the builder was " +
    "probably cut off by its turn limit), or a later step of the job failed."
  );
}

/**
 * Writes the comment posted on a blocked issue.
 *
 * @param {object[] | null} messages Execution messages.
 * @param {string} runUrl Link to the failed workflow run.
 * @returns {string} Markdown comment body.
 */
export function failureComment(messages, runUrl) {
  const lines = [
    `Dispatcher build failed: ${failureReason(messages)}`,
    "",
    `Run: ${runUrl} (its \`claude-transcript\` artifact has the full transcript for 7 days).`,
  ];
  const refused = refusals(messages);
  if (refused.length > 0) {
    lines.push(
      "",
      "Refused tool calls:",
      ...refused.map((r) => `- ${r.tool}: \`${r.input || "(no input)"}\``),
    );
  }
  lines.push(
    "",
    "Moved to `status:blocked` so the dispatcher does not pick it again. Fix the cause (or add `needs:interactive`",
    "and build it in an interactive session), then set `status:ready`. If the issue is large, split it into",
    "smaller issues first: a builder is stopped after 50 turns, and a stopped run keeps nothing that was not pushed.",
  );
  return lines.join("\n");
}

/**
 * Computes the label change that blocks an issue.
 *
 * @param {string[]} current Labels on the issue now.
 * @returns {{ remove: string[], add: string[] }} Active statuses to remove and the blocked status to add.
 */
export function blockLabels(current) {
  return {
    remove: ACTIVE_STATUSES.filter((label) => current.includes(label)),
    add: current.includes("status:blocked") ? [] : ["status:blocked"],
  };
}

/**
 * Tells whether a finished build left a result on GitHub.
 *
 * @param {{ labels: string[], prs: { createdAt: string }[], now: number }} input Issue labels, pull requests that
 *   mention the issue, and the current time in milliseconds.
 * @returns {string | null} Why the build left nothing, or null when it moved the issue on or opened a recent PR.
 */
export function outcomeProblem({ labels, prs, now }) {
  if (!labels.some((label) => UNFINISHED_STATUSES.includes(label))) return null;
  if (prs.some((pr) => now - Date.parse(pr.createdAt) <= RECENT_PR_MS)) return null;
  return "The build ended, but the issue is still in progress and no pull request was opened during the run.";
}

/**
 * Runs the GitHub CLI.
 *
 * @param {string[]} args Arguments for `gh`.
 * @returns {string} Its standard output.
 */
// eslint-disable-next-line sonarjs/no-os-command-from-path -- `gh` is the GitHub CLI preinstalled on Actions runners
const gh = (args) => execFileSync("gh", args, { encoding: "utf8" });

/**
 * Blocks an issue after a failed dispatcher build: swaps its status label and comments the reason.
 *
 * @param {string} issue Issue number.
 * @param {string} file Execution file path.
 * @param {string} runUrl Link to the failed run.
 */
function blockIssue(issue, file, runUrl) {
  const messages = readExecution(file);
  const current = JSON.parse(gh(["issue", "view", issue, "--json", "labels"])).labels.map((l) => l.name);
  const { remove, add } = blockLabels(current);
  const edit = [...remove.flatMap((l) => ["--remove-label", l]), ...add.flatMap((l) => ["--add-label", l])];
  if (edit.length > 0) gh(["issue", "edit", issue, ...edit]);
  gh(["issue", "comment", issue, "--body", failureComment(messages, runUrl)]);
  console.log(`Blocked #${issue}: ${failureReason(messages)}`);
}

/**
 * Checks that a finished dispatcher build left a result on GitHub.
 *
 * @param {string} issue Issue number.
 * @returns {number} Exit code: 1 when the build left no PR and no new status, else 0.
 */
function checkOutcome(issue) {
  const labels = JSON.parse(gh(["issue", "view", issue, "--json", "labels"])).labels.map((l) => l.name);
  const search = `#${issue} in:body`;
  const prs = JSON.parse(
    gh(["pr", "list", "--state", "all", "--search", search, "--json", "number,createdAt"]),
  );
  const problem = outcomeProblem({ labels, prs, now: Date.now() });
  console.log(problem ?? `Outcome ok: #${issue} moved on or has a recent pull request.`);
  if (problem) console.log(`::error::${problem}`);
  return problem ? 1 : 0;
}

/**
 * Prints refused tools as workflow errors.
 *
 * @param {string} file Execution file path.
 * @returns {number} Exit code: 1 when a tool was refused, else 0.
 */
function checkRefusals(file) {
  const messages = readExecution(file);
  if (!messages) {
    console.log("No readable execution file; refused tools not checked.");
    return 0;
  }
  const refused = refusals(messages);
  console.log(`Permission denials: ${refused.length}`);
  for (const r of refused) console.log(`::error::Refused tool: ${r.tool}: ${r.input || "(no input)"}`);
  return refused.length > 0 ? 1 : 0;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [command, ...args] = process.argv.slice(2);
  if (command === "check") process.exit(checkRefusals(args[0]));
  else if (command === "outcome" && args[0]) process.exit(checkOutcome(args[0]));
  else if (command === "block" && args[0] && args[2]) blockIssue(args[0], args[1], args[2]);
  else {
    console.error("usage: claude-run.mjs check <file> | outcome <issue> | block <issue> <file> <run-url>");
    process.exit(2);
  }
}
