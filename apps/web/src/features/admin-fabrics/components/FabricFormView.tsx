/** The fabric editor form: names, id (new fabrics only), the property pickers, care notes and the "reviewed" box. */
import { Button, FormField, Input } from "@tafsila/ui";
import { useTranslations } from "next-intl";
import type { ReactElement } from "react";
import { Controller, type UseFormReturn } from "react-hook-form";
import { Link } from "@/shared/i18n";
import { EDITABLE_PROPERTIES, FABRIC_ERROR_KEYS, type FabricFormValues } from "../model/fabric-form";
import { fieldMessage } from "../model/field-message";
import { BilingualFields } from "./BilingualFields";
import { LevelPicker } from "./LevelPicker";
import { ReviewedField } from "./ReviewedField";

/** Props of {@link FabricFormView}. */
interface FabricFormViewProps {
  /** The form instance. */
  readonly form: UseFormReturn<FabricFormValues>;
  /** Submit handler. */
  readonly onSubmit: (event?: React.BaseSyntheticEvent) => void;
  /** True while saving. */
  readonly pending: boolean;
  /** True when editing: the id is then fixed. */
  readonly editing: boolean;
}

/** Props of {@link PropertyPickers}. */
interface PropertyPickersProps {
  /** The form instance. */
  readonly form: UseFormReturn<FabricFormValues>;
  /** Error text of a property field. */
  readonly errorOf: (name: keyof FabricFormValues) => string | undefined;
}

/**
 * The four property pickers and the note about the fixed stretch.
 *
 * @param props - The form and the error lookup.
 * @returns The fieldset.
 */
function PropertyPickers({ form, errorOf }: Readonly<PropertyPickersProps>): ReactElement {
  const t = useTranslations("admin.fabrics.form");
  const labels = useTranslations("fabric.recommend.properties");
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="text-lg font-semibold text-text">{t("properties")}</legend>
      <div className="grid gap-4 sm:grid-cols-2">
        {EDITABLE_PROPERTIES.map((name) => (
          <Controller
            key={name}
            control={form.control}
            name={name}
            render={({ field }) => (
              <LevelPicker
                label={labels(name)}
                value={field.value}
                onChange={(level) => field.onChange(level ?? 0)}
                hint={t(`hints.${name}`)}
                error={errorOf(name)}
              />
            )}
          />
        ))}
      </div>
      <p className="text-sm text-muted">{t("stretchNote")}</p>
    </fieldset>
  );
}

/**
 * The save button and the cancel link.
 *
 * @param props - The pending flag.
 * @param props.pending - True while saving.
 * @returns The actions.
 */
function FormActions({ pending }: Readonly<{ pending: boolean }>): ReactElement {
  const t = useTranslations("admin.fabrics.form");
  return (
    <div className="flex gap-2">
      <Button type="submit" disabled={pending}>
        {t("save")}
      </Button>
      <Link
        href="/admin/fabrics"
        className="flex min-h-11 items-center rounded-md border border-border px-4 font-semibold text-text"
      >
        {t("cancel")}
      </Link>
    </div>
  );
}

/**
 * Renders the form.
 *
 * @param props - The form, its handler and whether it edits.
 * @returns The form element.
 */
export function FabricFormView({
  form,
  onSubmit,
  pending,
  editing,
}: Readonly<FabricFormViewProps>): ReactElement {
  const t = useTranslations("admin.fabrics.form");
  const errors = useTranslations("admin.fabrics.errors");
  const { register, control, formState } = form;
  /**
   * Finds the text to show under a field.
   *
   * @param name - The field.
   * @returns The translated error, or undefined.
   */
  const errorOf = (name: keyof FabricFormValues): string | undefined =>
    fieldMessage(formState.errors[name]?.message, FABRIC_ERROR_KEYS, (key) => errors(key as "idInvalid"));
  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="flex flex-col gap-5 rounded-lg bg-surface p-5 shadow-card"
    >
      <BilingualFields
        arLabel={t("nameAr")}
        enLabel={t("nameEn")}
        arRegister={register("nameAr")}
        enRegister={register("nameEn")}
        arError={errorOf("nameAr")}
        enError={errorOf("nameEn")}
      />
      <FormField label={t("id")} hint={editing ? t("idFixed") : t("idHint")} error={errorOf("id")}>
        {(c) => <Input dir="ltr" readOnly={editing} {...c} {...register("id")} />}
      </FormField>
      <PropertyPickers form={form} errorOf={errorOf} />
      <BilingualFields
        arLabel={t("careAr")}
        enLabel={t("careEn")}
        arRegister={register("careAr")}
        enRegister={register("careEn")}
        arError={errorOf("careAr")}
        enError={errorOf("careEn")}
      />
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Controller
          control={control}
          name="reviewed"
          render={({ field }) => (
            <ReviewedField checked={field.value} onChange={field.onChange} label={t("reviewed")} />
          )}
        />
        <FormActions pending={pending} />
      </div>
      <p className="text-sm text-muted">{t("auditNote")}</p>
    </form>
  );
}
