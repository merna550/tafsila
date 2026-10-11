// Actions usage report (issue #86): sums run time per workflow over the last N days, REST only (`gh api`).
// Usage: node scripts/actions-usage.mjs [--days 30] [--jobs]
//   default: wall-clock time of each run (fast, one request per 100 runs; under-counts parallel jobs)
//   --jobs:  billed minutes = every job rounded up to a whole minute (one extra request per run, closer to the bill)
// Needs a token that can read Actions run data (a 403 means the token cannot; the aggregation is unit-tested).
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const MS_PER_MINUTE = 60_000;
const DEFAULT_DAYS = 30;

/**
 * Converts a start and end timestamp into milliseconds.
 *
 * @param start ISO start time.
 * @param end ISO end time.
 * @returns Duration in ms, 0 when a value is missing or negative.
 */
export function durationMs(start, end) {
  const ms = Date.parse(end) - Date.parse(start);
  return Number.isFinite(ms) && ms > 0 ? ms : 0;
}

/**
 * Billed minutes of a list of jobs: each job is rounded up to a whole minute.
 *
 * @param jobs Jobs as `{ started_at, completed_at }`.
 * @returns Billed minutes.
 */
export function billedMinutes(jobs) {
  return jobs.reduce(
    (sum, j) => sum + Math.ceil(durationMs(j.started_at, j.completed_at) / MS_PER_MINUTE),
    0,
  );
}

/**
 * Sums runs per workflow name.
 *
 * @param runs Runs as `{ name, created_at, run_started_at, updated_at, minutes? }`; `minutes` overrides wall-clock.
 * @param sinceIso Only runs created at or after this ISO time are counted.
 * @returns Rows `{ workflow, runs, minutes }` sorted by minutes, biggest first.
 */
export function aggregateUsage(runs, sinceIso) {
  const rows = new Map();
  for (const r of runs) {
    if (Date.parse(r.created_at) < Date.parse(sinceIso)) continue;
    const row = rows.get(r.name) ?? { workflow: r.name, runs: 0, minutes: 0 };
    row.runs += 1;
    row.minutes += r.minutes ?? durationMs(r.run_started_at, r.updated_at) / MS_PER_MINUTE;
    rows.set(r.name, row);
  }
  return [...rows.values()].sort((a, b) => b.minutes - a.minutes || a.workflow.localeCompare(b.workflow));
}

/**
 * Formats rows as a Markdown table with a total line.
 *
 * @param rows Rows from `aggregateUsage`.
 * @returns Markdown table.
 */
export function formatTable(rows) {
  const lines = ["| Workflow | Runs | Minutes |", "| --- | ---: | ---: |"];
  for (const r of rows) lines.push(`| ${r.workflow} | ${r.runs} | ${r.minutes.toFixed(1)} |`);
  const total = rows.reduce((s, r) => ({ runs: s.runs + r.runs, minutes: s.minutes + r.minutes }), {
    runs: 0,
    minutes: 0,
  });
  lines.push(`| **Total** | **${total.runs}** | **${total.minutes.toFixed(1)}** |`);
  return lines.join("\n");
}

/**
 * Calls the GitHub REST API through `gh api` and parses the JSON.
 *
 * @param path REST path, for example `repos/o/r/actions/runs`.
 * @returns Parsed JSON response.
 */
// eslint-disable-next-line sonarjs/no-os-command-from-path -- `gh` is the GitHub CLI
const api = (path) => JSON.parse(execFileSync("gh", ["api", path], { encoding: "utf8", maxBuffer: 1 << 28 }));

/**
 * Reads the runs created since a date, page by page.
 *
 * @param repo `owner/name`.
 * @param sinceDay `YYYY-MM-DD`.
 * @returns Workflow runs.
 */
function fetchRuns(repo, sinceDay) {
  const runs = [];
  for (let page = 1; ; page++) {
    const body = api(`repos/${repo}/actions/runs?per_page=100&page=${page}&created=>=${sinceDay}`);
    runs.push(...body.workflow_runs);
    if (body.workflow_runs.length < 100) return runs;
  }
}

/**
 * Reads `owner/name` from the git `origin` remote (no GraphQL).
 *
 * @returns Repository slug.
 */
function repoFromRemote() {
  // eslint-disable-next-line sonarjs/no-os-command-from-path -- git
  const url = execFileSync("git", ["remote", "get-url", "origin"], { encoding: "utf8" }).trim();
  return url.replace(/\.git$/, "").split(/github\.com[/:]/)[1];
}

/**
 * Prints the usage table for the repository named by `GH_REPO` (or the current git remote).
 */
function main() {
  const args = process.argv.slice(2);
  const at = args.indexOf("--days");
  const days = at >= 0 ? Number(args[at + 1]) : DEFAULT_DAYS;
  const since = new Date(Date.now() - days * 24 * 60 * MS_PER_MINUTE);
  const repo = process.env.GH_REPO ?? repoFromRemote();
  let runs = fetchRuns(repo, since.toISOString().slice(0, 10));
  if (args.includes("--jobs")) {
    runs = runs.map((r) => ({
      ...r,
      minutes: billedMinutes(api(`repos/${repo}/actions/runs/${r.id}/jobs?per_page=100`).jobs),
    }));
  }
  console.log(
    `Actions usage for ${repo}, last ${days} days (${args.includes("--jobs") ? "billed" : "wall-clock"} minutes)\n`,
  );
  console.log(formatTable(aggregateUsage(runs, since.toISOString())));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
