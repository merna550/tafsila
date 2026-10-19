import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, it } from "vitest";
import { scanEngineChunks } from "./check-engine-chunk.mjs";

/**
 * Writes a fake `.next` folder with the given chunks and one page manifest.
 *
 * @param {Record<string, string>} chunks Chunk file name to content.
 * @param {string} manifest Content of the page client manifest.
 * @returns {string} The folder.
 */
function fakeBuild(chunks, manifest) {
  const dir = mkdtempSync(join(tmpdir(), "engine-chunk-"));
  mkdirSync(join(dir, "static", "chunks"), { recursive: true });
  mkdirSync(join(dir, "server", "app", "page"), { recursive: true });
  for (const [name, text] of Object.entries(chunks)) writeFileSync(join(dir, "static", "chunks", name), text);
  writeFileSync(join(dir, "server", "app", "page", "page_client-reference-manifest.js"), manifest);
  return dir;
}

it("an engine chunk that no page loads is fine", () => {
  const dir = fakeBuild({ "a.js": "GEOMETRY_DEGENERATE_SEGMENT", "b.js": "page code" }, '["b.js"]');
  expect(scanEngineChunks(dir)).toEqual({ chunks: ["a.js"], loadedByPage: [] });
});

it("an engine chunk that a page loads is reported", () => {
  const dir = fakeBuild({ "a.js": "SLEEVE_CAP_UNSOLVABLE" }, '["a.js"]');
  expect(scanEngineChunks(dir).loadedByPage).toEqual(["a.js"]);
});
