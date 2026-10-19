#!/usr/bin/env node
/**
 * Build-output guard (issue #239): the engine geometry must load only in the pattern preview worker, never in a page
 * bundle. After `next build`, finds the chunks that contain engine drafting code and fails when any page's client
 * manifest loads one of them.
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

/** Strings that exist only in the engine's drafting code (error codes thrown by the geometry kit and the sleeve block). */
export const ENGINE_MARKERS = ["GEOMETRY_DEGENERATE_SEGMENT", "SLEEVE_CAP_UNSOLVABLE"];

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
 * Checks a build output.
 *
 * @param nextDir - The `.next` folder.
 * @returns The chunk files that hold engine code, and those of them that a page loads.
 */
export function scanEngineChunks(nextDir) {
  const chunks = walk(join(nextDir, "static"), (n) => n.endsWith(".js")).filter((file) => {
    const text = readFileSync(file, "utf8");
    return ENGINE_MARKERS.some((marker) => text.includes(marker));
  });
  const manifests = walk(join(nextDir, "server", "app"), (n) =>
    n.endsWith("_client-reference-manifest.js"),
  ).map((f) => readFileSync(f, "utf8"));
  const names = chunks.map((file) => file.split("/").pop());
  const loadedByPage = names.filter((name) => manifests.some((text) => text.includes(name)));
  return { chunks: names, loadedByPage };
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const nextDir = process.argv[2] ?? "apps/web/.next";
  const { chunks, loadedByPage } = scanEngineChunks(nextDir);
  if (chunks.length === 0) {
    console.error("check-engine-chunk: no chunk holds the engine, so the preview worker was not bundled.");
    process.exit(1);
  }
  if (loadedByPage.length > 0) {
    console.error(`check-engine-chunk: engine code is loaded by a page bundle: ${loadedByPage.join(", ")}`);
    process.exit(1);
  }
  console.log(`check-engine-chunk: engine code is only in worker chunks (${chunks.join(", ")}).`);
}
