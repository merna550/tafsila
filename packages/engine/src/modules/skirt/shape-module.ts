/**
 * Straight and A-line skirt module (issue #135, FR-PAT-05). The straight skirt is the block at the resolved length,
 * so the module only adds its walking-ease check; the A-line closes each waist dart into the hem (`aLinePiece`).
 * Method and decisions: `docs/engine/drafting-method.md` "Straight and A-line skirts, slits", decision
 * 135-straight-a-line-skirt.
 */
import type { SkirtHalf } from "../../blocks/skirt/edges";
import { SKIRT_PIECE_ID } from "../../blocks/skirt/edges";
import { A_LINE_HEM_GAIN_KEY } from "../../constants/skirt-style";
import { DraftingError } from "../../errors/drafting-error";
import { type DraftContext, withPiece, withResolved } from "../../pipeline/draft-context";
import type { FeatureModule } from "../../pipeline/feature-module";
import { resolveDraftInputs } from "../../resolve/resolve-draft-inputs";
import { aLinePiece } from "./a-line";
import { walkingEaseRule } from "./rules";

/** The two halves, front first. */
const HALVES: readonly SkirtHalf[] = ["front", "back"];

/**
 * Replaces the block's front and back with their A-line versions and records each hem gain.
 *
 * @param ctx - Context after the skirt block.
 * @returns The context with A-line `skirt-front` and `skirt-back` and the `A_LINE_HEM_GAIN_KEY` values.
 * @throws {DraftingError} `SKIRT_BLOCK_MISSING` when the block pieces are not in the context.
 */
function draftALine(ctx: DraftContext): DraftContext {
  const { hipDepthMm } = ctx.inputs ?? resolveDraftInputs(ctx.spec, ctx.measurements, ctx.options);
  return HALVES.reduce((acc, half) => {
    const block = acc.pieces.find((p) => p.id === SKIRT_PIECE_ID[half]);
    if (block === undefined) {
      throw new DraftingError(
        "SKIRT_BLOCK_MISSING",
        `The A-line skirt needs the block piece ${SKIRT_PIECE_ID[half]}`,
      );
    }
    const { piece, hemGainMm } = aLinePiece(block, half, hipDepthMm);
    return withResolved(withPiece(acc, piece), { [A_LINE_HEM_GAIN_KEY[half]]: hemGainMm });
  }, ctx);
}

/** Straight and A-line skirts. Runs after the straight block (order 10); the A-line replaces its two pieces. */
export const skirtShapeModule: FeatureModule = {
  id: "skirt-straight-a-line",
  order: 20,
  appliesTo: (spec) => spec.skirt?.type === "straight" || spec.skirt?.type === "a-line",
  draft: (ctx) => (ctx.spec.skirt?.type === "a-line" ? draftALine(ctx) : ctx),
  validations: [walkingEaseRule],
};
