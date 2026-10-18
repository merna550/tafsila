// Maps an issue's status:* label (or closed state) to a board column; used by board-sync.yml (issue #183).
import { pathToFileURL } from "node:url";

/** Board column for each status label; WORKFLOW.md section 8 is the contract. */
export const COLUMN_BY_LABEL = {
  "status:triage": "Backlog",
  "status:needs-plan": "Backlog",
  "status:plan-review": "Backlog",
  "status:ready": "Ready",
  "status:in-progress": "In progress",
  "status:changes-requested": "In progress",
  "status:in-review": "In review",
};

/**
 * Picks the board column for an issue.
 *
 * @param labels Label names on the issue.
 * @param closed Whether the issue (or merged PR) is closed.
 * @returns Column name, or null when nothing maps.
 */
export function columnFor(labels, closed) {
  if (closed) return "Done";
  const hit = labels.find((name) => COLUMN_BY_LABEL[name]);
  return hit ? COLUMN_BY_LABEL[hit] : null;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const [closed, ...labels] = process.argv.slice(2);
  process.stdout.write(columnFor(labels, closed === "true") ?? "");
}
