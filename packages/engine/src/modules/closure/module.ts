/**
 * The closure feature module (issue #143, FR-PAT-05, decision 143): a late transform over the pieces the garment
 * modules drew. It refuses a closure its category cannot take, then a zip turns a fold into a seam (or uses the side
 * seam) with its stop notch, buttons add the extension, marks and front facing, and `none` only warns when the waist
 * cannot pass the hips.
 */
import type { DraftContext } from "../../pipeline/draft-context";
import type { FeatureModule } from "../../pipeline/feature-module";
import { draftButtons } from "./buttons";
import { assertClosure } from "./compatibility";
import { CLOSURE_RULES } from "./none";
import { draftZip } from "./zip";

/** After every module that draws or traces a shell or facing piece (waistband 40), before finishing. */
export const CLOSURE_ORDER = 50;

/**
 * Drafts the design's closure.
 *
 * @param ctx - Context after the garment modules.
 * @returns The new context.
 * @throws {DraftingError} CLOSURE_UNSUPPORTED or CLOSURE_ZIP_TOO_LONG (input errors).
 */
export function draftClosure(ctx: DraftContext): DraftContext {
  assertClosure(ctx.spec);
  const { type } = ctx.spec.closure;
  if (type === "zip") return draftZip(ctx);
  return type === "buttons" ? draftButtons(ctx) : ctx;
}

/** Closures: zip, buttons and none. */
export const closureModule: FeatureModule = {
  id: "closure",
  order: CLOSURE_ORDER,
  appliesTo: () => true,
  draft: draftClosure,
  validations: CLOSURE_RULES,
};
