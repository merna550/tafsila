// Reads the JSON a Claude Code hook receives on stdin and prints one field (issue #17).
// Usage: node read-hook-input.mjs tool_input.file_path   → prints the value, or nothing when absent.
// Kept separate so the hook scripts do not need `jq`.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

/**
 * Follows a dotted path ("a.b.c") into an object.
 *
 * @param value Parsed hook input.
 * @param path Dotted field path.
 * @returns The field value, or undefined when any step is missing.
 */
export function pick(value, path) {
  return path.split(".").reduce((node, key) => (node == null ? undefined : node[key]), value);
}

/**
 * Parses stdin and writes the requested field to stdout. Bad or empty input prints nothing.
 */
function main() {
  let input;
  try {
    input = JSON.parse(readFileSync(0, "utf8"));
  } catch {
    return;
  }
  const found = pick(input, process.argv[2] ?? "");
  if (found !== undefined && found !== null) process.stdout.write(String(found));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
