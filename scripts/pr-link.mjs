#!/usr/bin/env node
// Links a pull request to its issue (issue #186): `Closes #N` on the first line, no `Part of #N`, base `main`.
// `planPrLink` is pure; `applyPlan` writes through the client of deliver-client.mjs; the CLI is run by
// .github/workflows/pr-link.yml. Closing keywords and branch names come from issue-link.mjs (issue #185).
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { createFakeClient, createRestClient, rp } from "./deliver-client.mjs";
import { hasClosingKeyword } from "./issue-link.mjs";

export const NEEDS_LINK = "needs:link";
export const STACKED = "stacked";
const BRANCH_ISSUE = /^(?:feat|fix|chore|test|spike|docs)\/(\d+)-/;
const TITLE_ISSUE = /\(#(\d+)\)\s*$/;
const ANY_CLOSING = /\b(?:close[sd]?|fix(?:e[sd])?|resolve[sd]?)\s+#\d+/i;

/**
 * Finds the issue number of a pull request from its branch name, else from a `(#N)` title suffix.
 *
 * @param {{head?: {ref?: string}, title?: string}} pr Pull request.
 * @returns {number | null} Issue number, or null when neither names one.
 */
export function issueOf(pr) {
  const fromBranch = BRANCH_ISSUE.exec(pr.head?.ref ?? "")?.[1];
  const fromTitle = TITLE_ISSUE.exec(pr.title ?? "")?.[1];
  const found = fromBranch ?? fromTitle;
  return found ? Number(found) : null;
}

/**
 * Builds the comment that explains the `Closes` rule to a PR that only says `Part of #N`.
 *
 * @param {number} issue Issue number.
 * @returns {string} Comment text.
 */
const partOfComment = (issue) =>
  [
    `This PR says \`Part of #${issue}\`, which does not link or close the issue.`,
    "",
    "Rule (issue #186): a PR for an issue has `Closes #N` on the first line of its body. Split a multi-part issue",
    "into child issues, one PR each. If this PR truly must not close the issue, ignore this note.",
  ].join("\n");

/**
 * Decides what to change on a pull request. No I/O.
 *
 * @param {object} pr Pull request from the event or REST (`body`, `title`, `head.ref`, `base.ref`, `labels`, `draft`).
 * @returns {{issue: number | null, failure: string | null, notice: string | null, actions: object[]}} Plan:
 *   `failure` fails the check, `notice` is informational, `actions` are `set-body`, `comment`, `label`, `unlabel`.
 */
export function planPrLink(pr) {
  const labels = (pr.labels ?? []).map((l) => (typeof l === "string" ? l : l.name));
  const issue = issueOf(pr);
  const failure =
    pr.base?.ref !== "main" && !labels.includes(STACKED)
      ? `base must be main (this PR targets ${pr.base?.ref}); add the label "${STACKED}" only for a deliberate stack`
      : null;
  if (issue === null)
    return { issue, failure, actions: [], notice: "no issue number in the branch or title: nothing to link" };
  return { issue, failure, notice: null, ...bodyPlan(issue, String(pr.body ?? ""), labels) };
}

/**
 * Plans the body, comment and label changes for an issue-linked pull request.
 *
 * @param {number} issue Issue number.
 * @param {string} body Pull request body.
 * @param {string[]} labels Label names.
 * @returns {{actions: object[], notice?: string}} Actions and an optional notice.
 */
function bodyPlan(issue, body, labels) {
  const hasLabel = labels.includes(NEEDS_LINK);
  if (hasClosingKeyword(issue, body))
    return { actions: hasLabel ? [{ type: "unlabel", name: NEEDS_LINK }] : [] };
  if (ANY_CLOSING.test(body))
    return { actions: [], notice: `body closes another issue, not #${issue}: left as is` };
  if (new RegExp(`\\bpart of\\s+#${issue}\\b`, "i").test(body))
    return {
      actions: hasLabel
        ? []
        : [
            { type: "comment", body: partOfComment(issue) },
            { type: "label", name: NEEDS_LINK },
          ],
    };
  return { actions: [{ type: "set-body", body: `Closes #${issue}\n\n${body}`.trimEnd() }] };
}

/**
 * Applies the actions of a plan to a pull request.
 *
 * @param {object} client Client from deliver-client.mjs.
 * @param {number} prNumber Pull request number.
 * @param {object[]} actions Actions of `planPrLink`.
 */
export function applyPlan(client, prNumber, actions) {
  for (const action of actions) {
    if (action.type === "set-body")
      client.write("PATCH", rp(client, `pulls/${prNumber}`), { body: action.body });
    if (action.type === "comment")
      client.write("POST", rp(client, `issues/${prNumber}/comments`), { body: action.body });
    if (action.type === "label")
      client.write("POST", rp(client, `issues/${prNumber}/labels`), { labels: [action.name] });
    if (action.type === "unlabel")
      client.write("DELETE", rp(client, `issues/${prNumber}/labels/${encodeURIComponent(action.name)}`));
  }
}

/**
 * Tells whether the head repository is a fork, whose token cannot write.
 *
 * @param {object} pr Pull request.
 * @returns {boolean} True for a fork.
 */
const isFork = (pr) => Boolean(pr.head?.repo) && pr.head.repo.full_name !== pr.base?.repo?.full_name;

/**
 * Runs the check for one pull request and reports it.
 *
 * @param {object} client Client.
 * @param {object} pr Pull request payload.
 * @returns {{exitCode: number, lines: string[]}} Exit code (1 only for a wrong base) and log lines.
 */
export function runPrLink(client, pr) {
  const plan = planPrLink(pr);
  const lines = [];
  if (plan.notice) lines.push(`notice: ${plan.notice}`);
  if (isFork(pr) && plan.actions.length > 0) {
    lines.push("notice: fork PR, the token cannot write: no changes made");
  } else {
    applyPlan(client, pr.number, plan.actions);
    for (const a of plan.actions) lines.push(`${a.type}: ${a.name ?? ""}`.trim());
  }
  if (plan.failure) lines.push(`error: ${plan.failure}`);
  return { exitCode: plan.failure ? 1 : 0, lines };
}

/**
 * CLI: reads the event payload (`GITHUB_EVENT_PATH`, or `--event file`) and runs the check; `--fixture file`
 * uses the in-memory client instead of `gh api`.
 *
 * @param {string[]} argv Arguments.
 * @returns {number} Exit code.
 */
export function main(argv) {
  const flag = (name) => argv[argv.indexOf(name) + 1];
  const event = JSON.parse(readFileSync(flag("--event") ?? process.env.GITHUB_EVENT_PATH, "utf8"));
  const fixture = argv.includes("--fixture") ? JSON.parse(readFileSync(flag("--fixture"), "utf8")) : null;
  const client = fixture ? createFakeClient(fixture) : createRestClient(process.env.GITHUB_REPOSITORY);
  const { exitCode, lines } = runPrLink(client, event.pull_request);
  for (const line of lines) console.log(line.replace(/^(error|notice): /, "::$1::"));
  return exitCode;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) process.exitCode = main(process.argv.slice(2));
