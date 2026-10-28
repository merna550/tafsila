"use client";
/** The /admin/fabric-rules screen: the rules by priority with add, edit and delete, and the dialog with the preview. */
import type { AdminFabricRule } from "@tafsila/schemas";
import { Button, PageHeader } from "@tafsila/ui";
import { useLocale, useTranslations } from "next-intl";
import { useState, type ReactElement } from "react";
import { DataState } from "@/shared/data-state";
import { DIRECTION, type AppLocale } from "@/shared/i18n";
import { CatalogueTabs } from "./components/CatalogueTabs";
import { DeleteDialog } from "./components/DeleteDialog";
import { DraftNote } from "./components/DraftNote";
import { RulesTable } from "./components/RulesTable";
import { RuleEditor } from "./RuleEditor";
import { useAdminFabricRules, useAdminFabrics } from "./hooks/use-admin-fabrics";
import { useDeleteRule } from "./hooks/use-catalogue-mutations";
import { useDeleteAction } from "./hooks/use-delete-action";
import { sortByPriority } from "./model/rule-view";

/** What the dialog is doing: nothing, adding a rule or editing one. */
type Editing =
  | { readonly mode: "closed" }
  | { readonly mode: "new" }
  | { readonly mode: "edit"; readonly rule: AdminFabricRule };

/**
 * Loads the rules and the fabrics and shows the list, or the loading, empty and error states.
 *
 * @returns The screen.
 */
export function AdminFabricRulesScreen(): ReactElement {
  const t = useTranslations("admin.fabricRules");
  const locale = useLocale() as AppLocale;
  const rulesQuery = useAdminFabricRules();
  const fabricsQuery = useAdminFabrics();
  const [editing, setEditing] = useState<Editing>({ mode: "closed" });
  const [deleting, setDeleting] = useState<AdminFabricRule | undefined>();
  const remove = useDeleteAction(useDeleteRule(), t("delete.done"));
  const rules = sortByPriority(rulesQuery.data ?? []);
  const fabrics = fabricsQuery.data ?? [];
  /** Deletes the rule and closes the confirmation when it worked. */
  const confirm = async (): Promise<void> => {
    if (deleting && (await remove.confirm(deleting.id))) setDeleting(undefined);
  };
  return (
    <>
      <PageHeader
        title={t("title")}
        description={t("subtitle")}
        actions={<Button onClick={() => setEditing({ mode: "new" })}>{t("add")}</Button>}
      />
      <DraftNote />
      <CatalogueTabs active="rules" />
      <DataState
        isPending={rulesQuery.isPending || fabricsQuery.isPending}
        error={rulesQuery.error ?? fabricsQuery.error}
        isEmpty={rules.length === 0}
        emptyTitle={t("empty.title")}
        emptyDescription={t("empty.description")}
        onRetry={() => void Promise.all([rulesQuery.refetch(), fabricsQuery.refetch()])}
      >
        <RulesTable
          rules={rules}
          locale={locale}
          onEdit={(rule) => setEditing({ mode: "edit", rule })}
          onDelete={setDeleting}
        />
      </DataState>
      {editing.mode === "closed" ? null : (
        <RuleEditor
          key={editing.mode === "edit" ? editing.rule.id : "new"}
          rule={editing.mode === "edit" ? editing.rule : undefined}
          fabrics={fabrics}
          rules={rules}
          onClose={() => setEditing({ mode: "closed" })}
        />
      )}
      <DeleteDialog
        kind="rule"
        open={deleting !== undefined}
        onOpenChange={(open) => !open && setDeleting(undefined)}
        name={deleting?.id ?? ""}
        onConfirm={() => void confirm()}
        pending={remove.pending}
        dir={DIRECTION[locale]}
      />
    </>
  );
}
