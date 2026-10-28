/** The "what the fabric needs" part of the rule dialog: strength, property, the two bounds and the priority. */
import { fabricPropertyNameSchema } from "@tafsila/schemas";
import { SegmentedControl, Select } from "@tafsila/ui";
import { useTranslations } from "next-intl";
import type { ReactElement } from "react";
import { Controller, type UseFormReturn } from "react-hook-form";
import type { RuleFormValues } from "../model/rule-form";
import { RuleBoundFields } from "./RuleBoundFields";

/** Props of {@link RuleEffectFields}. */
interface RuleEffectFieldsProps {
  /** The form instance. */
  readonly form: UseFormReturn<RuleFormValues>;
  /** Error text of a field. */
  readonly errorOf: (name: keyof RuleFormValues) => string | undefined;
  /** Page direction. */
  readonly dir: "rtl" | "ltr";
}

/**
 * Renders the fieldset.
 *
 * @param props - The form, the error lookup and the direction.
 * @returns The fieldset.
 */
export function RuleEffectFields({ form, errorOf, dir }: Readonly<RuleEffectFieldsProps>): ReactElement {
  const t = useTranslations("admin.fabricRules.form");
  const labels = useTranslations("fabric.recommend.properties");
  const { control } = form;
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="text-lg font-semibold text-text">{t("effect")}</legend>
      <Controller
        control={control}
        name="strength"
        render={({ field }) => (
          <SegmentedControl
            label={t("strength")}
            value={field.value}
            onChange={field.onChange}
            options={[
              { value: "must", label: t("must") },
              { value: "prefer", label: t("prefer") },
            ]}
          />
        )}
      />
      <Controller
        control={control}
        name="property"
        render={({ field }) => (
          <Select
            dir={dir}
            aria-label={t("property")}
            value={field.value}
            onValueChange={field.onChange}
            options={fabricPropertyNameSchema.options.map((p) => ({ value: p, label: labels(p) }))}
          />
        )}
      />
      <RuleBoundFields form={form} errorOf={errorOf} dir={dir} />
    </fieldset>
  );
}
