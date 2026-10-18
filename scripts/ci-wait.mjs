#!/usr/bin/env node
// Waits for every check on a PR head and prints only useful failure lines (issue #178).
import { execFileSync } from "node:child_process";
import { pathToFileURL } from "node:url";
import { stripVTControlCharacters } from "node:util";

const DEFAULT_POLL_MS = 20_000;
const DEFAULT_TIMEOUT_MS = 25 * 60_000;
const FAILURE_LINE_LIMIT = 40;
const GREEN_CONCLUSIONS = new Set(["success", "neutral", "skipped"]);
const FAILURE_LINE = /FAIL|Error|AssertionError|error TS|✘|×|threshold/;

/**
 * Removes terminal colour and control sequences from text.
 *
 * @param {string} text Terminal output.
 * @returns {string} Plain text without ANSI sequences.
 */
export function stripAnsi(text) {
  return stripVTControlCharacters(text);
}

/**
 * Selects only useful failure lines from a job log.
 *
 * @param {string} log Complete job log.
 * @param {number} limit Maximum number of returned lines.
 * @returns {string[]} Matching, ANSI-free log lines.
 */
export function extractFailureLines(log, limit = FAILURE_LINE_LIMIT) {
  return stripAnsi(log)
    .split(/\r?\n/)
    .filter((line) => FAILURE_LINE.test(line))
    .slice(0, limit);
}

/**
 * Calls a GitHub REST endpoint through `gh api` and parses its JSON response.
 *
 * @param {string} path Repository-relative REST path.
 * @returns {unknown} Parsed response body.
 */
function apiJson(path) {
  // eslint-disable-next-line sonarjs/no-os-command-from-path -- `gh` is the required GitHub REST client.
  return JSON.parse(execFileSync("gh", ["api", path], { encoding: "utf8", maxBuffer: 1 << 28 }));
}

/**
 * Downloads a GitHub REST response as text without echoing it to the terminal.
 *
 * @param {string} path Repository-relative REST path.
 * @returns {string} Response body.
 */
function apiText(path) {
  // eslint-disable-next-line sonarjs/no-os-command-from-path -- `gh` is the required GitHub REST client.
  return execFileSync("gh", ["api", path, "--allow-escape-sequences"], {
    encoding: "utf8",
    maxBuffer: 1 << 28,
    stdio: ["ignore", "pipe", "pipe"],
  });
}

/**
 * Reads `owner/name` from the `GH_REPO` environment variable or the git origin remote.
 *
 * @returns {string} GitHub repository slug.
 */
function repoFromEnvironment() {
  if (process.env.GH_REPO) return process.env.GH_REPO;
  // eslint-disable-next-line sonarjs/no-os-command-from-path -- git reads the current repository remote.
  const remote = execFileSync("git", ["remote", "get-url", "origin"], { encoding: "utf8" }).trim();
  const repo = remote.replace(/\.git$/, "").split(/github\.com[/:]/)[1];
  if (!repo) throw new Error(`Cannot read a GitHub repository from origin: ${remote}`);
  return repo;
}

/**
 * Reads every check run for a commit, including pages after the first 100 checks.
 *
 * @param {string} repo GitHub repository slug.
 * @param {string} sha Pull request head SHA.
 * @param {(path: string) => unknown} request JSON REST request function.
 * @returns {Promise<object[]>} All check runs for the commit.
 */
async function readChecks(repo, sha, request) {
  const checks = [];
  for (let page = 1; ; page++) {
    const body = await request(`repos/${repo}/commits/${sha}/check-runs?per_page=100&page=${page}`);
    checks.push(...body.check_runs);
    if (body.check_runs.length < 100) return checks;
  }
}

/**
 * Reads the current pull request head, mergeable state and check runs.
 *
 * @param {string} repo GitHub repository slug.
 * @param {number} prNumber Pull request number.
 * @param {(path: string) => unknown} request JSON REST request function.
 * @returns {Promise<object>} Current CI snapshot.
 */
async function readSnapshot(repo, prNumber, request) {
  const pull = await request(`repos/${repo}/pulls/${prNumber}`);
  return {
    mergeableState: pull.mergeable_state ?? "unknown",
    checks: await readChecks(repo, pull.head.sha, request),
  };
}

/**
 * Pauses between CI polls.
 *
 * @param {number} milliseconds Pause duration.
 * @returns {Promise<void>} Completion after the delay.
 */
const delay = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

/**
 * Reports mergeability and every check that is not green.
 *
 * @param {object} snapshot Current pull request state.
 * @param {(line: string) => void} writeLine Output sink.
 */
function reportSnapshot(snapshot, writeLine) {
  writeLine(`mergeable_state: ${snapshot.mergeableState}`);
  if (snapshot.checks.length === 0) {
    writeLine("check pending: no checks found");
    return;
  }
  for (const check of snapshot.checks) {
    if (check.status !== "completed") writeLine(`check pending: ${check.name} (${check.status})`);
    else if (!GREEN_CONCLUSIONS.has(check.conclusion))
      writeLine(`check failed: ${check.name} (${check.conclusion ?? "no conclusion"})`);
  }
}

/**
 * Prints at most forty matching lines from each failed job log.
 *
 * @param {object[]} failed Failed checks.
 * @param {(check: object) => Promise<string>} readLog Job-log reader.
 * @param {(line: string) => void} writeLine Output sink.
 * @returns {Promise<void>} Completion after all failed logs are inspected.
 */
async function reportFailureLogs(failed, readLog, writeLine) {
  for (const check of failed) {
    try {
      reportLogLines(check.name, extractFailureLines(await readLog(check)), writeLine);
    } catch (error) {
      writeLine(`failure log: ${check.name}: unavailable (${error.message})`);
    }
  }
}

/**
 * Writes the filtered lines for one failed job.
 *
 * @param {string} name Check name.
 * @param {string[]} lines Filtered job-log lines.
 * @param {(line: string) => void} writeLine Output sink.
 */
function reportLogLines(name, lines, writeLine) {
  if (lines.length === 0) {
    writeLine(`failure log: ${name}: no matching failure lines`);
    return;
  }
  for (const line of lines) writeLine(`failure log: ${name}: ${line}`);
}

/**
 * Fills optional polling dependencies with production defaults.
 *
 * @param {object} options Caller-supplied polling options.
 * @returns {object} Complete polling options.
 */
function pollingOptions(options) {
  return {
    snapshot: options.snapshot,
    readLog: options.readLog,
    sleep: options.sleep ?? delay,
    now: options.now ?? Date.now,
    writeLine: options.writeLine ?? console.log,
    pollMs: options.pollMs ?? DEFAULT_POLL_MS,
    timeoutMs: options.timeoutMs ?? DEFAULT_TIMEOUT_MS,
  };
}

/**
 * Classifies a snapshot once every check has completed.
 *
 * @param {object[]} checks Current check runs.
 * @returns {object[] | null} Failed checks, or null while CI is pending.
 */
function completedFailures(checks) {
  if (checks.length === 0 || checks.some((check) => check.status !== "completed")) return null;
  return checks.filter((check) => !GREEN_CONCLUSIONS.has(check.conclusion));
}

/**
 * Waits until all PR checks finish, a failure is found, or the timeout expires.
 *
 * @param {object} options Polling options and injectable dependencies.
 * @returns {Promise<0 | 1 | 2>} 0 for green, 1 for red, or 2 for timeout.
 */
export async function waitForCi(options) {
  const { snapshot, readLog, sleep, now, writeLine, pollMs, timeoutMs } = pollingOptions(options);
  const startedAt = now();
  for (;;) {
    const current = await snapshot();
    reportSnapshot(current, writeLine);
    const failed = completedFailures(current.checks);
    if (failed !== null) {
      if (failed.length > 0) await reportFailureLogs(failed, readLog, writeLine);
      return failed.length > 0 ? 1 : 0;
    }
    const elapsed = now() - startedAt;
    if (elapsed >= timeoutMs) return 2;
    await sleep(Math.min(pollMs, timeoutMs - elapsed));
  }
}

/**
 * Runs the CI wait command for one pull request.
 *
 * @param {number} prNumber Pull request number.
 * @returns {Promise<0 | 1 | 2>} Process exit code.
 */
async function run(prNumber) {
  const repo = repoFromEnvironment();
  return waitForCi({
    snapshot: () => readSnapshot(repo, prNumber, apiJson),
    readLog: (check) => Promise.resolve(apiText(`repos/${repo}/actions/jobs/${check.id}/logs`)),
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const prNumber = Number(process.argv[2]);
  if (!Number.isInteger(prNumber) || prNumber < 1) {
    console.error("usage: node scripts/ci-wait.mjs <pr-number>");
    process.exit(2);
  }
  try {
    process.exitCode = await run(prNumber);
  } catch (error) {
    console.error(`CI wait failed: ${error.message}`);
    process.exitCode = 1;
  }
}
