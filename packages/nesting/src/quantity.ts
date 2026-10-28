/**
 * How many shapes a piece's cut instruction needs in each layout (ADR-312 item 4, decision 315). `cut.quantity` counts
 * the pieces sewn into the garment; a `mirror` piece's quantity is a pair count times two (left and right).
 */
import type { FabricLayout, Piece } from "@tafsila/schemas";

/** One shape to cut: plain, or the mirror image of the piece. */
export interface ShapeCopy {
  /** True for the mirror image (every second piece of a mirrored pair in an open layout). */
  readonly mirrored: boolean;
}

/** Pieces a single cut gives through both layers of a folded fabric. */
const LAYERS_FOLDED = 2;

/**
 * The shapes a piece needs on the fabric.
 *
 * - Folded: a fold piece gives one half shape per quantity; a mirrored pair is cut once through both layers (one shape
 *   per pair, rounded up); any other piece gives one shape per quantity.
 * - Open: one shape per quantity; a fold piece is unfolded, and every second piece of a mirrored pair is its mirror
 *   image.
 *
 * @param cut - The piece's cut instruction.
 * @param layout - Folded or open.
 * @returns One entry per shape, in order.
 */
export function shapeCopies(cut: Piece["cut"], layout: FabricLayout): ShapeCopy[] {
  if (layout === "folded" && cut.mirror && !cut.onFold) {
    return Array.from({ length: Math.ceil(cut.quantity / LAYERS_FOLDED) }, () => ({ mirrored: false }));
  }
  const mirrorsEverySecond = layout === "open" && cut.mirror && !cut.onFold;
  return Array.from({ length: cut.quantity }, (_, i) => ({
    mirrored: mirrorsEverySecond && i % LAYERS_FOLDED === 1,
  }));
}
