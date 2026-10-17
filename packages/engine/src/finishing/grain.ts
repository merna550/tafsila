/** Finishing sub-step: grain lines (FR-PAT-02, issue #131). A module may give its own line (a bias piece); this checks it. */
import type { Piece, Point } from "@tafsila/schemas";
import { GRAIN_LINE_DEGENERATE_MM, GRAIN_LINE_LENGTH_RATIO, GRAIN_LINE_MIN_MM } from "../constants/labels";
import { DraftingError } from "../errors/drafting-error";
import { bbox, distance, samplePath } from "../geometry";
import { type PieceDraft, type Step, withPieces } from "../pipeline/draft-context";

/** Direction of a default grain line in the piece frame. */
export type GrainDirection = "vertical" | "horizontal";

/**
 * A grain line centred in the piece box, parallel to the centre line (vertical in the block frame).
 *
 * @param stitchPath - The closed stitch path of the piece.
 * @param direction - `vertical` (default) or `horizontal`.
 * @returns Two points, start then end.
 * @example
 * defaultGrainLine(rectanglePath) // [{ x: 100, y: 60 }, { x: 100, y: 240 }] for a 200 x 300 piece
 */
export function defaultGrainLine(
  stitchPath: Piece["stitchPath"],
  direction: GrainDirection = "vertical",
): [Point, Point] {
  const box = bbox(samplePath(stitchPath));
  const cx = (box.minX + box.maxX) / 2;
  const cy = (box.minY + box.maxY) / 2;
  const extent = direction === "vertical" ? box.maxY - box.minY : box.maxX - box.minX;
  const half = Math.max(extent * GRAIN_LINE_LENGTH_RATIO, GRAIN_LINE_MIN_MM) / 2;
  return direction === "vertical"
    ? [
        { x: cx, y: cy - half },
        { x: cx, y: cy + half },
      ]
    : [
        { x: cx - half, y: cy },
        { x: cx + half, y: cy },
      ];
}

/**
 * Checks that a piece has a usable grain line.
 *
 * @param piece - The piece.
 * @throws {DraftingError} FINISHING_GRAIN_MISSING when the line is absent or shorter than the degenerate limit.
 */
function assertGrain(piece: PieceDraft): void {
  const line = piece.grainLine as Piece["grainLine"] | undefined;
  if (!line || distance(line[0], line[1]) < GRAIN_LINE_DEGENERATE_MM) {
    throw new DraftingError("FINISHING_GRAIN_MISSING", `Piece ${piece.id} has no usable grain line`);
  }
}

/**
 * The grain step: fails loudly when a piece has no usable grain line.
 *
 * @param ctx - Current context.
 * @returns The new context.
 */
export const grainStep: Step = (ctx) => {
  ctx.pieces.forEach(assertGrain);
  return withPieces(ctx, ctx.pieces);
};
