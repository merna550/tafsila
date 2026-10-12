/** Runs the engine's measurement rules: errors block the save, warnings are returned to the client (FR-MEAS-03/04). */
import { validateMeasurements } from "@tafsila/engine";
import type { MeasurementIssueDto, Measurements } from "@tafsila/schemas";
import { MeasurementsInvalidError } from "./errors";

/** Structural shape of an engine issue (read-only arrays). */
type EngineIssue = Pick<MeasurementIssueDto, "code" | "message_ar" | "message_en"> & {
  readonly fields: readonly string[];
};

/**
 * Converts an engine issue to the API shape (plain arrays and strings).
 *
 * @param issue - Engine issue.
 * @returns The issue as the API returns it.
 */
function toDto(issue: EngineIssue): MeasurementIssueDto {
  return {
    code: issue.code,
    fields: [...issue.fields],
    message_ar: issue.message_ar,
    message_en: issue.message_en,
  };
}

/**
 * Lists the warnings for measurements that are allowed to be saved.
 *
 * @param measurements - Shape-valid measurements.
 * @returns Warnings (never blocking).
 */
export function warningsOf(measurements: Measurements): MeasurementIssueDto[] {
  return validateMeasurements(measurements).warnings.map(toDto);
}

/**
 * Checks measurements and returns the warnings; throws when the engine reports an error.
 *
 * @param measurements - Shape-valid measurements.
 * @returns Warnings to hand back to the client.
 * @throws {MeasurementsInvalidError} When any blocking issue exists (422).
 */
export function checkMeasurements(measurements: Measurements): MeasurementIssueDto[] {
  const report = validateMeasurements(measurements);
  if (report.errors.length > 0) throw new MeasurementsInvalidError(report.errors.map(toDto));
  return report.warnings.map(toDto);
}
