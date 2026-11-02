/**
 * The analysis job body (FR-DES-03, FR-DES-07, SRS §9): read the photos, strip metadata, call the AI, store the result, log the usage
 * and record unsupported features. The inline queue and the Inngest function both call this one function.
 */
import { analyzeDesign, AiOutputInvalidError, type AiDeps, type DesignPhoto } from "@tafsila/ai";
import type { DesignAnalysisResult, DesignAnalysisState, PhotoSlot } from "@tafsila/schemas";
import { slotOfPath } from "../domain/design-photos";
import { stripImageMetadata } from "../domain/strip-image-metadata";
import type { AiUsageRepository } from "../ports/ai-usage-repository";
import type { Clock } from "../ports/clock";
import type { DesignRepository } from "../ports/design-repository";
import type { ErrorReporter } from "../ports/error-reporter";
import type { DesignAnalyzePayload } from "../ports/job-queue";
import type { PhotoDownloader } from "../ports/photo-downloader";
import type { PhotoStorage } from "../ports/photo-storage";
import type { AuthContext } from "../ports/token-verifier";
import type { UnsupportedFeatureRepository } from "../ports/unsupported-feature-repository";

/** Lifetime of the read URLs the job asks for: enough for the downloads, no more. */
export const ANALYSIS_READ_URL_SECONDS = 120;

/** Media type by file extension of a stored path. */
const MEDIA_TYPES: Readonly<Record<string, string>> = {
  jpg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
};

/** Ports and configuration the job needs. */
export interface RunAnalysisDeps {
  readonly designs: DesignRepository;
  readonly photoStorage: PhotoStorage;
  readonly photoDownloader: PhotoDownloader;
  readonly aiUsage: AiUsageRepository;
  readonly unsupportedFeatures: UnsupportedFeatureRepository;
  readonly errorReporter: ErrorReporter;
  readonly clock: Clock;
  /** The AI configuration, read when the job runs so a bad one fails the job, not the app. */
  readonly aiDeps: () => AiDeps;
}

/**
 * The context the job acts with: the user who asked, with the claims row-level security reads.
 *
 * @param userId - The user.
 * @returns A context for the repositories.
 */
function jobContext(userId: string): AuthContext {
  return { userId, role: "user", claims: { sub: userId, role: "authenticated" } };
}

/**
 * Downloads the design's photos and removes their metadata.
 *
 * @param deps - Photo ports.
 * @param paths - Stored photo paths.
 * @returns The photos for the AI, front first.
 * @throws {Error} When storage, a download or an image is bad.
 */
async function loadCleanPhotos(deps: RunAnalysisDeps, paths: readonly string[]): Promise<DesignPhoto[]> {
  const signed = await deps.photoStorage.signedReadUrls(paths, ANALYSIS_READ_URL_SECONDS);
  const order: PhotoSlot[] = ["front", "back", "side"];
  const known = signed.flatMap(({ path, url }) => {
    const view = slotOfPath(path);
    const mediaType = MEDIA_TYPES[path.slice(path.lastIndexOf(".") + 1)];
    return view && mediaType ? [{ view, mediaType, url }] : [];
  });
  known.sort((a, b) => order.indexOf(a.view) - order.indexOf(b.view));
  if (known[0]?.view !== "front") throw new Error("front photo is missing from storage");
  return Promise.all(
    known.map(async ({ view, mediaType, url }) => ({
      view,
      mediaType,
      bytes: stripImageMetadata((await deps.photoDownloader.download(url)).bytes),
    })),
  );
}

/**
 * Stores the end state of the job.
 *
 * @param deps - Design repository and clock.
 * @param ctx - Job context.
 * @param designId - The design.
 * @param outcome - `done` with a result, or `failed` with a code, and when the request was accepted.
 */
async function finish(
  deps: RunAnalysisDeps,
  ctx: AuthContext,
  designId: string,
  outcome: Pick<DesignAnalysisState, "status" | "result" | "errorCode" | "startedAt">,
): Promise<void> {
  await deps.designs.setAnalysis(ctx, designId, { ...outcome, finishedAt: deps.clock.now().toISOString() });
}

/**
 * Reports an unexpected failure without the provider's text reaching the user.
 *
 * @param deps - Error reporter.
 * @param payload - The job input.
 * @param error - What went wrong.
 */
function report(deps: RunAnalysisDeps, payload: DesignAnalyzePayload, error: unknown): void {
  deps.errorReporter.captureException(error, { requestId: `job:design.analyze:${payload.designId}` });
}

/**
 * Runs one analysis. Provider and image problems end as a `failed` state, not as a thrown error (the answer is stored, a retry would
 * pay again); only a storage failure while saving the state is thrown so the queue can retry it.
 *
 * @param deps - Ports and AI configuration.
 * @param payload - Who asked, which design, the optional hint.
 * @returns Resolves when the end state is stored.
 */
export async function runDesignAnalysis(deps: RunAnalysisDeps, payload: DesignAnalyzePayload): Promise<void> {
  const ctx = jobContext(payload.userId);
  const stored = await deps.designs.getAnalysis(ctx, payload.designId);
  if (stored === undefined) return;
  const startedAt = stored?.startedAt ?? deps.clock.now().toISOString();
  let ready: { photos: DesignPhoto[]; ai: AiDeps };
  try {
    const paths = await deps.designs.getPhotoPaths(ctx, payload.designId);
    const ai = deps.aiDeps();
    ready = { ai, photos: await loadCleanPhotos(deps, paths ?? []) };
  } catch (error) {
    report(deps, payload, error);
    return finish(deps, ctx, payload.designId, {
      status: "failed",
      errorCode: "AI_ANALYSIS_FAILED",
      startedAt,
    });
  }
  const outcome = await callProvider(deps, payload, ready.photos, ready.ai);
  await finish(deps, ctx, payload.designId, { ...outcome, startedAt });
}

/**
 * Calls the AI, records its usage and the unsupported features, and turns any provider failure into a `failed` outcome.
 *
 * @param deps - Ports.
 * @param payload - The job input.
 * @param photos - Photos with their metadata already removed.
 * @param ai - AI configuration.
 * @returns The state to store: `done` with the result, or `failed` with a safe code.
 */
async function callProvider(
  deps: RunAnalysisDeps,
  payload: DesignAnalyzePayload,
  photos: DesignPhoto[],
  ai: AiDeps,
): Promise<Pick<DesignAnalysisState, "status" | "result" | "errorCode">> {
  const began = deps.clock.now().getTime();
  let output: Awaited<ReturnType<typeof analyzeDesign>>;
  try {
    output = await analyzeDesign(
      { photos, ...(payload.hint ? { hint: { category: payload.hint } } : {}) },
      ai,
    );
  } catch (error) {
    // A call that reached the provider costs money even when its answer is refused, so the row is written on failure too.
    await recordUsage(deps, payload, failedUsage(error, ai, deps.clock.now().getTime() - began));
    if (error instanceof AiOutputInvalidError) return { status: "failed", errorCode: "AI_OUTPUT_INVALID" };
    report(deps, payload, error);
    return { status: "failed", errorCode: "AI_ANALYSIS_FAILED" };
  }
  await recordUsage(deps, payload, output.usage);
  await recordUnsupported(deps, payload, output.result);
  return { status: "done", result: output.result };
}

/**
 * Records the unsupported features for product research. A failure here is reported but never fails the analysis.
 *
 * @param deps - Ports.
 * @param payload - The job input.
 * @param result - The analysis.
 */
async function recordUnsupported(
  deps: RunAnalysisDeps,
  payload: DesignAnalyzePayload,
  result: DesignAnalysisResult,
): Promise<void> {
  try {
    await deps.unsupportedFeatures.recordMany(
      payload.userId,
      payload.designId,
      result.unsupported.map((feature) => feature.text.en),
    );
  } catch (error) {
    report(deps, payload, error);
  }
}

/** The part of an AI usage record the `ai_usage` row needs. */
interface UsageFields {
  readonly provider: string;
  readonly model: string;
  readonly inputTokens: number;
  readonly outputTokens: number;
  readonly costUsd: number | undefined;
  readonly latencyMs: number;
}

/**
 * What a failed call cost: the tokens the error carries, or zero tokens when the provider never answered.
 *
 * @param error - The failure.
 * @param ai - The AI configuration used.
 * @param elapsedMs - Time spent.
 * @returns The usage fields to record.
 */
function failedUsage(error: unknown, ai: AiDeps, elapsedMs: number): UsageFields {
  if (error instanceof AiOutputInvalidError && error.usage) return error.usage;
  return {
    provider: ai.config.provider,
    model: ai.config.analyzeModel,
    inputTokens: 0,
    outputTokens: 0,
    costUsd: 0,
    latencyMs: elapsedMs,
  };
}

/**
 * Writes one `ai_usage` row of kind `analyze`.
 *
 * @param deps - AI usage repository.
 * @param payload - The job input.
 * @param usage - Provider, model, tokens, cost and latency.
 */
async function recordUsage(
  deps: RunAnalysisDeps,
  payload: DesignAnalyzePayload,
  usage: UsageFields,
): Promise<void> {
  await deps.aiUsage.record({
    userId: payload.userId,
    designId: payload.designId,
    kind: "analyze",
    provider: usage.provider,
    model: usage.model,
    inputTokens: usage.inputTokens,
    outputTokens: usage.outputTokens,
    costUsd: usage.costUsd ?? 0,
    latencyMs: Math.round(usage.latencyMs),
  });
}
