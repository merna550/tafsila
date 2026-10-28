/** One rule condition: a path picked from the DesignSpec paths, an operator and values picked from that path's allowed list. */
import { Button, Checkbox, Select } from "@tafsila/ui";
import { useTranslations } from "next-intl";
import type { ReactElement } from "react";
import {
  PATH_OPTIONS,
  changePath,
  opsFor,
  pathLabelKey,
  toggleValue,
  valueLabelKey,
  valuesFor,
  type ConditionDraft,
} from "../model/condition-builder";

/** Props of {@link ConditionRow}. */
interface ConditionRowProps {
  /** Position of the condition, for the labels. */
  readonly index: number;
  /** The condition. */
  readonly draft: ConditionDraft;
  /** Called with the changed condition. */
  readonly onChange: (draft: ConditionDraft) => void;
  /** Removes the condition; undefined when it is the only one. */
  readonly onRemove?: () => void;
  /** Page direction. */
  readonly dir: "rtl" | "ltr";
}

/**
 * Renders the row.
 *
 * @param props - The condition and its handlers.
 * @returns The row.
 */
export function ConditionRow({
  index,
  draft,
  onChange,
  onRemove,
  dir,
}: Readonly<ConditionRowProps>): ReactElement {
  const t = useTranslations("admin.fabricRules.form");
  const picker = useTranslations("designPicker");
  const number = index + 1;
  const pathOptions = PATH_OPTIONS.map((path) => ({
    value: path,
    label: picker(`paths.${pathLabelKey(path)}` as "paths.category"),
  }));
  const opOptions = opsFor(draft.path).map((op) => ({ value: op, label: t(`ops.${op}`) }));
  return (
    <fieldset className="flex flex-col gap-3 rounded-md border border-line p-3">
      <legend className="px-1 text-sm font-semibold text-muted">{t("conditionN", { n: number })}</legend>
      <div className="flex flex-wrap gap-3">
        <Select
          dir={dir}
          className="flex-1 basis-48"
          aria-label={t("path", { n: number })}
          options={pathOptions}
          value={draft.path}
          onValueChange={(path) => onChange(changePath(draft, path))}
        />
        <Select
          dir={dir}
          className="flex-1 basis-40"
          aria-label={t("op", { n: number })}
          options={opOptions}
          value={draft.op}
          onValueChange={(op) => onChange({ ...draft, op: op as ConditionDraft["op"] })}
        />
        {onRemove ? (
          <Button variant="ghost" onClick={onRemove} aria-label={t("removeCondition", { n: number })}>
            {t("remove")}
          </Button>
        ) : null}
      </div>
      <div className="flex flex-wrap gap-x-4">
        {valuesFor(draft.path).map((value) => (
          <label key={value} className="flex min-h-11 items-center gap-2 text-base text-text">
            <Checkbox
              checked={draft.values.includes(value)}
              onCheckedChange={() => onChange(toggleValue(draft, value))}
            />
            {picker(valueLabelKey(draft.path, value) as "category.dress")}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
