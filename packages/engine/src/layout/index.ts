/** Step 5 of the pipeline: label placement, then the scale square (ARCHITECTURE §3). */
import type { Step } from "../pipeline/draft-context";
import { placeLabelsStep } from "./place-labels";
import { scaleSquareStep } from "./scale-square";

export { placeBlock, placeLabelsStep } from "./place-labels";
export { SCALE_SQUARE_LABEL_ID, scaleSquareStep } from "./scale-square";

/**
 * Step 5: places the labels of every piece, then the scale square.
 *
 * @param ctx - Context after the finishing step.
 * @returns The context with labels.
 */
export const layout: Step = (ctx) => scaleSquareStep(placeLabelsStep(ctx));
