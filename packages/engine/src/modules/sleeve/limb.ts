/**
 * The arm girth where a sleeve ends (issue #142): the upper arm at the underarm line, the wrist at the wrist, and a
 * straight line in between, as the measurements have no elbow girth (decision 142, 5).
 */
import type { Measurements } from "@tafsila/schemas";
import { draftSleeve } from "../../blocks/sleeve/draft-sleeve";
import { sleeveInputFrom } from "../../blocks/sleeve/module";
import type { SleeveDraft } from "../../blocks/sleeve/types";
import type { DraftContext } from "../../pipeline/draft-context";

/**
 * Body girth of the arm at a height on the sleeve.
 *
 * @param m - Body measurements.
 * @param capHeightMm - Cap top to the underarm line (where the upper arm is measured).
 * @param yMm - Height on the sleeve, from the cap top.
 * @returns The girth in mm.
 */
export function limbCircumferenceAtMm(
  m: Pick<Measurements, "upperArm" | "wrist" | "armLength">,
  capHeightMm: number,
  yMm: number,
): number {
  const share = Math.min(1, Math.max(0, (yMm - capHeightMm) / (m.armLength - capHeightMm)));
  return m.upperArm + (m.wrist - m.upperArm) * share;
}

/**
 * The set-in block the run's sleeve starts from, drafted again from the context (pure and deterministic).
 *
 * @param ctx - Context after the bodice block.
 * @returns The block.
 * @throws {DraftingError} PIPELINE_STEP_ORDER, SLEEVE_CAP_UNSOLVABLE or SLEEVE_LENGTH_TOO_SHORT.
 */
export function sleeveBlockOf(ctx: DraftContext): SleeveDraft {
  return draftSleeve(sleeveInputFrom(ctx), ctx.options);
}

/**
 * Arm girth at the block hem line of the run's sleeve.
 *
 * @param ctx - Context after the bodice block.
 * @param block - The set-in block of this sleeve.
 * @returns The girth in mm.
 */
export function limbAtHemMm(ctx: DraftContext, block: SleeveDraft): number {
  return limbCircumferenceAtMm(ctx.measurements, block.capHeightMm, block.hemYMm);
}
