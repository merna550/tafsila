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
import { armholeParts } from "../bodice/armhole-parts";
import { edgeLengthMm } from "../../pieces/measure";
import { draftSleeve } from "./draft-sleeve";
import { BODICE_ARMHOLE_EDGE } from "./ids";
import { backArmholeNotches, frontArmholeNotch, shoulderArmholeNotch } from "./notches";
import type { SleeveInput } from "./types";

/**
 * The sleeve input from the run's context: the bodice armhole lengths passed on by the bodice block (#128) and the
 * pieces holding them (one per half, or two for a princess armhole, #138).
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
  const armholes = armholeParts(ctx.pieces);
  if (armholes.front.length === 0 || armholes.back.length === 0) {
    throw new DraftingError("PIPELINE_STEP_ORDER", "The set-in sleeve needs the bodice armholes");
  }
  const inputs = ctx.inputs ?? resolveDraftInputs(ctx.spec, ctx.measurements, ctx.options);
  return {
    bicepHalfMm: inputs.sleeveBicepHalfMm,
    wristHalfMm: inputs.sleeveWristHalfMm,
    armLengthMm: inputs.armLengthMm,
    armholeBackMm,
    armholeFrontMm,
    length: ctx.spec.sleeve.length,
    armholes,
  };
}

/**
 * The bodice piece with the given id, or a step-order error when the bodice has not been drafted.
 *
 * @param ctx - Current context.
 * @param pieceId - Bodice piece id.
 * @returns The piece.
 * @throws {DraftingError} PIPELINE_STEP_ORDER when the piece is missing.
 */
function bodicePiece(ctx: DraftContext, pieceId: string | undefined): PieceDraft {
  const piece = ctx.pieces.find((p) => p.id === pieceId);
  if (!piece) throw new DraftingError("PIPELINE_STEP_ORDER", `The set-in sleeve needs the bodice armhole`);
  return piece;
}

/**
 * Adds notches to one bodice piece of the context (a new piece; the bodice outline is unchanged).
 *
 * @param ctx - Current context.
 * @param pieceId - Bodice piece id.
 * @param notches - Builds the notches from that piece's armhole length.
 * @returns A new context.
 * @throws {DraftingError} PIPELINE_STEP_ORDER when the piece is missing.
 */
function withArmholeNotches(
  ctx: DraftContext,
  pieceId: string | undefined,
  notches: (armholeMm: number) => PieceDraft["notches"],
): DraftContext {
  const piece = bodicePiece(ctx, pieceId);
  const armholeMm = edgeLengthMm(piece, BODICE_ARMHOLE_EDGE);
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
  const parts = input.armholes ?? armholeParts(ctx.pieces);
  const notchedBack = withArmholeNotches(ctx, parts.back.at(-1), backArmholeNotches);
  const notchedFront = withArmholeNotches(notchedBack, parts.front.at(-1), (mm) => [frontArmholeNotch(mm)]);
  const notched = withArmholeNotches(notchedFront, parts.front[0], () => [shoulderArmholeNotch()]);
  return withPiece(notched, sleeve.piece);
}

/** One-piece set-in sleeve, every length. Runs after the skirt modules and after the bodice shaping modules (#138). */
export const setInSleeveModule: FeatureModule = {
  id: "sleeve/set-in",
  order: 30,
  appliesTo: (spec) => spec.sleeve?.type === "set-in",
  draft: draftSetInSleeve,
};
