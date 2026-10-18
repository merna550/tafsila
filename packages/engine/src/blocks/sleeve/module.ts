/**
 * The set-in sleeve as a feature module (issue #134): adds the `sleeve` piece and the matching balance notches on
 * both bodice armholes. `sleeve.type: none` does not apply, so the armhole stays a finished edge (decision 134, 6).
 */
import type { DraftContext, PieceDraft } from "../../pipeline/draft-context";
import { withPiece } from "../../pipeline/draft-context";
import type { FeatureModule } from "../../pipeline/feature-module";
import { DraftingError } from "../../errors/drafting-error";
import { resolveDraftInputs } from "../../resolve/resolve-draft-inputs";
import { BODICE_RESOLVED_KEYS } from "../bodice/draft-bodice";
import { BACK_PIECE_ID, FRONT_PIECE_ID } from "../bodice/piece-parts";
import { draftSleeve } from "./draft-sleeve";
import { backArmholeNotches, frontArmholeNotches } from "./notches";
import type { SleeveInput } from "./types";

/**
 * The sleeve input from the run's context: the bodice armholes passed on by the bodice block (#128).
 *
 * @param ctx - Context after the bodice block.
 * @returns The sleeve input.
 * @throws {DraftingError} PIPELINE_STEP_ORDER when the bodice block has not run.
 */
export function sleeveInputFrom(ctx: DraftContext): SleeveInput {
  const armholeBackMm = ctx.resolved[BODICE_RESOLVED_KEYS.armholeBackMm];
  const armholeFrontMm = ctx.resolved[BODICE_RESOLVED_KEYS.armholeFrontMm];
  if (armholeBackMm === undefined || armholeFrontMm === undefined || !ctx.spec.sleeve) {
    throw new DraftingError("PIPELINE_STEP_ORDER", "The set-in sleeve needs the bodice block first");
  }
  const inputs = ctx.inputs ?? resolveDraftInputs(ctx.spec, ctx.measurements, ctx.options);
  return {
    bicepHalfMm: inputs.sleeveBicepHalfMm,
    wristHalfMm: inputs.sleeveWristHalfMm,
    armLengthMm: inputs.armLengthMm,
    armholeBackMm,
    armholeFrontMm,
    length: ctx.spec.sleeve.length,
  };
}

/**
 * Adds notches to one bodice piece of the context (a new piece; the bodice outline is unchanged).
 *
 * @param ctx - Current context.
 * @param pieceId - Bodice piece id.
 * @param notches - Builds the notches from that piece's armhole length.
 * @param armholeMm - The armhole length.
 * @returns A new context.
 */
function withArmholeNotches(
  ctx: DraftContext,
  pieceId: string,
  notches: (armholeMm: number) => PieceDraft["notches"],
  armholeMm: number,
): DraftContext {
  const piece = ctx.pieces.find((p) => p.id === pieceId);
  if (!piece) throw new DraftingError("PIPELINE_STEP_ORDER", `The set-in sleeve needs ${pieceId}`);
  return withPiece(ctx, { ...piece, notches: [...piece.notches, ...notches(armholeMm)] });
}

/**
 * Drafts the sleeve and marks the bodice armholes it is sewn into.
 *
 * @param ctx - Context after the bodice block.
 * @returns The context with the `sleeve` piece and notched bodice armholes.
 * @throws {DraftingError} PIPELINE_STEP_ORDER, SLEEVE_CAP_UNSOLVABLE or SLEEVE_LENGTH_TOO_SHORT.
 */
function draftSetInSleeve(ctx: DraftContext): DraftContext {
  const input = sleeveInputFrom(ctx);
  const sleeve = draftSleeve(input, ctx.options);
  const notchedBack = withArmholeNotches(ctx, BACK_PIECE_ID, backArmholeNotches, input.armholeBackMm);
  const notched = withArmholeNotches(notchedBack, FRONT_PIECE_ID, frontArmholeNotches, input.armholeFrontMm);
  return withPiece(notched, sleeve.piece);
}

/** One-piece set-in sleeve, every length. Runs after the skirt modules; order does not matter for the bodice. */
export const setInSleeveModule: FeatureModule = {
  id: "sleeve/set-in",
  order: 30,
  appliesTo: (spec) => spec.sleeve?.type === "set-in",
  draft: draftSetInSleeve,
};
