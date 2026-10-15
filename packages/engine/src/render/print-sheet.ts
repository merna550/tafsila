/** The 1:1 toile print sheet: every layer, physical scale 1 (decision 127). */
import type { PatternResult } from "@tafsila/schemas";
import { renderSvg } from "./svg";

/**
 * Renders the sheet to send to a plotter print shop: all pieces side by side with a 10 cm scale square.
 *
 * @param result - The pattern.
 * @returns SVG text at 1:1.
 */
export function renderPrintSheet(result: PatternResult): string {
  return renderSvg(result, { scale: 1 });
}
