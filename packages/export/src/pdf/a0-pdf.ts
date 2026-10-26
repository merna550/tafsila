/** The A0 copy-shop PDF: one big sheet (or a few), a header band with the test square on sheet 1 (decision 290). */
import type { PatternScene } from "@tafsila/engine";
import type { PatternResult } from "@tafsila/schemas";
import { buildTiledPdf } from "./tiled-pdf";
import type { PdfBuildOptions, PdfMeta, PdfOutput } from "./types";

/**
 * Builds the A0 PDF of a pattern at 1:1 scale. Same inputs and output as `buildA4Pdf`; no cover page, the test
 * square and title block sit in a header band on sheet 1.
 *
 * @param result - The generated pattern.
 * @param scene - The scene of the same pattern (`buildPatternScene(result)`).
 * @param meta - Title block data and the fixed creation date.
 * @param options - Fonts and progress callback.
 * @returns The PDF bytes and page counts.
 */
export function buildA0Pdf(
  result: PatternResult,
  scene: PatternScene,
  meta: PdfMeta,
  options: PdfBuildOptions,
): Promise<PdfOutput> {
  return buildTiledPdf({ result, scene, meta }, { paper: "A0", withCover: false, withHeader: true }, options);
}
