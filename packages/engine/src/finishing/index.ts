/** Step 4 of the pipeline: the finishing sub-steps, run in order (ARCHITECTURE §3). #131 appends its steps here. */
import type { DraftContext, Step } from "../pipeline/draft-context";
import { dartStep } from "./darts";
import { grainStep } from "./grain";
import { notchStep } from "./notches";
import { seamAllowanceStep } from "./seam-allowance";

export { dartStep } from "./darts";
export { defaultGrainLine, grainStep } from "./grain";
export { completeNotches, notchStep, partnerAtMm } from "./notches";
export { allowanceFor, seamAllowanceStep, segmentAllowances } from "./seam-allowance";

/**
 * Sub-step of #131: notch partners, grain check and dart check, in that order.
 *
 * @param ctx - Context after the seam allowance.
 * @returns The context with every mark in place.
 */
export const marksStep: Step = (ctx) => dartStep(grainStep(notchStep(ctx)));

/** The finishing sub-steps in the order they run. */
export const finishingSteps: readonly Step[] = [seamAllowanceStep, marksStep];

/**
 * Step 4: runs every finishing sub-step over the context, in order.
 *
 * @param ctx - Context after the modules.
 * @returns The finished context.
 */
export const finishing: Step = (ctx: DraftContext) => finishingSteps.reduce((acc, step) => step(acc), ctx);
