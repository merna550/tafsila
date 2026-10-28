/** The rule list ordered by priority: the conditions, the effect, the shown reason and the edit and delete actions. */
import type { AdminFabricRule } from "@tafsila/schemas";
import { Badge, Button, Table, type TableColumn } from "@tafsila/ui";
import { useTranslations } from "next-intl";
import type { ReactElement } from "react";
import { pickLocalized, type TextLocale } from "@/features/fabric";
import { pathLabelKey, valueLabelKey } from "../model/condition-builder";
import { effectBounds } from "../model/rule-view";

/** Props of {@link RulesTable}. */
interface RulesTableProps {
  /** The rules, already ordered. */
  readonly rules: readonly AdminFabricRule[];
  /** Interface language. */
  readonly locale: TextLocale;
  /** Asks to edit a rule. */
  readonly onEdit: (rule: AdminFabricRule) => void;
  /** Asks to delete a rule. */
  readonly onDelete: (rule: AdminFabricRule) => void;
}

/** Props of {@link ConditionList}. */
interface ConditionListProps {
  /** The rule's conditions. */
  readonly conditions: AdminFabricRule["when"];
}

/**
 * Describes each condition in words, for example "Skirt type is one of half circle، full circle".
 *
 * @param props - The conditions.
 * @returns The list.
 */
function ConditionList({ conditions }: Readonly<ConditionListProps>): ReactElement {
  const t = useTranslations("admin.fabricRules.form");
  const picker = useTranslations("designPicker");
  return (
    <ul className="flex flex-col gap-1">
      {conditions.map((c) => {
        const path = picker(`paths.${pathLabelKey(c.path)}` as "paths.category");
        const values = (c.values ?? []).map((v) => picker(valueLabelKey(c.path, v) as "category.dress"));
        return (
          <li key={`${c.path}-${c.op}`}>
            {path} {t(`ops.${c.op}`)} {values.join("، ")}
          </li>
        );
      })}
    </ul>
  );
}

/**
 * Renders the table.
 *
 * @param props - Rules, language and handlers.
 * @returns The table.
 */
export function RulesTable({ rules, locale, onEdit, onDelete }: Readonly<RulesTableProps>): ReactElement {
  const t = useTranslations("admin.fabricRules");
  const props = useTranslations("fabric.recommend.properties");
  const columns: TableColumn<AdminFabricRule>[] = [
    { id: "when", header: t("columns.when"), cell: (r) => <ConditionList conditions={r.when} /> },
    {
      id: "strength",
      header: t("columns.strength"),
      cell: (r) => (
        <Badge tone={r.effect.strength === "must" ? "success" : "info"}>
          {t(`strength.${r.effect.strength}`)}
        </Badge>
      ),
    },
    {
      id: "effect",
      header: t("columns.effect"),
      cell: (r) => (
        <ul className="flex flex-col gap-1">
          {effectBounds(r.effect).map((b) => (
            <li key={b.kind}>
              {t(`bound.${b.kind}`, { property: props(r.effect.property), level: b.shown })}
            </li>
          ))}
        </ul>
      ),
    },
    { id: "priority", header: t("columns.priority"), numeric: true, cell: (r) => r.priority },
    { id: "reason", header: t("columns.reason"), cell: (r) => pickLocalized(r.reason, locale) },
    {
      id: "actions",
      header: <span className="sr-only">{t("columns.actions")}</span>,
      cell: (r) => (
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="ghost" onClick={() => onEdit(r)} aria-label={t("editNamed", { id: r.id })}>
            {t("editAction")}
          </Button>
          <Button variant="ghost" onClick={() => onDelete(r)} aria-label={t("deleteNamed", { id: r.id })}>
            {t("deleteAction")}
          </Button>
        </div>
      ),
    },
  ];
  return <Table caption={t("caption")} columns={columns} rows={rules} getRowKey={(r) => r.id} />;
}
