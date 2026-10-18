#!/usr/bin/env node
// Evidence for issue #188: replays the CI path rules over the last merged pull requests and prints, per target,
// in how many PRs it would have run before (the old rules, kept below) and after (scripts/ci-paths.mjs).
// Usage: node scripts/ci-savings.mjs [count=30]   (needs gh; file lists come from the GitHub REST API)
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { needsJob } from "./ci-paths.mjs";

/** Files the old docker rule ignored. */
const OLD_DOCKER_SKIP = [
  /\.stories\.[cm]?[jt]sx?$/,
  /\.(test|spec)\.[cm]?[jt]sx?$/,
  /\.mdx?$/,
  /(^|\/)(__snapshots__|__tests__|e2e|test-results|\.storybook)\//,
];

/** The checks that ran for every change before issue #188 (always on in the quality job). */
const ALWAYS = ["jscpd", "depcruise", "docs", "tokens", "scripts"];

/**
 * Old rules for the targets #188 refined; targets in ALWAYS ran for every PR.
 *
 * @param target Target name.
 * @param files Changed files.
 * @returns True when the target ran before the change.
 */
export function ranBefore(target, files) {
  if (ALWAYS.includes(target)) return true;
  const base = needsJob(target, files);
  if (target === "e2e")
    return (
      files.some(
        (f) =>
          /^packages\/(schemas|utils)\//.test(f) && !/\.(test|mdx?)$|\.(test|stories)\.[cm]?[jt]sx?$/.test(f),
      ) || base
    );
  if (target === "docker")
    return files.some((f) => /^packages\//.test(f) && !OLD_DOCKER_SKIP.some((re) => re.test(f))) || base;
  return base;
}

/**
 * Counts, per target, the PRs where it runs before and after.
 *
 * @param prs List of changed-file lists, one per PR.
 * @param targets Target names.
 * @returns Map of target to `{ before, after }`.
 */
export function replay(prs, targets) {
  return Object.fromEntries(
    targets.map((t) => [
      t,
      {
        before: prs.filter((files) => ranBefore(t, files)).length,
        after: prs.filter((files) => needsJob(t, files)).length,
      },
    ]),
  );
}

/**
 * Runs `gh api` and parses the JSON result.
 *
 * @param path REST path.
 * @returns Parsed JSON.
 */
function gh(path) {
  // eslint-disable-next-line sonarjs/no-os-command-from-path -- gh
  return JSON.parse(execFileSync("gh", ["api", path], { encoding: "utf8", maxBuffer: 1 << 28 }));
}

/**
 * Reads `owner/repo` from the origin remote.
 *
 * @returns The repository slug.
 */
function repoFromRemote() {
  // eslint-disable-next-line sonarjs/no-os-command-from-path -- git
  const url = execFileSync("git", ["remote", "get-url", "origin"], { encoding: "utf8" }).trim();
  return url
    .replace(/\.git$/, "")
    .split(/[/:]/)
    .slice(-2)
    .join("/");
}

/**
 * Prints the table for the last merged PRs.
 */
function main() {
  const count = Number(process.argv[2] ?? 30);
  const repo = process.env.GITHUB_REPOSITORY ?? repoFromRemote();
  const merged = gh(`repos/${repo}/pulls?state=closed&sort=updated&direction=desc&per_page=100`)
    .filter((pr) => pr.merged_at)
    .slice(0, count);
  const prs = merged.map((pr) =>
    gh(`repos/${repo}/pulls/${pr.number}/files?per_page=100`).map((f) => f.filename),
  );
  const targets = [
    "jscpd",
    "depcruise",
    "docs",
    "tokens",
    "scripts",
    "e2e",
    "docker",
    "storybook",
    "supabase",
    "api",
  ];
  console.log(`Last ${prs.length} merged PRs\n\n| Target | Ran before | Runs after |\n| --- | --- | --- |`);
  for (const [t, r] of Object.entries(replay(prs, targets)))
    console.log(`| ${t} | ${r.before} | ${r.after} |`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
