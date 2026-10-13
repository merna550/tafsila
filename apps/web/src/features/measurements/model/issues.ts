/** Maps engine problems (and the API's 422 details) to per-field messages in the current language. */
import type { MeasurementField } from "./field-groups";

/** An engine issue or an API `details.issues` entry. */
export interface IssueLike {
  readonly code: string;
  readonly fields: readonly string[];
  readonly message_ar: string;
  readonly message_en: string;
}

/** Language of the messages. */
export type IssueLocale = "ar" | "en";

/** Message under one field. */
export interface FieldMessage {
  /** Stable rule code. */
  readonly code: string;
  /** Text in the chosen language. */
  readonly text: string;
}

/** Messages per field. */
export type FieldMessages = Partial<Record<MeasurementField, FieldMessage[]>>;

/** Problems ready for the screen. */
export interface IssueView {
  /** Errors per field: they block saving. */
  readonly errors: FieldMessages;
  /** Warnings per field: shown in amber, never block. */
  readonly warnings: FieldMessages;
  /** Number of distinct error issues, for the "N errors to fix" line. */
  readonly errorCount: number;
}

/**
 * Puts each issue under every field it names.
 *
 * @param issues - Engine or API issues.
 * @param locale - Message language.
 * @returns Messages per field.
 */
export function messagesByField(issues: readonly IssueLike[], locale: IssueLocale): FieldMessages {
  const result: FieldMessages = {};
  for (const issue of issues) {
    const text = locale === "ar" ? issue.message_ar : issue.message_en;
    for (const field of issue.fields as MeasurementField[]) {
      const existing = result[field] ?? [];
      result[field] = [...existing, { code: issue.code, text }];
    }
  }
  return result;
}

/**
 * Builds the view of an engine report.
 *
 * @param report - Errors and warnings.
 * @param locale - Message language.
 * @returns Errors and warnings per field plus the error count.
 */
export function toIssueView(
  report: { readonly errors: readonly IssueLike[]; readonly warnings: readonly IssueLike[] },
  locale: IssueLocale,
): IssueView {
  return {
    errors: messagesByField(report.errors, locale),
    warnings: messagesByField(report.warnings, locale),
    errorCount: report.errors.length,
  };
}
