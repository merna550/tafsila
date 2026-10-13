/** Runs the engine's measurement rules on every size of a chart: errors block the save, warnings are saved and returned (FR-MEAS-01/03). */
import { validateMeasurements } from "@tafsila/engine";
import type { SizeChart, SizeChartIssue } from "@tafsila/schemas";
import { SizeChartInvalidError } from "./errors";

/**
 * Checks every size and returns the warnings; throws when any size has a blocking issue.
 *
 * @param sizes - Shape-valid chart (size label to measurements).
 * @returns Warnings of all sizes, each tagged with its size label.
 * @throws {SizeChartInvalidError} When any size has an engine error (422); lists the errors of every size.
 */
export function checkSizeChart(sizes: SizeChart): SizeChartIssue[] {
  const errors: SizeChartIssue[] = [];
  const warnings: SizeChartIssue[] = [];
  for (const [size, measurements] of Object.entries(sizes)) {
    const report = validateMeasurements(measurements);
    /**
     * Tags an engine issue with the size it belongs to.
     *
     * @param issue - Engine issue.
     * @returns The issue as the API returns it.
     */
    const tag = (issue: (typeof report.errors)[number]): SizeChartIssue => ({
      size,
      code: issue.code,
      fields: [...issue.fields],
      message_ar: issue.message_ar,
      message_en: issue.message_en,
    });
    errors.push(...report.errors.map(tag));
    warnings.push(...report.warnings.map(tag));
  }
  if (errors.length > 0) throw new SizeChartInvalidError(errors);
  return warnings;
}
