/**
 * The evaluation report (issue #338): accuracy per feature, latency against NFR-02, cost per photo in USD and EGP
 * against the SRS §9 target, and the confusion list, as JSON (everything) and as a markdown summary.
 */
import { DESIGN_FEATURE_PATHS, type DesignFeaturePath } from "@tafsila/schemas";
import { percentile } from "./percentile";
import type { EvalRun, PhotoRun, RunLimits, RunStop } from "./run";
import {
  confidenceCheck,
  confusions,
  macroAccuracy,
  ratio,
  tally,
  type ConfidenceCheck,
  type Confusion,
  type Tally,
} from "./score";

/** NFR-02: analysis under 30 s at the 95th percentile. */
export const P95_BOUND_MS = 30_000;

/** The median. */
const MEDIAN = 50;

/** The tail percentile NFR-02 bounds. */
const TAIL = 95;

/** SRS §9: AI cost per pattern at most 5 EGP. */
export const TARGET_EGP_PER_PATTERN = 5;

/** Default dollar rate in EGP (decision 338, 4); pass `--usd-egp` for the day's rate. */
export const DEFAULT_USD_EGP = 50;

/** Default chat cost added to one analysis to price a pattern, in EGP (decision 338, 4). */
export const DEFAULT_CHAT_ALLOWANCE_EGP = 1;

/** Who and what was evaluated, and the money settings. */
export interface ReportMeta {
  /** When the run started, ISO 8601. */
  readonly startedAt: string;
  /** Provider name. */
  readonly provider: string;
  /** Model id. */
  readonly model: string;
  /** EGP per USD. */
  readonly usdEgp: number;
  /** Chat cost per pattern, EGP. */
  readonly chatAllowanceEgp: number;
}

/** Latency figures in ms. */
export interface LatencyReport {
  /** Median. */
  readonly p50Ms: number | null;
  /** 95th percentile. */
  readonly p95Ms: number | null;
  /** The NFR-02 bound. */
  readonly boundMs: number;
  /** p95 within the bound. */
  readonly withinBound: boolean | null;
}

/** Cost figures; null when a call's cost is unknown (a model with no price). */
export interface CostReport {
  /** Total spend, USD. */
  readonly totalUsd: number | null;
  /** Average per photo, USD. */
  readonly perPhotoUsd: number | null;
  /** Average per photo, EGP. */
  readonly perPhotoEgp: number | null;
  /** Per photo plus the chat allowance, EGP. */
  readonly perPatternEgp: number | null;
  /** The SRS §9 target, EGP. */
  readonly targetEgp: number;
  /** Per pattern within the target. */
  readonly withinTarget: boolean | null;
}

/** The whole report. */
export interface EvalReport {
  /** Format version of this file. */
  readonly version: 1;
  /** Run details. */
  readonly meta: ReportMeta;
  /** The run's limits. */
  readonly limits: RunLimits;
  /** Why the run stopped early, or null. */
  readonly stopped: RunStop | null;
  /** Photos analysed, and the ids that failed with their error. */
  readonly photos: { readonly analysed: number; readonly failed: readonly { id: string; error: string }[] };
  /** Micro (the M6 exit figure) and macro accuracy, and accuracy per feature. */
  readonly accuracy: {
    readonly micro: Tally;
    readonly macro: number | null;
    readonly perFeature: readonly (Tally & { readonly path: DesignFeaturePath })[];
  };
  /** The low-confidence flag against the truth. */
  readonly confidence: ConfidenceCheck;
  /** Labelled unsupported items reported by the model (not part of the accuracy). */
  readonly unsupported: {
    readonly labelled: number;
    readonly matched: number;
    readonly recall: number | null;
  };
  /** Latency. */
  readonly latency: LatencyReport;
  /** Cost. */
  readonly cost: CostReport;
  /** The most common wrong answers. */
  readonly confusions: readonly Confusion[];
  /** Every photo's raw answer, usage and scores. */
  readonly runs: readonly PhotoRun[];
}

/**
 * Latency of the calls that report one.
 *
 * @param photos - The photo outcomes.
 * @returns p50, p95 and the NFR-02 check.
 */
function latencyReport(photos: readonly PhotoRun[]): LatencyReport {
  const values = photos.flatMap((photo) => (photo.usage ? [photo.usage.latencyMs] : []));
  const p95Ms = percentile(values, TAIL);
  return {
    p50Ms: percentile(values, MEDIAN),
    p95Ms,
    boundMs: P95_BOUND_MS,
    withinBound: p95Ms === null ? null : p95Ms < P95_BOUND_MS,
  };
}

/**
 * Cost of the run, per photo and per pattern.
 *
 * @param photos - The photo outcomes.
 * @param meta - The money settings.
 * @returns The cost figures.
 */
function costReport(photos: readonly PhotoRun[], meta: ReportMeta): CostReport {
  const costs = photos.map((photo) => (photo.usage ? photo.usage.costUsd : 0));
  const known = costs.every((cost) => cost !== undefined) && photos.length > 0;
  const totalUsd = known ? costs.reduce<number>((sum, cost) => sum + (cost ?? 0), 0) : null;
  const perPhotoUsd = totalUsd === null ? null : totalUsd / photos.length;
  const perPhotoEgp = perPhotoUsd === null ? null : perPhotoUsd * meta.usdEgp;
  const perPatternEgp = perPhotoEgp === null ? null : perPhotoEgp + meta.chatAllowanceEgp;
  const withinTarget = perPatternEgp === null ? null : perPatternEgp <= TARGET_EGP_PER_PATTERN;
  return {
    totalUsd,
    perPhotoUsd,
    perPhotoEgp,
    perPatternEgp,
    targetEgp: TARGET_EGP_PER_PATTERN,
    withinTarget,
  };
}

/**
 * Builds the report of a run.
 *
 * @param run - The run.
 * @param limits - Its limits.
 * @param meta - Provider, model, start time and money settings.
 * @returns The report; the same run and meta always give the same report.
 */
export function buildReport(run: EvalRun, limits: RunLimits, meta: ReportMeta): EvalReport {
  const scores = run.photos.flatMap((photo) => photo.features);
  const labelled = run.photos.reduce((sum, photo) => sum + photo.unsupported.labelled, 0);
  const matched = run.photos.reduce((sum, photo) => sum + photo.unsupported.matched, 0);
  const failed = run.photos.flatMap((photo) =>
    photo.error === undefined ? [] : [{ id: photo.id, error: photo.error }],
  );
  return {
    version: 1,
    meta,
    limits,
    stopped: run.stopped ?? null,
    photos: { analysed: run.photos.length, failed },
    accuracy: {
      micro: tally(scores),
      macro: macroAccuracy(run.photos.map((photo) => photo.features)),
      perFeature: DESIGN_FEATURE_PATHS.map((path) => ({
        path,
        ...tally(scores.filter((score) => score.path === path)),
      })),
    },
    confidence: confidenceCheck(scores),
    unsupported: { labelled, matched, recall: ratio(matched, labelled) },
    latency: latencyReport(run.photos),
    cost: costReport(run.photos, meta),
    confusions: confusions(scores),
    runs: run.photos,
  };
}
