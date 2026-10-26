#!/usr/bin/env node
/**
 * Build-output guard (issues #239 and #289): heavy code must load only in a Web Worker, never in a page bundle. There
 * is one marker group per kind of code: the engine geometry (preview worker) and `pdf-lib` with its font reader
 * (export worker). After `next build`, finds the chunks that contain each group and fails when a group is in no chunk
 * (the worker did not bundle it) or when any page's client manifest loads a chunk that holds it.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * Strings that exist only in the engine's drafting code: the messages thrown by the geometry kit and the sleeve block.
 * Not the error codes: the picker rules (`@tafsila/engine/spec-rules`, issue #244) legitimately carry the code names.
 */
export const ENGINE_MARKERS = ["Segment has zero length", "No cap height fits a"];

/**
 * Strings that exist only in `pdf-lib` and in the font reader it uses (`@pdf-lib/fontkit`): one error message of each.
 * Both survive minification because they are string literals.
 */
export const PDF_MARKERS = [
  "Failed to parse PDF literal string due to unbalanced parenthesis",
  "Calling transform done when still transforming",
];

/** The marker groups the guard checks, by name. */
export const MARKER_GROUPS = { engine: ENGINE_MARKERS, pdf: PDF_MARKERS };

/**
 * Lists files below a folder that match a name test.
 *
 * @param dir - Folder to walk; a missing folder gives an empty list.
 * @param test - Receives the file name.
 * @returns Full paths.
 */
function walk(dir, test) {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return [];
  }
  return entries.flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return walk(path, test);
    return test(name) ? [path] : [];
  });
}

/**
 * Checks a build output for one marker group.
 *
 * @param nextDir - The `.next` folder.
 * @param markers - Strings that identify the group's code.
 * @returns The chunk files that hold the code, and those of them that a page loads.
 */
export function scanChunks(nextDir, markers) {
  const chunks = walk(join(nextDir, "static"), (n) => n.endsWith(".js")).filter((file) => {
    const text = readFileSync(file, "utf8");
    return markers.some((marker) => text.includes(marker));
  });
  const manifests = walk(join(nextDir, "server", "app"), (n) =>
    n.endsWith("_client-reference-manifest.js"),
  ).map((f) => readFileSync(f, "utf8"));
  const names = chunks.map((file) => file.split("/").pop());
  const loadedByPage = names.filter((name) => manifests.some((text) => text.includes(name)));
  return { chunks: names, loadedByPage };
}

/**
 * Checks a build output for every marker group.
 *
 * @param nextDir - The `.next` folder.
 * @returns For each group name, the chunks that hold it and those a page loads.
 */
export function scanEngineChunks(nextDir) {
  return Object.fromEntries(
    Object.entries(MARKER_GROUPS).map(([name, markers]) => [name, scanChunks(nextDir, markers)]),
  );
}

/**
 * Turns scan results into error lines.
 *
 * @param scan Result of {@link scanEngineChunks}.
 * @returns One line per problem; empty when the build is fine.
 */
export function problemsOf(scan) {
  return Object.entries(scan).flatMap(([name, { chunks, loadedByPage }]) => {
    if (chunks.length === 0) return [`no chunk holds the ${name} code, so its worker was not bundled.`];
    if (loadedByPage.length > 0) {
      return [`${name} code is loaded by a page bundle: ${loadedByPage.join(", ")}`];
    }
    return [];
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const nextDir = process.argv[2] ?? "apps/web/.next";
  const scan = scanEngineChunks(nextDir);
  const problems = problemsOf(scan);
  if (problems.length > 0) {
    for (const line of problems) console.error(`check-engine-chunk: ${line}`);
    process.exit(1);
  }
  for (const [name, { chunks }] of Object.entries(scan)) {
    console.log(`check-engine-chunk: ${name} code is only in worker chunks (${chunks.join(", ")}).`);
  }
}
