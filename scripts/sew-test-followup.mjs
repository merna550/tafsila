#!/usr/bin/env node
// Warns when an engine PR labelled `needs:sew-test` names no follow-up toile issue (issue #184).
import { pathToFileURL } from "node:url";

const FOLLOW_UP_LINE = /^sew-test follow-up: #\d+/im;

/**
 * Decides whether a PR needs a sew-test follow-up issue and whether its body names one.
 *
 * @param {string} body Pull request body.
 * @param {string[]} labels Label names on the pull request.
 * @returns {{ required: boolean, missing: boolean }} Whether a follow-up is required and absent.
 */
export function checkSewTestFollowUp(body, labels) {
  const required = labels.includes("needs:sew-test") && labels.includes("area:engine");
  return { required, missing: required && !FOLLOW_UP_LINE.test(body ?? "") };
}

/**
 * Prints a GitHub Actions warning when the follow-up is missing; never fails (warning level).
 *
 * @param {string} body Pull request body.
 * @param {string} labelsJson JSON array of label names.
 * @returns {string} The warning line, or an empty string.
 */
export function warningFor(body, labelsJson) {
  const { missing } = checkSewTestFollowUp(body, JSON.parse(labelsJson || "[]"));
  return missing
    ? "::warning title=Sew-test follow-up missing::This engine PR has needs:sew-test but its body has no 'Sew-test follow-up: #N' line. Open 'test(engine): sew-test toiles for #N' (docs/WORKFLOW.md)."
    : "";
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const line = warningFor(process.env.PR_BODY ?? "", process.env.PR_LABELS ?? "[]");
  if (line) console.log(line);
}
