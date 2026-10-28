/** The "when the design has" part of the rule dialog: a list of conditions with add and remove. */
import { Button } from "@tafsila/ui";
import { useTranslations } from "next-intl";
import type { ReactElement } from "react";
import { conditionFor, type ConditionDraft } from "../model/condition-builder";
import { ConditionRow } from "./ConditionRow";

/** Props of {@link RuleConditions}. */
interface RuleConditionsProps {
  /** The conditions. */
  readonly conditions: readonly ConditionDraft[];
  /** Replaces the conditions. */
  readonly onChange: (conditions: readonly ConditionDraft[]) => void;
  /** Page direction. */
  readonly dir: "rtl" | "ltr";
}

/** Path a newly added condition starts on. */
const NEW_CONDITION_PATH = "category";

/**
 * Renders the conditions.
 *
 * @param props - The conditions and the change handler.
 * @returns The fieldset.
 */
export function RuleConditions({ conditions, onChange, dir }: Readonly<RuleConditionsProps>): ReactElement {
  const t = useTranslations("admin.fabricRules.form");
  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="text-lg font-semibold text-text">{t("conditions")}</legend>
      {conditions.map((draft, index) => (
        <ConditionRow
          key={index}
          index={index}
          draft={draft}
          dir={dir}
          onChange={(next) => onChange(conditions.map((c, i) => (i === index ? next : c)))}
          onRemove={
            conditions.length > 1 ? () => onChange(conditions.filter((_, i) => i !== index)) : undefined
          }
        />
      ))}
      <Button variant="secondary" onClick={() => onChange([...conditions, conditionFor(NEW_CONDITION_PATH)])}>
        {t("addCondition")}
      </Button>
    </fieldset>
  );
}
