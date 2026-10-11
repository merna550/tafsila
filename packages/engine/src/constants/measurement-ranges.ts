/** Hard ranges for body measurements, in millimetres (FR-MEAS-03, ADR-28a). */
import type { Measurements } from "@tafsila/schemas";

/** Names of the numeric body measurements (every key of `Measurements` except `unit`). */
export type MeasurementKey = Exclude<keyof Measurements, "unit">;

/** Inclusive plausible range of one measurement, with the reason it was chosen. */
export interface MeasurementRange {
  /** Smallest accepted value in mm. */
  readonly minMm: number;
  /** Largest accepted value in mm. */
  readonly maxMm: number;
  /** One-line reason for the range (proposal for Merna's review, sewing knowledge). */
  readonly why: string;
}

/**
 * Plausible adult range per measurement, in mm. Outside the range is an error.
 * Tighter than the schema's generic 50-2500 mm limits. Source: proposal in the plan
 * of issue #28, reviewed by Merna in the PR.
 */
export const MEASUREMENT_RANGES_MM: Readonly<Record<MeasurementKey, MeasurementRange>> = {
  height: { minMm: 1400, maxMm: 2000, why: "adult women's height" },
  bust: { minMm: 700, maxMm: 1500, why: "smallest adult to plus sizes" },
  highBust: { minMm: 650, maxMm: 1400, why: "always a little below bust" },
  underBust: { minMm: 600, maxMm: 1300, why: "below bust" },
  waist: { minMm: 500, maxMm: 1400, why: "narrow waist to plus sizes" },
  hip: { minMm: 800, maxMm: 1700, why: "smallest adult to plus sizes" },
  hipDepth: { minMm: 120, maxMm: 280, why: "waist to hip line" },
  neck: { minMm: 250, maxMm: 500, why: "neck circumference" },
  shoulderWidth: { minMm: 280, maxMm: 520, why: "shoulder point to shoulder point" },
  backLength: { minMm: 300, maxMm: 550, why: "nape to waist" },
  frontLength: { minMm: 320, maxMm: 600, why: "shoulder point over bust to waist" },
  bustPointDistance: { minMm: 120, maxMm: 300, why: "distance between bust points" },
  bustHeight: { minMm: 150, maxMm: 420, why: "shoulder point to bust point" },
  armLength: { minMm: 400, maxMm: 750, why: "shoulder to wrist" },
  upperArm: { minMm: 180, maxMm: 500, why: "upper arm circumference" },
  wrist: { minMm: 110, maxMm: 260, why: "wrist circumference" },
  waistToKnee: { minMm: 400, maxMm: 800, why: "waist to knee, shorter than waist to floor" },
  waistToFloor: { minMm: 700, maxMm: 1300, why: "waist to floor, skirt and trouser length" },
};

/** Lowest waistToFloor / height ratio before a warning (waist sits at about 60% of height, with margin). */
export const WAIST_TO_FLOOR_MIN_RATIO = 0.5;

/** Highest waistToFloor / height ratio before a warning (waist sits at about 60% of height, with margin). */
export const WAIST_TO_FLOOR_MAX_RATIO = 0.7;

/** bustPointDistance above this share of the bust circumference is suspicious (bust points sit inside half the bust). */
export const BUST_POINT_DISTANCE_MAX_BUST_SHARE = 0.5;
