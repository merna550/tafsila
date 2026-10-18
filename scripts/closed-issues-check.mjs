#!/usr/bin/env node
// One-off check (issue #186): lists closed issues of a milestone that no merged PR closes or names by branch.
// Usage: node scripts/closed-issues-check.mjs "M1 - Accounts & data" ["M2 ..."]   (needs gh, REST only)
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { branchMatches, hasClosingKeyword } from "./issue-link.mjs";

/**
 * Finds closed issues that no merged pull request links.
 *
 * @param {Array<{number: number, title: string}>} issues Closed issues.
 * @param {object[]} mergedPrs Merged pull requests (`body`, `head.ref`).
 * @returns {Array<{number: number, title: string}>} Issues without a merged PR (the exceptions to review).
 */
export function issuesWithoutMergedPr(issues, mergedPrs) {
  return issues.filter(
    (issue) =>
      !mergedPrs.some(
        (pr) => hasClosingKeyword(issue.number, pr.body) || branchMatches(issue.number, pr.head?.ref),
      ),
  );
}

/**
 * Reads every page of a REST list with `gh api`.
 *
 * @param {string} path REST path with a query string.
 * @returns {object[]} All items.
 */
function readAll(path) {
  // eslint-disable-next-line sonarjs/no-os-command-from-path -- `gh` is the GitHub CLI
  const out = execFileSync("gh", ["api", "--paginate", "--slurp", path], {
    encoding: "utf8",
    maxBuffer: 1 << 28,
  });
  return JSON.parse(out).flat();
}

/** Prints the exceptions for the milestones given on the command line. */
function main() {
  const repo = process.env.GH_REPO ?? "merna550/tafsila";
  const milestones = readAll(`repos/${repo}/milestones?state=all&per_page=100`);
  const prs = readAll(`repos/${repo}/pulls?state=closed&per_page=100`).filter((pr) => pr.merged_at);
  for (const title of process.argv.slice(2)) {
    const milestone = milestones.find((m) => m.title.startsWith(title));
    if (!milestone) {
      console.log(`${title}: milestone not found`);
      continue;
    }
    const closed = readAll(
      `repos/${repo}/issues?state=closed&milestone=${milestone.number}&per_page=100`,
    ).filter((i) => !i.pull_request);
    const exceptions = issuesWithoutMergedPr(closed, prs);
    console.log(`${milestone.title}: ${closed.length} closed, ${exceptions.length} without a merged PR`);
    for (const e of exceptions) console.log(`  #${e.number} ${e.title}`);
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
