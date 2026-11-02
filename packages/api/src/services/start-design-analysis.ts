/** Use case: accept an analysis request for a design, check the cost controls and hand the job to the queue (FR-DES-02, FR-DES-03, NFR-04). */
import type { AnalyzeAcceptedResponse, AnalyzeDesignRequest } from "@tafsila/schemas";
import { isAnalysisRunning, requireSupportedHint } from "../domain/design-analysis";
import { slotOfPath } from "../domain/design-photos";
import { AppError, NotFoundError } from "../domain/errors";
import type { AiUsageRepository } from "../ports/ai-usage-repository";
import type { Clock } from "../ports/clock";
import type { DesignRepository } from "../ports/design-repository";
import type { JobQueue } from "../ports/job-queue";
import type { AuthContext } from "../ports/token-verifier";

/** Ports and limits the use case needs. */
export interface StartAnalysisDeps {
  readonly designs: DesignRepository;
  readonly aiUsage: AiUsageRepository;
  readonly jobQueue: JobQueue;
  readonly clock: Clock;
  /** Analyses a user may start per UTC day. */
  readonly analyzeDailyLimit: number;
}

/**
 * Starts an analysis. The state becomes `pending` before the job is queued; if the queue refuses, it becomes `failed`.
 * Never called for a measurement-only regeneration: no pattern route reaches this function.
 *
 * @param deps - Ports and the daily limit.
 * @param ctx - Verified caller.
 * @param designId - Design id.
 * @param input - The optional category hint.
 * @returns The accepted state (`pending`).
 * @throws {NotFoundError} When the design is missing or not the caller's.
 * @throws {AppError} CATEGORY_NOT_SUPPORTED, PHOTO_FRONT_REQUIRED, ANALYSIS_IN_PROGRESS or AI_DAILY_LIMIT.
 */
export async function startDesignAnalysis(
  deps: StartAnalysisDeps,
  ctx: AuthContext,
  designId: string,
  input: AnalyzeDesignRequest,
): Promise<AnalyzeAcceptedResponse> {
  const paths = await deps.designs.getPhotoPaths(ctx, designId);
  if (!paths) throw new NotFoundError("design");
  const hint = requireSupportedHint(input.categoryHint);
  if (!paths.some((path) => slotOfPath(path) === "front")) throw new AppError("PHOTO_FRONT_REQUIRED");
  const now = deps.clock.now();
  if (isAnalysisRunning(await deps.designs.getAnalysis(ctx, designId), now)) {
    throw new AppError("ANALYSIS_IN_PROGRESS");
  }
  if ((await deps.aiUsage.countToday(ctx.userId, "analyze", now)) >= deps.analyzeDailyLimit) {
    throw new AppError("AI_DAILY_LIMIT");
  }
  const startedAt = now.toISOString();
  await deps.designs.setAnalysis(ctx, designId, { status: "pending", startedAt });
  try {
    await deps.jobQueue.enqueue("design.analyze", {
      userId: ctx.userId,
      designId,
      ...(hint ? { hint } : {}),
    });
  } catch (error) {
    await deps.designs.setAnalysis(ctx, designId, {
      status: "failed",
      startedAt,
      finishedAt: deps.clock.now().toISOString(),
      errorCode: "AI_ANALYSIS_FAILED",
    });
    throw error;
  }
  return { status: "pending", startedAt };
}
