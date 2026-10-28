/** The two bounds (at least, at most) and the priority of a rule effect. */
import { RULE_PRIORITY } from "@tafsila/schemas";
import { Select } from "@tafsila/ui";
import { useTranslations } from "next-intl";
import type { ReactElement } from "react";
import { Controller, type UseFormReturn } from "react-hook-form";
import type { RuleFormValues } from "../model/rule-form";
import { LevelPicker } from "./LevelPicker";

/** The priorities offered, 1 to 5. */
const PRIORITIES = Object.values(RULE_PRIORITY);

/** Props of {@link RuleBoundFields}. */
interface RuleBoundFieldsProps {
  /** The form instance. */
  readonly form: UseFormReturn<RuleFormValues>;
  /** Error text of a field. */
  readonly errorOf: (name: keyof RuleFormValues) => string | undefined;
  /** Page direction. */
  readonly dir: "rtl" | "ltr";
}

/**
 * Renders the bound pickers and the priority select.
 *
 * @param props - The form, the error lookup and the direction.
 * @returns The fields.
 */
export function RuleBoundFields({ form, errorOf, dir }: Readonly<RuleBoundFieldsProps>): ReactElement {
  const t = useTranslations("admin.fabricRules.form");
  const { control } = form;
  return (
    <>
      {(["min", "max"] as const).map((bound) => (
        <Controller
          key={bound}
          control={control}
          name={bound}
          render={({ field }) => (
            <LevelPicker
              label={t(bound)}
              value={field.value}
              onChange={field.onChange}
              noneLabel={t("noLimit")}
              error={errorOf(bound)}
            />
          )}
        />
      ))}
      <Controller
        control={control}
        name="priority"
        render={({ field }) => (
          <Select
            dir={dir}
            aria-label={t("priority")}
            value={String(field.value)}
            onValueChange={(v) => field.onChange(Number(v))}
            options={PRIORITIES.map((p) => ({ value: String(p), label: t("priorityOption", { n: p }) }))}
          />
        )}
      />
      <Controller
        control={control}
        name="priority"
        render={({ field }) => (
          <Select
            dir={dir}
            aria-label={t("priority")}
            value={String(field.value)}
            onValueChange={(v) => field.onChange(Number(v))}
            options={PRIORITIES.map((p) => ({ value: String(p), label: t("priorityOption", { n: p }) }))}
          />
        )}
      />
    </>
  );
}
