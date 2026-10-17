/**
 * Layout sub-step: the 100 x 100 mm scale check square, as a label on the largest piece that can hold it
 * (FR-PAT-02, issue #131, decision 131). When no piece can, the print sheet draws its own square instead.
 */
import type { Label, Point } from "@tafsila/schemas";
import { SCALE_CLEARANCE_MM, SCALE_SCAN_MM, SCALE_SQUARE_SIZE_MM } from "../constants/labels";
import { bbox, signedArea, type Rect } from "../geometry";
import { SCALE_SQUARE_TEXT } from "../i18n/pieces";
import { type PieceDraft, type Step, withPieces } from "../pipeline/draft-context";
import { isClear, labelRect, obstaclesOf, rectsTooClose, type PieceObstacles } from "./obstacles";

/** Id of the scale square label. */
export const SCALE_SQUARE_LABEL_ID = "scale-square";

/**
 * Area of a piece inside its stitch line.
 *
 * @param obstacles - The piece.
 * @returns Area in mm².
 */
function areaOf(obstacles: PieceObstacles): number {
  return Math.abs(signedArea(obstacles.outline));
}

/**
 * The first place, scanning left to right then top to bottom, where the square fits.
 *
 * @param piece - The piece with its labels already placed.
 * @param obstacles - The piece.
 * @returns The top-left corner of the square, or undefined.
 */
function findSquare(piece: PieceDraft, obstacles: PieceObstacles): Point | undefined {
  const box = bbox(obstacles.outline);
  const others = (piece.labels ?? []).filter((l) => l.kind !== "scale-square").map(labelRect);
  for (let y = box.minY + SCALE_CLEARANCE_MM; y + SCALE_SQUARE_SIZE_MM <= box.maxY; y += SCALE_SCAN_MM) {
    for (let x = box.minX + SCALE_CLEARANCE_MM; x + SCALE_SQUARE_SIZE_MM <= box.maxX; x += SCALE_SCAN_MM) {
      const rect: Rect = { minX: x, minY: y, maxX: x + SCALE_SQUARE_SIZE_MM, maxY: y + SCALE_SQUARE_SIZE_MM };
      if (
        isClear(rect, obstacles, SCALE_CLEARANCE_MM) &&
        !others.some((o) => rectsTooClose(rect, o, SCALE_CLEARANCE_MM))
      ) {
        return { x, y };
      }
    }
  }
  return undefined;
}

/**
 * The scale square step: one square label on the largest piece that holds it, none when none does.
 *
 * @param ctx - Current context.
 * @returns The new context.
 */
export const scaleSquareStep: Step = (ctx) => {
  const cleaned = ctx.pieces.map((p) => ({
    ...p,
    labels: (p.labels ?? []).filter((l) => l.kind !== "scale-square"),
  }));
  const ranked = cleaned
    .map((piece, index) => ({ piece, index, obstacles: obstaclesOf(piece) }))
    .sort((a, b) => areaOf(b.obstacles) - areaOf(a.obstacles) || a.index - b.index);
  for (const { piece, index, obstacles } of ranked) {
    const at = findSquare(piece, obstacles);
    if (!at) continue;
    const label: Label = {
      id: SCALE_SQUARE_LABEL_ID,
      kind: "scale-square",
      text: SCALE_SQUARE_TEXT,
      at,
      rotationDeg: 0,
      sizeMm: SCALE_SQUARE_SIZE_MM,
    };
    return withPieces(
      ctx,
      cleaned.map((p, i) => (i === index ? { ...piece, labels: [...piece.labels, label] } : p)),
    );
  }
  return withPieces(ctx, cleaned);
};
