/** Turns bad input into a `fail` report instead of a throw (decision 121). */
import {
  designSpecSchema,
  engineOptionsSchema,
  measurementsSchema,
  type DesignSpec,
  type EngineOptions,
  type Measurements,
  type ValidationCheck,
} from "@tafsila/schemas";
import type { MeasurementIssue } from "../measurements/codes";
import { validateMeasurements } from "../measurements/validate-measurements";

/** The checked input, or the reasons it was refused. Warnings never refuse. */
export interface InputCheckResult {
  /** Parsed values, present only when there are no `fail` checks. */
  readonly input?: { spec: DesignSpec; measurements: Measurements; options: EngineOptions };
  /** `fail` checks (when refused) and `warn` checks (always kept). */
  readonly checks: readonly ValidationCheck[];
}

/** The part of a Zod error this file reads (the engine does not depend on zod directly). */
interface SchemaError {
  readonly issues: readonly { readonly path: readonly PropertyKey[]; readonly message: string }[];
}

/**
 * Builds the bilingual `fail` check for a schema error.
 *
 * @param code - Stable code, e.g. SPEC_INVALID.
 * @param what - Name of the input, used in the English text.
 * @param error - The Zod error.
 * @returns One failing FR-MEAS-01 check.
 */
function schemaFail(code: string, what: string, error: SchemaError): ValidationCheck {
  const detail = error.issues
    .map((i) => `${i.path.map(String).join(".") || "(root)"}: ${i.message}`)
    .join("; ");
  return {
    id: "FR-MEAS-01",
    code,
    status: "fail",
    message: { ar: `مدخلات غير صالحة (${what}). راجعي القيم المدخلة.`, en: `Invalid ${what}: ${detail}` },
  };
}

/**
 * Converts a measurement issue to a report check.
 *
 * @param issue - The issue.
 * @param status - `fail` for errors, `warn` for warnings.
 * @returns The check.
 */
function issueCheck(issue: MeasurementIssue, status: "fail" | "warn"): ValidationCheck {
  return {
    id: "FR-MEAS-01",
    code: issue.code,
    status,
    message: { ar: issue.message_ar, en: issue.message_en },
    refs: [...issue.fields],
  };
}

/**
 * Parses and checks all three inputs.
 *
 * @param spec - Unknown design.
 * @param measurements - Unknown measurements.
 * @param options - Unknown options.
 * @returns The parsed input when nothing failed, plus every check found.
 */
export function checkInput(spec: unknown, measurements: unknown, options: unknown): InputCheckResult {
  const s = designSpecSchema.safeParse(spec);
  const m = measurementsSchema.safeParse(measurements);
  const o = engineOptionsSchema.safeParse(options);
  const fails: ValidationCheck[] = [];
  if (!s.success) fails.push(schemaFail("SPEC_INVALID", "design spec", s.error));
  if (!m.success) fails.push(schemaFail("MEAS_INVALID", "measurements", m.error));
  if (!o.success) fails.push(schemaFail("OPTIONS_INVALID", "options", o.error));
  const report = m.success ? validateMeasurements(m.data) : { errors: [], warnings: [] };
  fails.push(...report.errors.map((e) => issueCheck(e, "fail")));
  const warns = report.warnings.map((w) => issueCheck(w, "warn"));
  if (fails.length > 0 || !s.success || !m.success || !o.success) return { checks: [...fails, ...warns] };
  return { input: { spec: s.data, measurements: m.data, options: o.data }, checks: warns };
}
