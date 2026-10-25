/** The A4 tiled PDF: cover page with the test square and page map, then one page per non-empty tile (decision 288). */
import type { PatternScene } from "@tafsila/engine";
import type { PatternResult } from "@tafsila/schemas";
import { buildTiledPdf } from "./tiled-pdf";
import type { PdfBuildOptions, PdfMeta, PdfOutput } from "./types";

/**
 * Builds the A4 PDF of a pattern at 1:1 scale. Runs in the browser (a web worker wired in #289); no DOM.
 *
 * @param result - The generated pattern.
 * @param scene - The scene of the same pattern (`buildPatternScene(result)`).
 * @param meta - Title block data and the fixed creation date.
 * @param options - Fonts and progress callback.
 * @returns The PDF bytes and page counts.
 */
export function buildA4Pdf(
  result: PatternResult,
  scene: PatternScene,
  meta: PdfMeta,
  options: PdfBuildOptions,
): Promise<PdfOutput> {
  return buildTiledPdf({ result, scene, meta }, { paper: "A4", withCover: true }, options);
}
