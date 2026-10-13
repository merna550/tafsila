/** The set name box and the "from a standard size / custom" switch with the size chips. */
import { Input, Tabs } from "@tafsila/ui";
import { useTranslations } from "next-intl";
import type { ReactElement } from "react";
import type { UseFormReturn } from "react-hook-form";
import { labelSchema, type MeasurementFormValues } from "../model/measurement-form.schema";
import type { StartMode } from "../model/start-mode";
import { SizePicker } from "./SizePicker";

/** Props for {@link StartModeTabs}. */
interface StartModeTabsProps {
  /** The form (for the label box and the picked size). */
  readonly form: UseFormReturn<MeasurementFormValues>;
  /** Size labels of the chart, in order. */
  readonly sizes: readonly string[];
  /** Name of the chart. */
  readonly chartName: string;
  /** Current start mode. */
  readonly mode: StartMode;
  /** Switches the start mode. */
  readonly onModeChange: (mode: StartMode) => void;
  /** Picks a size. */
  readonly onPickSize: (size: string) => void;
  /** Page direction. */
  readonly dir: "rtl" | "ltr";
}

/**
 * Checks the label with the shared schema.
 *
 * @param value - Typed label.
 * @returns True, or the message key of the problem.
 */
function validateLabel(value: string): true | string {
  const result = labelSchema.safeParse(value);
  return result.success ? true : (result.error.issues[0]?.message ?? "labelRequired");
}

/**
 * Renders the card at the top of the form.
 *
 * @param props - Form, sizes, mode and handlers.
 * @returns The card.
 */
export function StartModeTabs(props: Readonly<StartModeTabsProps>): ReactElement {
  const { form, sizes, chartName, mode, onModeChange, onPickSize, dir } = props;
  const t = useTranslations("measurements");
  const errors = useTranslations("measurements.errors");
  const labelKey = form.formState.errors.label?.message;
  return (
    <section className="flex flex-col gap-5 rounded-lg bg-surface p-4 shadow-card sm:p-5">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="set-label" className="text-sm font-semibold text-text">
          {t("setLabel.label")}
        </label>
        <Input
          id="set-label"
          autoComplete="off"
          placeholder={t("setLabel.placeholder")}
          aria-invalid={Boolean(labelKey)}
          {...form.register("label", { validate: validateLabel })}
        />
        {labelKey ? (
          <p role="alert" className="text-sm font-semibold text-danger">
            {errors(labelKey as "labelRequired" | "labelTooLong")}
          </p>
        ) : null}
      </div>
      <Tabs
        label={t("mode.label")}
        dir={dir}
        value={mode}
        onValueChange={(value) => onModeChange(value as StartMode)}
        items={[
          {
            value: "size",
            label: t("mode.size"),
            content: (
              <SizePicker
                sizes={sizes}
                value={form.watch("sizeLabel")}
                onPick={onPickSize}
                chartName={chartName}
              />
            ),
          },
          {
            value: "custom",
            label: t("mode.custom"),
            content: <p className="text-sm text-muted">{t("mode.customHint")}</p>,
          },
        ]}
      />
    </section>
  );
}
