/**
 * The pocket feature module (issue #145, FR-PAT-07, decision 145): side-seam bags and patch pockets, drafted after the
 * waistband (40) so the shell and its facings are final, before the closure (50) so a side zip is refused first.
 */
import type { DraftContext } from "../../pipeline/draft-context";
import type { FeatureModule } from "../../pipeline/feature-module";
import { assertPockets } from "./compatibility";
import { draftPatchPockets } from "./patch";
import { pocketOpeningRule } from "./rules";
import { draftSideSeamPockets } from "./side-seam";

/** After the waistband (40), before the closure (50). */
export const POCKET_ORDER = 45;

/**
 * Drafts the design's pockets.
 *
 * @param ctx - Context after the garment modules.
 * @returns The new context.
 * @throws {DraftingError} POCKET_UNSUPPORTED or POCKET_NO_ROOM (input errors).
 */
export function draftPockets(ctx: DraftContext): DraftContext {
  assertPockets(ctx.spec);
  const side = ctx.spec.pockets.includes("side-seam") ? draftSideSeamPockets(ctx) : ctx;
  return ctx.spec.pockets.includes("patch") ? draftPatchPockets(side) : side;
}

/** Pockets: side-seam bags and patch pockets. */
export const pocketModule: FeatureModule = {
  id: "pocket",
  order: POCKET_ORDER,
  appliesTo: (spec) => spec.pockets.length > 0,
  draft: draftPockets,
  validations: [pocketOpeningRule],
};
