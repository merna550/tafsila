/** Turns a validation report into the rows the report panel shows (issue #249, FR-VAL-09). */
import type { ValidationCheck, ValidationReport } from "@tafsila/schemas";
import { resolveRef } from "@tafsila/engine/viewer";
import { mmToCmText } from "@/shared/format";
import type { PatternScene, ViewerTarget } from "./types";

/** One check with what selecting it highlights. */
export interface ReportRow {
  /** Stable key: check id, code and position in the report. */
  readonly key: string;
  /** The engine's check. */
  readonly check: ValidationCheck;
  /** Pieces, edges and darts its `refs` point at; unresolvable refs are dropped. */
  readonly targets: readonly ViewerTarget[];
  /** Measured value in cm, when the check has one. */
  readonly measuredCm?: string;
  /** Expected value in cm, when the check has one. */
  readonly expectedCm?: string;
}

/** The report split for display. */
export interface ReportRows {
  /** Input-measurement rejections (FR-MEAS-01): shown by the form, never as rows. */
  readonly formLevel: readonly ValidationCheck[];
  /** Failed checks, in report order. */
  readonly failures: readonly ReportRow[];
  /** Warnings, in report order. */
  readonly warnings: readonly ReportRow[];
  /** Passed checks, in report order. */
  readonly passes: readonly ReportRow[];
}

/**
 * Builds one row: key, targets from `refs` and the values in cm.
 *
 * @param check - The check.
 * @param index - Its position in the report.
 * @param scene - The scene the refs are looked up in.
 * @returns The row.
 */
function toRow(check: ValidationCheck, index: number, scene: PatternScene): ReportRow {
  const targets = (check.refs ?? []).flatMap((ref) => {
    const target = resolveRef(scene, ref);
    return target ? [target] : [];
  });
  return {
    key: `${check.id}-${check.code ?? ""}-${index}`,
    check,
    targets,
    ...(check.measuredMm === undefined ? {} : { measuredCm: mmToCmText(check.measuredMm) }),
    ...(check.expectedMm === undefined ? {} : { expectedCm: mmToCmText(check.expectedMm) }),
  };
}

/**
 * Splits a report into form-level messages, failures, warnings and passes.
 *
 * @param report - The engine's validation report.
 * @param scene - The scene its refs point into.
 * @returns The rows, each group in report order.
 */
export function reportRows(report: ValidationReport, scene: PatternScene): ReportRows {
  const rows = report.checks.map((check, i) => ({ check, row: toRow(check, i, scene) }));
  /**
   * Rows of one status, without form-level checks.
   *
   * @param status - The status to keep.
   * @returns The rows.
   */
  const pick = (status: ValidationCheck["status"]): ReportRow[] =>
    rows.filter((r) => r.check.id !== "FR-MEAS-01" && r.check.status === status).map((r) => r.row);
  return {
    formLevel: report.checks.filter((c) => c.id === "FR-MEAS-01"),
    failures: pick("fail"),
    warnings: pick("warn"),
    passes: pick("pass"),
  };
}
