import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, it } from "vitest";
import { ENGINE_MARKERS, PDF_MARKERS, problemsOf, scanEngineChunks } from "./check-engine-chunk.mjs";

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

const ENGINE = ENGINE_MARKERS[0];
const PDF = PDF_MARKERS[0];

it("code that only a worker chunk holds is fine, for both groups", () => {
  const dir = fakeBuild(
    { "a.js": ENGINE, "w.js": `${PDF} ${PDF_MARKERS[1]}`, "b.js": "page code" },
    '["b.js"]',
  );
  const scan = scanEngineChunks(dir);
  expect(scan.engine).toEqual({ chunks: ["a.js"], loadedByPage: [] });
  expect(scan.pdf).toEqual({ chunks: ["w.js"], loadedByPage: [] });
  expect(problemsOf(scan)).toEqual([]);
});

it("an engine chunk that a page loads is reported", () => {
  const dir = fakeBuild({ "a.js": ENGINE_MARKERS[1], "w.js": PDF }, '["a.js"]');
  expect(scanEngineChunks(dir).engine.loadedByPage).toEqual(["a.js"]);
  expect(problemsOf(scanEngineChunks(dir))[0]).toContain("engine code is loaded by a page bundle");
});

it("a pdf marker in a page chunk fails", () => {
  const dir = fakeBuild({ "a.js": ENGINE, "p.js": PDF }, '["p.js"]');
  const problems = problemsOf(scanEngineChunks(dir));
  expect(problems).toHaveLength(1);
  expect(problems[0]).toContain("pdf code is loaded by a page bundle: p.js");
});

it("a group that no chunk holds fails, because the worker was not bundled", () => {
  const dir = fakeBuild({ "a.js": ENGINE }, '["x.js"]');
  expect(problemsOf(scanEngineChunks(dir))).toEqual([
    "no chunk holds the pdf code, so its worker was not bundled.",
  ]);
});

it("one chunk may hold both groups when no page loads it", () => {
  const dir = fakeBuild({ "shared.js": `${ENGINE} ${PDF}` }, "[]");
  expect(problemsOf(scanEngineChunks(dir))).toEqual([]);
});
