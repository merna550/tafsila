/**
 * Skirt slit module (issue #135, FR-PAT-05): cuts a front, back or side slit into the straight or A-line skirt pieces
 * after their shape is drafted. Method and decisions: `docs/engine/drafting-method.md` "Straight and A-line skirts,
 * slits", decision 135-straight-a-line-skirt.
 */
import { type SkirtHalf, SKIRT_PIECE_ID } from "../../blocks/skirt/edges";
import { SLIT_MAX_LENGTH_KEY } from "../../constants/skirt-style";
import { type DraftContext, withPiece, withResolved } from "../../pipeline/draft-context";
import type { FeatureModule } from "../../pipeline/feature-module";
import { resolveDraftInputs } from "../../resolve/resolve-draft-inputs";
import { SLIT_SKIRT_TYPES, slitLengthRule, slitTypeRule } from "./rules";
import { maxSlitLengthMm, type SlitSeam, withSlit } from "./slit";

/** The slit positions of the DesignSpec. */
type SlitPosition = "front" | "back" | "side";

/** Which halves and which seam each slit position cuts into. */
const SLIT_PLACES: Readonly<Record<SlitPosition, { halves: readonly SkirtHalf[]; seam: SlitSeam }>> = {
  front: { halves: ["front"], seam: "centre" },
  back: { halves: ["back"], seam: "centre" },
  side: { halves: ["front", "back"], seam: "side" },
};

/**
 * Cuts the slit when it fits below the hip line; records the longest slit either way, so the slit rule can report
 * a slit that does not fit (the pieces then stay without a slit).
 *
 * @param ctx - Context after the skirt shape module.
 * @returns The context with the slit cut and `SLIT_MAX_LENGTH_KEY` set.
 */
function draftSlit(ctx: DraftContext): DraftContext {
  const slit = ctx.spec.skirt?.slit;
  if (slit === undefined || !SLIT_SKIRT_TYPES.has(ctx.spec.skirt!.type)) return ctx;
  const { hipDepthMm } = ctx.inputs ?? resolveDraftInputs(ctx.spec, ctx.measurements, ctx.options);
  const { halves, seam } = SLIT_PLACES[slit.position];
  const pieces = halves.map((half) => ({
    half,
    piece: ctx.pieces.find((p) => p.id === SKIRT_PIECE_ID[half])!,
  }));
  const maxMm = Math.min(...pieces.map(({ half, piece }) => maxSlitLengthMm(piece, seam, half, hipDepthMm)));
  const recorded = withResolved(ctx, { [SLIT_MAX_LENGTH_KEY]: maxMm });
  if (slit.lengthMm > maxMm) return recorded;
  return pieces.reduce(
    (acc, { half, piece }) => withPiece(acc, withSlit(piece, seam, half, slit.lengthMm)),
    recorded,
  );
}

/** Front, back or side slit. Runs after the skirt shape (order 20). */
export const skirtSlitModule: FeatureModule = {
  id: "skirt-slit",
  order: 30,
  appliesTo: (spec) => spec.skirt?.slit !== undefined,
  draft: draftSlit,
  validations: [slitLengthRule, slitTypeRule],
};
