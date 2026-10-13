"use client";
/** Hook behind the measurement form: React Hook Form, start mode, size picking, overrides and live engine validation. */
import type { MeasurementSet, SizeChart } from "@tafsila/schemas";
import { useCallback, useMemo } from "react";
import { useForm, useWatch, type UseFormReturn } from "react-hook-form";
import { useDebouncedValue } from "@/shared/hooks/use-debounced-value";
import type { MeasurementField } from "../model/field-groups";
import { fieldsForSize, judgeForm, resetFieldText } from "../model/form-state";
import type { IssueLocale, IssueView } from "../model/issues";
import {
  EMPTY_FIELD_TEXTS,
  parseFields,
  toFieldTexts,
  toSaveBody,
  type FieldError,
  type MeasurementFormValues,
} from "../model/measurement-form.schema";
import { diffFromSize } from "../model/overrides";

/** Wait before the engine re-checks after typing (ms). */
export const VALIDATE_DEBOUNCE_MS = 200;

/** What the screen needs. */
export interface MeasurementForm {
  /** The React Hook Form instance (label, size label and the 18 texts). */
  readonly form: UseFormReturn<MeasurementFormValues>;
  /** Problems per field from the engine, in the current language. */
  readonly issues: IssueView;
  /** Boxes that cannot be read at all (empty required, not a number, too many decimals). */
  readonly fieldErrors: Partial<Record<MeasurementField, FieldError>>;
  /** Fields that differ from the picked size. */
  readonly changed: readonly MeasurementField[];
  /** True when the label is valid, every box is readable and the engine reports no error. */
  readonly canSave: boolean;
  /** Fills all boxes from a size of the chart. */
  readonly pickSize: (sizeLabel: string) => void;
  /** Leaves the size: keeps the typed values and forgets the size label. */
  readonly switchToCustom: () => void;
  /** Puts the size's value back into one box. */
  readonly resetToSize: (field: MeasurementField) => void;
  /** Builds the save body, or undefined when the form is not valid. */
  readonly buildBody: (clientId?: string) => ReturnType<typeof toSaveBody> | undefined;
}

/** Options of {@link useMeasurementForm}. */
export interface MeasurementFormOptions {
  /** The default size chart. */
  readonly chart: SizeChart;
  /** Language of the engine messages. */
  readonly locale: IssueLocale;
  /** The set being edited; leave out for a new one. */
  readonly initial?: MeasurementSet;
}

/**
 * Builds the starting values of the form.
 *
 * @param initial - The set being edited, if any.
 * @returns Label, size label and texts (empty for a new set).
 */
function startingValues(initial: MeasurementSet | undefined): MeasurementFormValues {
  return initial
    ? { label: initial.label, sizeLabel: initial.sizeLabel ?? "", fields: toFieldTexts(initial.measurements) }
    : { label: "", sizeLabel: "", fields: EMPTY_FIELD_TEXTS };
}

/**
 * Wires the measurement form. The engine checks run on the debounced values; saving needs a valid label,
 * readable boxes and no engine error (warnings never block).
 *
 * @param options - Chart, language and the set being edited.
 * @returns The form and the derived state.
 */
export function useMeasurementForm({
  chart,
  locale,
  initial,
}: Readonly<MeasurementFormOptions>): MeasurementForm {
  const form = useForm<MeasurementFormValues>({ defaultValues: startingValues(initial), mode: "onChange" });
  const values = useWatch({ control: form.control }) as MeasurementFormValues;
  const verdict = useMemo(() => judgeForm(values, locale), [values, locale]);
  const settled = useDebouncedValue(verdict, VALIDATE_DEBOUNCE_MS);
  const changed = useMemo(
    () => (values.sizeLabel ? diffFromSize(chart, values.sizeLabel, verdict.parsed.partial) : []),
    [chart, values.sizeLabel, verdict.parsed.partial],
  );
  const pickSize = useCallback(
    (sizeLabel: string) => {
      const fields = fieldsForSize(chart, sizeLabel);
      if (!fields) return;
      form.setValue("sizeLabel", sizeLabel);
      form.setValue("fields", fields);
    },
    [chart, form],
  );
  const switchToCustom = useCallback(() => form.setValue("sizeLabel", ""), [form]);
  const resetToSize = useCallback(
    (field: MeasurementField) => {
      const { sizeLabel, fields } = form.getValues();
      form.setValue(`fields.${field}`, resetFieldText(chart, sizeLabel, fields, field));
    },
    [chart, form],
  );
  const buildBody = useCallback(
    (clientId?: string) => {
      const current = form.getValues();
      const { measurements } = parseFields(current.fields);
      return measurements ? toSaveBody(current, measurements, clientId) : undefined;
    },
    [form],
  );
  return {
    form,
    issues: settled.issues,
    fieldErrors: verdict.parsed.errors,
    changed,
    canSave: verdict.canSave,
    pickSize,
    switchToCustom,
    resetToSize,
    buildBody,
  };
}
