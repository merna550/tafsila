/**
 * Runs the AI evaluation over the labels (issue #338): one `analyzeDesign` call per photo in id order, a failed call
 * counted as wrong and listed, a per-call timeout, and a budget guard that stops before the spend would pass the cap.
 */
import type { DesignAnalysisResult } from "@tafsila/schemas";
import type { AnalyzeDesignInput, AnalyzeDesignOutput, DesignPhoto } from "../analyze-design";
import { AiOutputInvalidError } from "../errors";
import type { AiUsage } from "../usage";
import type { EvalLabel } from "./labels";
import { scorePhoto, unsupportedMatched, type FeatureScore } from "./score";

/** Per-call timeout in ms (plan #338): twice the NFR-02 p95 bound. */
export const DEFAULT_TIMEOUT_MS = 60_000;

/** How a run is limited. */
export interface RunLimits {
  /** Send the label's category as the hint (as when the user picked it). */
  readonly hint: boolean;
  /** Stop after this many photos. */
  readonly maxPhotos?: number;
  /** Stop before the estimated spend in USD would pass this. */
  readonly budgetUsd?: number;
  /** Per-call timeout in ms. */
  readonly timeoutMs: number;
}

/** What the run calls out to: the analysis and the photo loader. */
export interface RunDeps {
  /** `analyzeDesign` with its provider bound. */
  readonly analyze: (input: AnalyzeDesignInput) => Promise<AnalyzeDesignOutput>;
  /** Loads the photo of a label (bytes from a folder, or a signed URL). */
  readonly photoFor: (label: EvalLabel) => Promise<DesignPhoto>;
}

/** The outcome of one photo. */
export interface PhotoRun {
  /** Label id. */
  readonly id: string;
  /** The analysis, or undefined when the call failed. */
  readonly result: DesignAnalysisResult | undefined;
  /** Why the call failed. */
  readonly error: string | undefined;
  /** Tokens, latency and cost; a refused answer still has them, a timeout does not. */
  readonly usage: AiUsage | undefined;
  /** The compared features. */
  readonly features: readonly FeatureScore[];
  /** Labelled unsupported items, and how many the model reported. */
  readonly unsupported: { readonly labelled: number; readonly matched: number };
}

/** Why a run stopped before the last label. */
export interface RunStop {
  /** `max-photos`, `budget` (the next call would pass it), or `cost-unknown` (a budget with no price for the model). */
  readonly reason: "max-photos" | "budget" | "cost-unknown";
  /** Photos analysed before stopping. */
  readonly afterPhotos: number;
}

/** A whole run. */
export interface EvalRun {
  /** One entry per analysed photo, in id order. */
  readonly photos: readonly PhotoRun[];
  /** Set when the run stopped early. */
  readonly stopped: RunStop | undefined;
}

/**
 * Calls a promise with a time limit.
 *
 * @param work - The call.
 * @param timeoutMs - The limit.
 * @returns The call's result.
 * @throws {Error} When the limit passes first.
 */
async function withTimeout<T>(work: Promise<T>, timeoutMs: number): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_resolve, reject) => {
    timer = setTimeout(() => reject(new Error(`timed out after ${timeoutMs} ms`)), timeoutMs);
  });
  try {
    return await Promise.race([work, timeout]);
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Analyses one photo and scores it; a failure is recorded, never thrown.
 *
 * @param label - The label.
 * @param limits - Hint and timeout.
 * @param deps - Analysis and photo loader.
 * @returns The photo's outcome.
 */
async function runPhoto(label: EvalLabel, limits: RunLimits, deps: RunDeps): Promise<PhotoRun> {
  const unsupported = { labelled: label.unsupported.length, matched: 0 };
  try {
    const photo = await deps.photoFor(label);
    const input = { photos: [photo], ...(limits.hint ? { hint: { category: label.category } } : {}) };
    const { result, usage } = await withTimeout(deps.analyze(input), limits.timeoutMs);
    const reported = result.unsupported.map((item) => item.text.en);
    const matched = label.unsupported.filter((text) => unsupportedMatched(text, reported)).length;
    const features = scorePhoto(label, result);
    return {
      id: label.id,
      result,
      error: undefined,
      usage,
      features,
      unsupported: { ...unsupported, matched },
    };
  } catch (error) {
    const usage = error instanceof AiOutputInvalidError ? error.usage : undefined;
    const message = error instanceof Error ? error.message : String(error);
    return {
      id: label.id,
      result: undefined,
      error: message,
      usage,
      features: scorePhoto(label, undefined),
      unsupported,
    };
  }
}

/**
 * Whether the run must stop before the next photo.
 *
 * @param done - Photos analysed so far.
 * @param limits - The limits.
 * @returns The reason, or undefined to go on.
 */
function stopReason(done: readonly PhotoRun[], limits: RunLimits): RunStop["reason"] | undefined {
  if (limits.maxPhotos !== undefined && done.length >= limits.maxPhotos) return "max-photos";
  if (limits.budgetUsd === undefined || done.length === 0) return undefined;
  const costs = done.map((photo) => photo.usage?.costUsd);
  if (costs.some((cost, index) => cost === undefined && done[index]?.usage !== undefined))
    return "cost-unknown";
  const spent = costs.reduce<number>((sum, cost) => sum + (cost ?? 0), 0);
  return spent + spent / done.length > limits.budgetUsd ? "budget" : undefined;
}

/**
 * Runs the evaluation, one photo at a time in the labels' order (sort them with `parseLabels`).
 *
 * @param labels - The labels.
 * @param limits - Hint, photo cap, budget and timeout.
 * @param deps - Analysis and photo loader.
 * @returns Every photo's outcome and why the run stopped early, if it did.
 * @example
 * const run = await runEval(parseLabels(text), { hint: false, timeoutMs: DEFAULT_TIMEOUT_MS }, deps);
 */
export async function runEval(
  labels: readonly EvalLabel[],
  limits: RunLimits,
  deps: RunDeps,
): Promise<EvalRun> {
  const photos: PhotoRun[] = [];
  for (const label of labels) {
    const reason = stopReason(photos, limits);
    if (reason !== undefined) return { photos, stopped: { reason, afterPhotos: photos.length } };
    photos.push(await runPhoto(label, limits, deps));
  }
  return { photos, stopped: undefined };
}
