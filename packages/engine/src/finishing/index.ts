/** Step 4 of the pipeline: the finishing sub-steps, run in order (ARCHITECTURE §3). #131 appends its steps here. */
import type { DraftContext, Step } from "../pipeline/draft-context";
import { seamAllowanceStep } from "./seam-allowance";

export { allowanceFor, seamAllowanceStep, segmentAllowances } from "./seam-allowance";

/** The finishing sub-steps in the order they run. */
export const finishingSteps: readonly Step[] = [seamAllowanceStep];

/**
 * Step 4: runs every finishing sub-step over the context, in order.
 *
 * @param ctx - Context after the modules.
 * @returns The finished context.
 */
export const finishing: Step = (ctx: DraftContext) => finishingSteps.reduce((acc, step) => step(acc), ctx);
