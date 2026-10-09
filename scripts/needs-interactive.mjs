// Decides whether an issue needs the `needs:interactive` label (issue #58): work on Claude's own configuration
// (.claude/ settings, agents, commands, hooks) is a safety boundary built with Merna present, never by the dispatcher.
// Used by /triage and /plan with the files the work will touch.
import { pathToFileURL } from "node:url";

/** Path prefixes of Claude's own configuration; the hook scripts in scripts/hooks/ run from .claude/settings.json. */
export const INTERACTIVE_PREFIXES = [".claude/", "scripts/hooks/"];

/**
 * Tells whether any of the given repository paths is Claude configuration.
 *
 * @param {string[]} paths Repository-relative file or folder paths (a leading "./" is ignored).
 * @returns {boolean} True when the work must be built in an interactive session.
 * @example
 * needsInteractive([".claude/settings.json", "docs/WORKFLOW.md"]); // true
 */
export function needsInteractive(paths) {
  return paths
    .map((path) => path.replace(/^\.\//, ""))
    .some((path) => path === ".claude" || INTERACTIVE_PREFIXES.some((prefix) => path.startsWith(prefix)));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const paths = process.argv.slice(2);
  if (paths.length === 0) {
    console.error("usage: node scripts/needs-interactive.mjs <path> [path...]");
    process.exit(2);
  }
  console.log(needsInteractive(paths) ? "yes" : "no");
}
