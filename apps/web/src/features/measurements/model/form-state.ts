/** Pure rules behind the measurement form: size picking, resetting a box and judging the whole form. */
import { validateMeasurements } from "@tafsila/engine";
import type { SizeChart } from "@tafsila/schemas";
import type { MeasurementField } from "./field-groups";
import { toIssueView, type IssueLocale, type IssueView } from "./issues";
import {
  labelSchema,
  parseFields,
  toFieldTexts,
  type FieldTexts,
  type MeasurementFormValues,
  type ParsedFields,
} from "./measurement-form.schema";
import { resetField, sizeOf } from "./overrides";

/** Verdict on the current form values. */
export interface FormVerdict {
  /** What could be read from the boxes. */
  readonly parsed: ParsedFields;
  /** Engine problems per field (empty while a box cannot be read). */
  readonly issues: IssueView;
  /** True when the label is valid, every box is readable and the engine reports no error. */
  readonly canSave: boolean;
}

/**
 * Writes a chart size as box texts.
 *
 * @param chart - Size chart.
 * @param sizeLabel - Size label such as "M".
 * @returns The texts, or undefined for an unknown size.
 */
export function fieldsForSize(chart: SizeChart, sizeLabel: string): FieldTexts | undefined {
  const size = sizeOf(chart, sizeLabel);
  return size ? toFieldTexts(size) : undefined;
}

/**
 * Gives the text a box has in the picked size.
 *
 * @param chart - Size chart.
 * @param sizeLabel - Size the set started from.
 * @param fields - Current texts.
 * @param field - Box to reset.
 * @returns The size's text for the box ("" when the size has none); the current text for an unknown size.
 */
export function resetFieldText(
  chart: SizeChart,
  sizeLabel: string,
  fields: FieldTexts,
  field: MeasurementField,
): string {
  if (!sizeOf(chart, sizeLabel)) return fields[field];
  return toFieldTexts(resetField(chart, sizeLabel, parseFields(fields).partial, field))[field];
}

/**
 * Judges the form: parses the boxes and runs the engine when every box is readable.
 *
 * @param values - Current form values.
 * @param locale - Language of the engine messages.
 * @returns Parsed boxes, issues per field and whether saving is allowed.
 */
export function judgeForm(values: MeasurementFormValues, locale: IssueLocale): FormVerdict {
  const parsed = parseFields(values.fields);
  const report = parsed.measurements
    ? validateMeasurements(parsed.measurements)
    : { errors: [], warnings: [] };
  const issues = toIssueView(report, locale);
  const canSave =
    labelSchema.safeParse(values.label).success &&
    parsed.measurements !== undefined &&
    issues.errorCount === 0;
  return { parsed, issues, canSave };
}
