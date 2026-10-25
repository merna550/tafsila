/** Turns a pattern into what the tiler needs: the sheet content box and the cut outlines (decision 283). */
import { layoutSheet, samplePath, SCALE_SQUARE_MM, SHEET_MARGIN_MM, translate } from "@tafsila/engine";
import type { PatternResult, Point } from "@tafsila/schemas";
import type { TileInput } from "./types";

/**
 * The scale square as a closed outline, so its tile is never skipped.
 *
 * @param corner - Top-left of the square.
 * @returns Four corners.
 */
function squareOutline(corner: Point): Point[] {
  const s = SCALE_SQUARE_MM;
  return [
    corner,
    { x: corner.x + s, y: corner.y },
    { x: corner.x + s, y: corner.y + s },
    { x: corner.x, y: corner.y + s },
  ];
}

/**
 * Lays the pieces out on the print sheet and returns the content box (the sheet without its empty border) and
 * the closed outline of each piece and of the scale square.
 *
 * @param result - The generated pattern.
 * @returns The tile input, in sheet mm.
 */
export function tileInput(result: PatternResult): TileInput {
  const layout = layoutSheet(result.pieces);
  const outlines: Point[][] = layout.placements.map((p) => samplePath(translate(p.piece.cutPath, p.offset)));
  if (layout.scaleSquare) outlines.push(squareOutline(layout.scaleSquare));
  return {
    area: {
      minX: SHEET_MARGIN_MM,
      minY: SHEET_MARGIN_MM,
      maxX: layout.widthMm - SHEET_MARGIN_MM,
      maxY: layout.heightMm - SHEET_MARGIN_MM,
    },
    outlines,
  };
}
