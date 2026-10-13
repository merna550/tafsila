/** Form model of the measurement screen: label + 18 boxes typed in centimetres, turned into the API body in millimetres. */
import type { Measurements, SaveMeasurementSetInput } from "@tafsila/schemas";
import { formatCm } from "@tafsila/utils";
import { z } from "zod";
import { ALL_FIELDS, isOptionalField, type MeasurementField } from "./field-groups";
import { parseCm, type CmParseError } from "./units";

/** Longest label; the same limit as the API contract (`measurement-sets.ts`). */
export const MAX_LABEL_LENGTH = 120;

/** Keys of `measurements.errors.*` the label can report. */
export type LabelErrorKey = "labelRequired" | "labelTooLong";

/** Typed text per field, in centimetres ("" = empty). */
export type FieldTexts = Readonly<Record<MeasurementField, string>>;

/** Everything the form holds. `sizeLabel` is "" for a custom set. */
export interface MeasurementFormValues {
  readonly label: string;
  readonly sizeLabel: string;
  readonly fields: FieldTexts;
}

/** Schema of the label box (messages are keys of `measurements.errors`). */
export const labelSchema = z.string().trim().min(1, "labelRequired").max(MAX_LABEL_LENGTH, "labelTooLong");

/** Why a field cannot be turned into millimetres. */
export type FieldError = CmParseError | "required";

/** Result of reading all boxes. */
export interface ParsedFields {
  /** Complete measurements, present only when every box is valid. */
  readonly measurements?: Measurements;
  /** Values read so far in millimetres (valid boxes only), for live validation. */
  readonly partial: Partial<Measurements>;
  /** Boxes that cannot be read. */
  readonly errors: Partial<Record<MeasurementField, FieldError>>;
}

/** All boxes empty. */
export const EMPTY_FIELD_TEXTS: FieldTexts = Object.fromEntries(
  ALL_FIELDS.map((field) => [field, ""]),
) as FieldTexts;

/**
 * Writes measurements as the texts shown in the boxes.
 *
 * @param measurements - Values in millimetres (missing fields stay empty).
 * @returns One text per field.
 */
export function toFieldTexts(measurements: Partial<Measurements>): FieldTexts {
  return Object.fromEntries(
    ALL_FIELDS.map((field) => {
      const mm = measurements[field];
      return [field, typeof mm === "number" ? formatCm(mm) : ""];
    }),
  ) as FieldTexts;
}

/**
 * Reads every box. A required box that is empty is an error; an empty optional box is left out.
 *
 * @param texts - Typed texts.
 * @returns The measurements when all boxes are valid, plus the valid values and the errors.
 */
export function parseFields(texts: FieldTexts): ParsedFields {
  const partial: Partial<Measurements> = {};
  const errors: Partial<Record<MeasurementField, FieldError>> = {};
  for (const field of ALL_FIELDS) {
    const result = parseCm(texts[field]);
    if (result.kind === "value") partial[field] = result.mm;
    else if (result.kind === "error") errors[field] = result.error;
    else if (!isOptionalField(field)) errors[field] = "required";
  }
  if (Object.keys(errors).length > 0) return { partial, errors };
  return { measurements: { unit: "mm", ...partial } as Measurements, partial, errors };
}

/**
 * Builds the save body from valid form values.
 *
 * @param values - Form values.
 * @param measurements - The parsed, complete measurements.
 * @param clientId - Client the set belongs to (create only).
 * @returns The POST body; a custom set has no size label.
 */
export function toSaveBody(
  values: MeasurementFormValues,
  measurements: Measurements,
  clientId?: string,
): SaveMeasurementSetInput {
  return {
    ...(clientId ? { clientId } : {}),
    label: values.label.trim(),
    ...(values.sizeLabel ? { sizeLabel: values.sizeLabel } : {}),
    measurements,
  };
}
