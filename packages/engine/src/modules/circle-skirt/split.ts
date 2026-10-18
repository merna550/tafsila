/**
 * Splitting a circle skirt to fit the fabric (issue #136, FR-VAL-08, decision 136-circle-skirts, 2). The skirt is
 * front and back; each is first cut on the fold (2 pieces), then, when that is wider than the fabric, as a mirrored
 * pair with a centre seam (4 pieces). The fewest pieces that fit win; when none fits, the most split layout is kept
 * and the FR-VAL-08 fabric-width rule reports the warning.
 */
import type { EngineOptions } from "@tafsila/schemas";
import { withSeamAllowance } from "../../finishing/seam-allowance";
import { widthAcrossGrainMm } from "../../pieces/fabric-width";
import type { PieceDraft } from "../../pipeline/draft-context";

/** How the front and back are cut: on the fold, or as mirrored pairs with a centre seam. */
export type CircleLayout = "fold" | "centre-seams";

/** Layouts in the order they are tried: fewest pieces first. */
export const CIRCLE_LAYOUTS: readonly CircleLayout[] = ["fold", "centre-seams"];

/** The chosen layout and its pieces. */
export interface ChosenLayout {
  /** The layout. */
  readonly layout: CircleLayout;
  /** Its pieces, before the finishing step. */
  readonly pieces: readonly PieceDraft[];
  /** True when every piece fits across the fabric width with its seam allowances. */
  readonly fits: boolean;
}

/**
 * True when a piece, with the seam allowances the finishing step will add, fits across the fabric. Uses the same
 * finishing and measuring code as the pipeline, so the choice here and the FR-VAL-08 check always agree.
 *
 * @param piece - Piece before finishing.
 * @param options - Fabric width and seam allowance settings.
 * @returns Whether its width across the grain is at most the fabric width.
 */
export function fitsFabric(
  piece: PieceDraft,
  options: Pick<EngineOptions, "fabricWidthMm" | "seamAllowance">,
): boolean {
  return widthAcrossGrainMm(withSeamAllowance(piece, options.seamAllowance)) <= options.fabricWidthMm;
}

/**
 * Picks the layout with the fewest pieces that fits the fabric.
 *
 * @param piecesFor - Builds the pieces of a layout.
 * @param options - Fabric width and seam allowance settings.
 * @returns The first layout whose pieces all fit, else the last (most split) one with `fits: false`.
 */
export function chooseLayout(
  piecesFor: (layout: CircleLayout) => readonly PieceDraft[],
  options: Pick<EngineOptions, "fabricWidthMm" | "seamAllowance">,
): ChosenLayout {
  for (const layout of CIRCLE_LAYOUTS) {
    const pieces = piecesFor(layout);
    if (pieces.every((piece) => fitsFabric(piece, options))) return { layout, pieces, fits: true };
  }
  const last = CIRCLE_LAYOUTS.at(-1)!;
  return { layout: last, pieces: piecesFor(last), fits: false };
}
