// Links pull requests to issues (issue #185). Shared by deliver.mjs and dispatch.mjs; #186 reuses it.
// A plain `#N` mention or `Part of #N` never links: only a closing keyword or the branch name does.

const BRANCH_TYPES = "feat|fix|chore|test|spike|docs";

/**
 * Tells whether a pull request body closes an issue with a closing keyword.
 *
 * @param {number} number Issue number.
 * @param {string | null | undefined} body Pull request body.
 * @returns {boolean} True for `Closes #N`, `Fixes #N` or `Resolves #N` (any tense, any case).
 */
export function hasClosingKeyword(number, body) {
  return new RegExp(`\\b(?:close[sd]?|fix(?:e[sd])?|resolve[sd]?)\\s+#${number}\\b`, "i").test(
    String(body ?? ""),
  );
}

/**
 * Tells whether a branch name belongs to an issue.
 *
 * @param {number} number Issue number.
 * @param {string | null | undefined} branch Head branch name.
 * @returns {boolean} True for `<type>/<N>-...`.
 */
export function branchMatches(number, branch) {
  return new RegExp(`^(?:${BRANCH_TYPES})/${number}-`).test(String(branch ?? ""));
}

/**
 * Finds the open pull request that works on an issue.
 *
 * @param {number} number Issue number.
 * @param {object[]} prs Pull requests from `gh pr list` (`headRefName`) or REST (`head.ref`).
 * @returns {object | null} The first open pull request linked by closing keyword or branch name.
 */
export function findIssuePr(number, prs) {
  const open = prs.filter((pr) => (pr.state ?? "open").toLowerCase() === "open");
  return (
    open.find(
      (pr) => hasClosingKeyword(number, pr.body) || branchMatches(number, pr.headRefName ?? pr.head?.ref),
    ) ?? null
  );
}
