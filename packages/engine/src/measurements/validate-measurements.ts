/** Measurement validation: hard ranges (errors) and cross-checks (errors or warnings), FR-MEAS-03. */
import type { Measurements } from "@tafsila/schemas";
import {
  BUST_POINT_DISTANCE_MAX_BUST_SHARE,
  MEASUREMENT_RANGES_MM,
  WAIST_TO_FLOOR_MAX_RATIO,
  WAIST_TO_FLOOR_MIN_RATIO,
  type MeasurementKey,
} from "../constants/measurement-ranges";
import {
  CROSS_CHECK_MESSAGES,
  MEASUREMENT_LABELS,
  type MeasurementIssue,
  type MeasurementIssueCode,
  type MeasurementReport,
} from "./codes";

/** Rule that inspects the whole set and returns an issue, or undefined when fine. */
type CrossCheck = (m: Measurements) => MeasurementIssue | undefined;

/**
 * Builds a cross-check issue from its code and the measurements it concerns.
 *
 * @param code - Rule code (any code except the range one).
 * @param fields - Measurements involved.
 * @returns The issue with both languages filled in.
 */
function crossIssue(
  code: Exclude<MeasurementIssueCode, "MEAS_OUT_OF_RANGE">,
  fields: readonly MeasurementKey[],
): MeasurementIssue {
  const text = CROSS_CHECK_MESSAGES[code];
  return { code, fields, message_ar: text.ar, message_en: text.en };
}

/**
 * Finds every measurement outside its hard range.
 *
 * @param m - Measurements to check.
 * @returns One `MEAS_OUT_OF_RANGE` issue per field outside its range (absent optional fields are skipped).
 */
function rangeErrors(m: Measurements): MeasurementIssue[] {
  const issues: MeasurementIssue[] = [];
  for (const key of Object.keys(MEASUREMENT_RANGES_MM) as MeasurementKey[]) {
    const value = m[key];
    if (value === undefined) continue;
    const { minMm, maxMm } = MEASUREMENT_RANGES_MM[key];
    if (value >= minMm && value <= maxMm) continue;
    const label = MEASUREMENT_LABELS[key];
    issues.push({
      code: "MEAS_OUT_OF_RANGE",
      fields: [key],
      message_ar: `${label.ar} (${value} مم) خارج المدى المعقول من ${minMm} إلى ${maxMm} مم.`,
      message_en: `${label.en} (${value} mm) is outside the plausible range ${minMm} to ${maxMm} mm.`,
    });
  }
  return issues;
}

/**
 * High bust above bust is impossible.
 *
 * @param m - Measurements to check.
 * @returns The issue, or undefined when fine.
 */
function highBustAboveBust(m: Measurements): MeasurementIssue | undefined {
  return m.highBust > m.bust ? crossIssue("MEAS_HIGH_BUST_EXCEEDS_BUST", ["highBust", "bust"]) : undefined;
}

/**
 * Under bust at or above bust is impossible (when under bust is given).
 *
 * @param m - Measurements to check.
 * @returns The issue, or undefined when fine.
 */
function underBustNotBelowBust(m: Measurements): MeasurementIssue | undefined {
  return m.underBust !== undefined && m.underBust >= m.bust
    ? crossIssue("MEAS_UNDER_BUST_NOT_BELOW_BUST", ["underBust", "bust"])
    : undefined;
}

/**
 * Waist to knee at or above waist to floor is impossible.
 *
 * @param m - Measurements to check.
 * @returns The issue, or undefined when fine.
 */
function kneeNotAboveFloorLength(m: Measurements): MeasurementIssue | undefined {
  return m.waistToKnee >= m.waistToFloor
    ? crossIssue("MEAS_KNEE_BELOW_FLOOR_LENGTH", ["waistToKnee", "waistToFloor"])
    : undefined;
}

/**
 * Waist at or above hip is unusual for most bodies (SRS FR-MEAS-03).
 *
 * @param m - Measurements to check.
 * @returns The issue, or undefined when fine.
 */
function waistNotBelowHip(m: Measurements): MeasurementIssue | undefined {
  return m.waist >= m.hip ? crossIssue("MEAS_WAIST_NOT_BELOW_HIP", ["waist", "hip"]) : undefined;
}

/**
 * Bust points further apart than half the bust are unusual.
 *
 * @param m - Measurements to check.
 * @returns The issue, or undefined when fine.
 */
function bustPointsTooWide(m: Measurements): MeasurementIssue | undefined {
  return m.bustPointDistance > m.bust * BUST_POINT_DISTANCE_MAX_BUST_SHARE
    ? crossIssue("MEAS_BUST_POINTS_TOO_WIDE", ["bustPointDistance", "bust"])
    : undefined;
}

/**
 * Front length shorter than back length is unusual (the front is longer over the bust).
 *
 * @param m - Measurements to check.
 * @returns The issue, or undefined when fine.
 */
function frontShorterThanBack(m: Measurements): MeasurementIssue | undefined {
  return m.frontLength < m.backLength
    ? crossIssue("MEAS_FRONT_SHORTER_THAN_BACK", ["frontLength", "backLength"])
    : undefined;
}

/**
 * Waist to floor outside 50% to 70% of height is unusual.
 *
 * @param m - Measurements to check.
 * @returns The issue, or undefined when fine.
 */
function waistToFloorUnusual(m: Measurements): MeasurementIssue | undefined {
  const ratio = m.waistToFloor / m.height;
  return ratio < WAIST_TO_FLOOR_MIN_RATIO || ratio > WAIST_TO_FLOOR_MAX_RATIO
    ? crossIssue("MEAS_WAIST_TO_FLOOR_UNUSUAL", ["waistToFloor", "height"])
    : undefined;
}

/** Cross-checks whose failure makes the measurements impossible (blocking). */
const ERROR_CHECKS: readonly CrossCheck[] = [
  highBustAboveBust,
  underBustNotBelowBust,
  kneeNotAboveFloorLength,
];

/** Cross-checks whose failure is only suspicious (never blocking). */
const WARNING_CHECKS: readonly CrossCheck[] = [
  waistNotBelowHip,
  bustPointsTooWide,
  frontShorterThanBack,
  waistToFloorUnusual,
];

/**
 * Runs checks and keeps the issues they found.
 *
 * @param checks - Cross-check rules.
 * @param m - Measurements to check.
 * @returns Issues in rule order.
 */
function runChecks(checks: readonly CrossCheck[], m: Measurements): MeasurementIssue[] {
  return checks.map((check) => check(m)).filter((issue): issue is MeasurementIssue => issue !== undefined);
}

/**
 * Decides whether measurements are valid, suspicious or impossible (FR-MEAS-03).
 * Pure and deterministic; problems are returned as data, never thrown.
 *
 * @param m - Body measurements in mm.
 * @returns Errors (block the pattern) and warnings (shown, never block), both bilingual with stable codes.
 */
export function validateMeasurements(m: Measurements): MeasurementReport {
  return {
    errors: [...rangeErrors(m), ...runChecks(ERROR_CHECKS, m)],
    warnings: runChecks(WARNING_CHECKS, m),
  };
}
