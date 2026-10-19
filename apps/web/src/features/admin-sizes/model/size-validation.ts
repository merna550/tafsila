/** Judging a whole size chart with the engine's measurement rules, size by size. */
import { validateMeasurements } from "@tafsila/engine/measurements";
import type { IssueLike, MeasurementField } from "@/features/measurements/model";
import type { SizeChart } from "@tafsila/schemas";

/** Language of the engine messages. */
export type IssueLocale = "ar" | "en";

/** An engine problem inside one size. */
export interface EngineProblem {
  /** Size label. */
  readonly size: string;
  /** Stable rule code. */
  readonly code: string;
  /** Fields the rule names. */
  readonly fields: readonly MeasurementField[];
  /** Text in the chosen language. */
  readonly text: string;
}

/** Errors and warnings of a chart. */
export interface ChartReport {
  /** Problems that block saving. */
  readonly errors: EngineProblem[];
  /** Problems saved with the chart. */
  readonly warnings: EngineProblem[];
}

/**
 * Turns an engine issue into a problem of one size.
 *
 * @param size - Size label.
 * @param issue - Engine issue.
 * @param locale - Message language.
 * @returns The problem.
 */
function toProblem(size: string, issue: IssueLike, locale: IssueLocale): EngineProblem {
  return {
    size,
    code: issue.code,
    fields: issue.fields as MeasurementField[],
    text: locale === "ar" ? issue.message_ar : issue.message_en,
  };
}

/**
 * Runs the engine's rules on every size of a chart.
 *
 * @param chart - Complete sizes in millimetres.
 * @param locale - Message language.
 * @returns Errors and warnings with the size they belong to.
 */
export function validateChart(chart: SizeChart, locale: IssueLocale): ChartReport {
  const errors: EngineProblem[] = [];
  const warnings: EngineProblem[] = [];
  for (const [size, measurements] of Object.entries(chart)) {
    const report = validateMeasurements(measurements);
    errors.push(...report.errors.map((issue) => toProblem(size, issue, locale)));
    warnings.push(...report.warnings.map((issue) => toProblem(size, issue, locale)));
  }
  return { errors, warnings };
}
