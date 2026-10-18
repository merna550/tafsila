#!/usr/bin/env node
// CLI of `/deliver` (issue #185, decisions in docs/decisions/185-deliver-merge-gate.md). Every command prints one
// JSON line. Rules: deliver-rules.mjs, GitHub steps: deliver-actions.mjs, clients: deliver-client.mjs.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { base, block, fixBody, gate, merge, queue, start } from "./deliver-actions.mjs";
import { createFakeClient, createRestClient, dryRunClient, httpError, rp, run } from "./deliver-client.mjs";
import { doctorProblems, preflightVerdict, summary } from "./deliver-rules.mjs";
import { findIssuePr } from "./issue-link.mjs";

export * from "./deliver-actions.mjs";
export * from "./deliver-client.mjs";
export * from "./deliver-rules.mjs";

/**
 * Runs the `doctor` checks against the real environment.
 *
 * @param {string} repo Repository slug.
 * @returns {string[]} Problems.
 */
function doctor(repo) {
  const ok = (file, args) => {
    try {
      return run(file, args);
    } catch {
      return null;
    }
  };
  return doctorProblems({
    ghOk: ok("gh", ["--version"]) !== null,
    repoOk: ok("gh", ["api", `repos/${repo}`]) !== null,
    dirty: (ok("git", ["status", "--porcelain"]) ?? "x").trim() !== "",
    branch: (ok("git", ["branch", "--show-current"]) ?? "").trim(),
  });
}

/**
 * Reads `owner/name` from `GH_REPO` or the origin remote.
 *
 * @returns {string} Repository slug.
 */
function repoSlug() {
  if (process.env.GH_REPO) return process.env.GH_REPO;
  const remote = run("git", ["remote", "get-url", "origin"]).trim();
  return remote.replace(/\.git$/, "").split(/github\.com[/:]/)[1];
}

const USAGE = `usage: node scripts/deliver.mjs <command> [args] [--pr P] [--wait] [--dry-run] [--fixture file]
commands: doctor | queue <#N...|next [k]> | preflight N | start N | find-pr N | gate N --pr P [--wait]
          fix-body N --pr P | merge N --pr P [--confirmed] | base [--wait] | block N --reason "..." | summary '<json>'`;

/**
 * Runs one CLI command and returns its JSON-serialisable result.
 *
 * @param {string} cmd Command name.
 * @param {string[]} rest Positional arguments after the command.
 * @param {object} flags Parsed flags.
 * @param {object} client Client.
 * @returns {Promise<unknown>} Result.
 */
async function dispatchCommand(cmd, rest, flags, client) {
  const n = Number(String(rest[0] ?? "").replace("#", ""));
  const pr = Number(flags.pr);
  const timers = { sleep: (ms) => new Promise((r) => setTimeout(r, ms)), now: Date.now };
  const options = { wait: Boolean(flags.wait), confirmed: Boolean(flags.confirmed), ...timers };
  const prs = () => client.get(rp(client, "pulls?state=open&per_page=100"));
  const table = {
    queue: () => queue(client, rest),
    preflight: () => preflightVerdict(client.get(rp(client, `issues/${n}`)), prs()),
    start: () => start(client, n),
    "find-pr": () => ({ pr: findIssuePr(n, prs())?.number ?? null }),
    gate: () => gate(client, n, pr, options),
    "fix-body": () => fixBody(client, n, pr),
    merge: () => merge(client, n, pr, options),
    base: () => base(client, options),
    block: () => block(client, n, String(flags.reason ?? "unspecified")),
    summary: () => ({ text: summary(JSON.parse(rest[0])) }),
  };
  if (!table[cmd]) throw httpError(2, `unknown command: ${cmd}`);
  return table[cmd]();
}

/**
 * CLI entry: parses arguments, builds the client and prints one JSON line.
 *
 * @param {string[]} argv Arguments after the script path.
 * @returns {Promise<number>} Exit code.
 */
export async function main(argv) {
  const { positionals, values } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: {
      pr: { type: "string" },
      wait: { type: "boolean" },
      "dry-run": { type: "boolean" },
      fixture: { type: "string" },
      reason: { type: "string" },
      confirmed: { type: "boolean" },
    },
  });
  const [cmd, ...rest] = positionals;
  if (!cmd) {
    console.error(USAGE);
    return 2;
  }
  if (cmd === "doctor") {
    const problems = doctor(repoSlug());
    console.log(JSON.stringify({ ok: problems.length === 0, problems }));
    return problems.length === 0 ? 0 : 1;
  }
  let client = values.fixture
    ? createFakeClient(JSON.parse(readFileSync(values.fixture, "utf8")))
    : createRestClient(repoSlug());
  if (values["dry-run"] || values.fixture) client = dryRunClient(client, console.log);
  try {
    console.log(JSON.stringify(await dispatchCommand(cmd, rest, values, client)));
    return 0;
  } catch (error) {
    console.error(error.status === 2 ? `${error.message}\n${USAGE}` : `deliver failed: ${error.message}`);
    return error.status === 2 ? 2 : 1;
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) process.exitCode = await main(process.argv.slice(2));
