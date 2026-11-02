/** Use case: read where a design's analysis stands (poll target of POST /designs/{id}/analyze). */
import type { DesignAnalysisState } from "@tafsila/schemas";
import { isAnalysisRunning } from "../domain/design-analysis";
import { NotFoundError } from "../domain/errors";
import type { Clock } from "../ports/clock";
import type { DesignRepository } from "../ports/design-repository";
import type { AuthContext } from "../ports/token-verifier";

/**
 * Reads the analysis state. A `pending` state older than five minutes is reported as `failed`, so the screen stops polling.
 *
 * @param deps - Design repository and clock.
 * @param ctx - Verified caller.
 * @param designId - Design id.
 * @returns `none` before the first request, otherwise the stored state.
 * @throws {NotFoundError} When the design is missing or not the caller's.
 */
export async function getDesignAnalysis(
  deps: { readonly designs: DesignRepository; readonly clock: Clock },
  ctx: AuthContext,
  designId: string,
): Promise<DesignAnalysisState> {
  const state = await deps.designs.getAnalysis(ctx, designId);
  if (state === undefined) throw new NotFoundError("design");
  if (state === null) return { status: "none" };
  if (state.status === "pending" && !isAnalysisRunning(state, deps.clock.now())) {
    return {
      status: "failed",
      ...(state.startedAt ? { startedAt: state.startedAt } : {}),
      errorCode: "AI_ANALYSIS_FAILED",
    };
  }
  return state;
}
