/** The measurement form: set name, start mode, the grouped boxes, the tips card and the save bar. */
import type { SizeChart } from "@tafsila/schemas";
import { formatCm } from "@tafsila/utils";
import { useTranslations } from "next-intl";
import type { BaseSyntheticEvent, ReactElement } from "react";
import type { UseFormReturn } from "react-hook-form";
import { FIELD_GROUPS, type MeasurementField as FieldKey } from "../model/field-groups";
import type { IssueView } from "../model/issues";
import type { FieldError, MeasurementFormValues } from "../model/measurement-form.schema";
import { sizeOf } from "../model/overrides";
import type { StartMode } from "../model/start-mode";
import { FieldGroup } from "./FieldGroup";
import { MeasurementField } from "./MeasurementField";
import { MeasuringTips } from "./MeasuringTips";
import { SaveBar } from "./SaveBar";
import { StartModeTabs } from "./StartModeTabs";

/** What the form reads from `useMeasurementForm`. */
export interface FormStateView {
  /** The React Hook Form instance. */
  readonly form: UseFormReturn<MeasurementFormValues>;
  /** Engine problems per field. */
  readonly issues: IssueView;
  /** Boxes that cannot be read. */
  readonly fieldErrors: Partial<Record<FieldKey, FieldError>>;
  /** Fields that differ from the picked size. */
  readonly changed: readonly FieldKey[];
  /** True when saving is allowed. */
  readonly canSave: boolean;
  /** Fills all boxes from a size. */
  readonly pickSize: (size: string) => void;
  /** Puts the size's value back into one box. */
  readonly resetToSize: (field: FieldKey) => void;
}

/** Props for {@link MeasurementForm}. */
export interface MeasurementFormProps {
  /** The form state from the hook. */
  readonly state: FormStateView;
  /** The default chart (sizes and the values behind "reset"). */
  readonly chart: SizeChart;
  /** Name of the chart. */
  readonly chartName: string;
  /** Current start mode. */
  readonly mode: StartMode;
  /** Switches the start mode. */
  readonly onModeChange: (mode: StartMode) => void;
  /** Opens the guide of a field. */
  readonly onGuide: (field: FieldKey) => void;
  /** Submit handler of the `<form>`. */
  readonly onSubmit: (event?: BaseSyntheticEvent) => void;
  /** True while saving. */
  readonly pending: boolean;
  /** Where "cancel" goes. */
  readonly cancelHref: string;
  /** Page direction. */
  readonly dir: "rtl" | "ltr";
}

/**
 * Picks the text under a box: the engine's error first, then a reading problem once the box was touched.
 *
 * @param state - The form state.
 * @param field - The box.
 * @param t - Translator of `measurements.errors`.
 * @returns The text, or undefined.
 */
function errorText(
  state: FormStateView,
  field: FieldKey,
  t: ReturnType<typeof useTranslations>,
): string | undefined {
  const engine = state.issues.errors[field]?.[0]?.text;
  if (engine) return engine;
  const reading = state.fieldErrors[field];
  const { touchedFields, dirtyFields } = state.form.formState;
  return reading && (touchedFields.fields?.[field] ?? dirtyFields.fields?.[field]) ? t(reading) : undefined;
}

/**
 * Tells whether a box has any problem to show.
 *
 * @param state - The form state.
 * @param field - The box.
 * @returns True when an error or warning exists.
 */
function hasProblem(state: FormStateView, field: FieldKey): boolean {
  return Boolean(state.issues.errors[field] ?? state.issues.warnings[field] ?? state.fieldErrors[field]);
}

/**
 * Renders the form.
 *
 * @param props - State, chart, mode and handlers.
 * @returns The form element with the tips card beside it.
 */
export function MeasurementForm(props: Readonly<MeasurementFormProps>): ReactElement {
  const { state, chart, chartName, mode, onModeChange, onGuide, onSubmit, pending, cancelHref, dir } = props;
  const errors = useTranslations("measurements.errors");
  const { form, issues, changed } = state;
  const sizeLabel = form.watch("sizeLabel");
  const base = sizeLabel ? sizeOf(chart, sizeLabel) : undefined;
  return (
    <form onSubmit={onSubmit} noValidate className="grid items-start gap-6 lg:grid-cols-3">
      <div className="flex min-w-0 flex-col gap-5 lg:col-span-2">
        <StartModeTabs
          form={form}
          sizes={Object.keys(chart)}
          chartName={chartName}
          mode={mode}
          onModeChange={onModeChange}
          onPickSize={state.pickSize}
          dir={dir}
        />
        {FIELD_GROUPS.map((group, index) => (
          <FieldGroup
            key={group.id}
            id={group.id}
            count={group.fields.length}
            size={sizeLabel || undefined}
            defaultOpen={index === 0}
            hasIssue={group.fields.some((field) => hasProblem(state, field))}
          >
            {group.fields.map((field) => (
              <MeasurementField
                key={field}
                field={field}
                inputProps={form.register(`fields.${field}`)}
                error={errorText(state, field, errors)}
                warning={issues.warnings[field]?.[0]?.text}
                changed={changed.includes(field)}
                baseValue={{ size: sizeLabel, cm: base?.[field] === undefined ? "—" : formatCm(base[field]) }}
                onReset={() => state.resetToSize(field)}
                onGuide={() => onGuide(field)}
              />
            ))}
          </FieldGroup>
        ))}
        <SaveBar
          canSave={state.canSave}
          pending={pending}
          errorCount={issues.errorCount}
          cancelHref={cancelHref}
        />
      </div>
      <MeasuringTips />
    </form>
  );
}
