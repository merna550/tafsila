/** The fabric options form: width presets or custom, folded or open, nap, shrinkage and repeat (FR-FAB-01). Values in, events out. */
import { Button, FormField, Input, SegmentedControl, Switch } from "@tafsila/ui";
import { useTranslations } from "next-intl";
import type { ReactElement } from "react";
import {
  CUSTOM_WIDTH,
  WIDTH_PRESETS_CM,
  type FabricFormError,
  type FabricFormField,
  type FabricFormValues,
} from "../model/fabric-form";

/** Props of {@link FabricOptionsForm}. */
interface FabricOptionsFormProps {
  /** Current field values. */
  readonly values: FabricFormValues;
  /** Message key (under `fabric.calc.errors`) per wrong field. */
  readonly errors: Partial<Record<FabricFormField, FabricFormError>>;
  /** True while a calculation runs; the submit button is off. */
  readonly busy: boolean;
  /** True when a result already exists, so the button says "Recalculate". */
  readonly hasResult: boolean;
  /** Called with the changed fields. */
  readonly onChange: (patch: Partial<FabricFormValues>) => void;
  /** Called when the user asks to calculate. */
  readonly onSubmit: () => void;
}

/** Props shared by the field groups. */
interface FieldsProps {
  /** Current field values. */
  readonly values: FabricFormValues;
  /** Message key per wrong field. */
  readonly errors: Partial<Record<FabricFormField, FabricFormError>>;
  /** Called with the changed fields. */
  readonly onChange: (patch: Partial<FabricFormValues>) => void;
}

/**
 * Renders the width presets and the custom width field.
 *
 * @param props - Values, errors and the change handler.
 * @returns The width group.
 */
function WidthGroup({ values, errors, onChange }: Readonly<FieldsProps>): ReactElement {
  const t = useTranslations("fabric.calc");
  const choices = [
    ...WIDTH_PRESETS_CM.map((cm) => ({ value: String(cm), label: String(cm) })),
    { value: CUSTOM_WIDTH, label: t("options.custom") },
  ];
  const error = errors.customCm ? t(`errors.${errors.customCm}`) : undefined;
  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-semibold">{t("options.width")}</span>
      <SegmentedControl
        className="flex-wrap"
        label={t("options.widthGroup")}
        value={values.widthChoice}
        options={choices}
        onChange={(widthChoice) => onChange({ widthChoice })}
      />
      <p className="text-sm text-muted">{t("options.widthHint")}</p>
      {values.widthChoice === CUSTOM_WIDTH ? (
        <NumberField
          label={t("options.customLabel")}
          error={error}
          value={values.customCm}
          onChange={(customCm) => onChange({ customCm })}
        />
      ) : null}
    </div>
  );
}

/** Props of {@link NumberField}. */
interface NumberFieldProps {
  /** Visible label. */
  readonly label: string;
  /** Error text, if any. */
  readonly error: string | undefined;
  /** The typed value. */
  readonly value: string;
  /** Called with the new text. */
  readonly onChange: (value: string) => void;
}

/**
 * Renders a labelled number input that always reads left to right.
 *
 * @param props - Label, error, value and handler.
 * @returns The field.
 */
function NumberField({ label, error, value, onChange }: Readonly<NumberFieldProps>): ReactElement {
  return (
    <FormField label={label} error={error}>
      {(control) => (
        <Input
          {...control}
          inputMode="decimal"
          dir="ltr"
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
      )}
    </FormField>
  );
}

/**
 * Renders the folded/open choice and the nap switch.
 *
 * @param props - Values and the change handler.
 * @returns The layout group.
 */
function LayoutGroup({ values, onChange }: Readonly<Omit<FieldsProps, "errors">>): ReactElement {
  const t = useTranslations("fabric.calc");
  return (
    <>
      <div className="flex flex-col gap-2">
        <span className="text-sm font-semibold">{t("options.layout")}</span>
        <SegmentedControl
          label={t("options.layoutGroup")}
          value={values.layout}
          options={[
            { value: "folded", label: t("options.folded") },
            { value: "open", label: t("options.open") },
          ]}
          onChange={(layout) => onChange({ layout })}
        />
        <p className="text-sm text-muted">
          {values.layout === "folded" ? t("options.foldedHint") : t("options.openHint")}
        </p>
      </div>
      <div className="flex items-start justify-between gap-3">
        <div>
          <label htmlFor="fabric-nap" className="text-sm font-semibold">
            {t("options.nap")}
          </label>
          <p className="text-sm text-muted">{t("options.napHint")}</p>
        </div>
        <Switch id="fabric-nap" checked={values.nap} onCheckedChange={(nap) => onChange({ nap })} />
      </div>
    </>
  );
}

/**
 * Renders the form.
 *
 * @param props - Values, errors and handlers.
 * @returns The form.
 */
export function FabricOptionsForm({
  values,
  errors,
  busy,
  hasResult,
  onChange,
  onSubmit,
}: Readonly<FabricOptionsFormProps>): ReactElement {
  const t = useTranslations("fabric.calc");
  return (
    <form
      className="flex flex-col gap-5"
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <h3 className="text-xl font-semibold">{t("options.title")}</h3>
      <WidthGroup values={values} errors={errors} onChange={onChange} />
      <LayoutGroup values={values} onChange={onChange} />
      <div className="grid grid-cols-2 gap-3">
        <NumberField
          label={t("options.shrinkage")}
          error={errors.shrinkage ? t(`errors.${errors.shrinkage}`) : undefined}
          value={values.shrinkage}
          onChange={(shrinkage) => onChange({ shrinkage })}
        />
        <NumberField
          label={t("options.repeat")}
          error={errors.repeatCm ? t(`errors.${errors.repeatCm}`) : undefined}
          value={values.repeatCm}
          onChange={(repeatCm) => onChange({ repeatCm })}
        />
      </div>
      <Button type="submit" disabled={busy}>
        {hasResult ? t("options.recalculate") : t("options.calculate")}
      </Button>
    </form>
  );
}
