/**
 * The princess bodice feature modules (issue #138, FR-PAT-05): `bodice/princess-shoulder` and
 * `bodice/princess-armhole` replace the darted block's two halves by four panels (decision 138).
 */
import type { DesignSpec } from "@tafsila/schemas";
import {
  BACK_PIECE_ID,
  FRONT_PIECE_ID,
  bodiceInputFrom,
  draftBodice,
  type BodiceDraft,
} from "../../blocks/bodice";
import { DraftingError } from "../../errors/drafting-error";
import { type DraftContext, withPieces } from "../../pipeline/draft-context";
import type { FeatureModule } from "../../pipeline/feature-module";
import { type PrincessVariant } from "./panel-parts";
import { backPrincessPanels } from "./princess-back";
import { frontPrincessPanels } from "./princess-front";

/** Bodice shaping modules run before the sleeve (30), which sews to whatever pieces hold the armhole. */
export const BODICE_SHAPING_ORDER = 5;

/**
 * Re-drafts the bodice block of the run (pure, so it is the block the blocks step drafted) to read its key points.
 *
 * @param ctx - Context after the blocks step.
 * @returns The bodice block.
 * @throws {DraftingError} PIPELINE_STEP_ORDER when the block has not run.
 */
export function bodiceOf(ctx: DraftContext): BodiceDraft {
  const ids = ctx.pieces.map((p) => p.id);
  if (!ctx.inputs || !ids.includes(FRONT_PIECE_ID) || !ids.includes(BACK_PIECE_ID)) {
    throw new DraftingError("PIPELINE_STEP_ORDER", "Bodice shaping needs the bodice block first");
  }
  return draftBodice(bodiceInputFrom(ctx.measurements, ctx.spec, ctx.inputs), ctx.options);
}

/**
 * Replaces the block halves by the four princess panels, keeping every other piece in place.
 *
 * @param ctx - Context after the blocks step.
 * @param variant - Shoulder or armhole princess line.
 * @returns The new context.
 */
function draftPrincess(ctx: DraftContext, variant: PrincessVariant): DraftContext {
  const d = bodiceOf(ctx);
  const panels = [
    ...backPrincessPanels(d, variant, ctx.options),
    ...frontPrincessPanels(d, variant, ctx.options),
  ];
  const kept = ctx.pieces.filter((p) => p.id !== FRONT_PIECE_ID && p.id !== BACK_PIECE_ID);
  return withPieces(ctx, [...panels, ...kept]);
}

/**
 * A princess module for one variant.
 *
 * @param variant - Shoulder or armhole princess line.
 * @returns The feature module.
 */
function princessModule(variant: PrincessVariant): FeatureModule {
  const shaping: NonNullable<DesignSpec["bodice"]>["shaping"] = `princess-${variant}`;
  return {
    id: `bodice/princess-${variant}`,
    order: BODICE_SHAPING_ORDER,
    appliesTo: (spec) => spec.bodice?.shaping === shaping,
    draft: (ctx) => draftPrincess(ctx, variant),
  };
}

/** Princess seams from mid-shoulder through the bust point, front and back. */
export const princessShoulderModule = princessModule("shoulder");

/** Princess seams from the armhole through the bust point, front and back. */
export const princessArmholeModule = princessModule("armhole");
