"use client";
/** The /admin/fabrics screen: the catalogue list with add, edit and delete. */
import type { AdminFabric } from "@tafsila/schemas";
import { PageHeader } from "@tafsila/ui";
import { useLocale, useTranslations } from "next-intl";
import { useState, type ReactElement } from "react";
import { DataState } from "@/shared/data-state";
import { DIRECTION, Link, type AppLocale } from "@/shared/i18n";
import { CatalogueTabs } from "./components/CatalogueTabs";
import { DeleteDialog } from "./components/DeleteDialog";
import { DraftNote } from "./components/DraftNote";
import { FabricsTable } from "./components/FabricsTable";
import { useAdminFabrics } from "./hooks/use-admin-fabrics";
import { useDeleteFabric } from "./hooks/use-catalogue-mutations";
import { useDeleteAction } from "./hooks/use-delete-action";

/**
 * Loads the fabrics and shows the list, or the loading, empty and error states.
 *
 * @returns The screen.
 */
export function AdminFabricsScreen(): ReactElement {
  const t = useTranslations("admin.fabrics");
  const locale = useLocale() as AppLocale;
  const query = useAdminFabrics();
  const [deleting, setDeleting] = useState<AdminFabric | undefined>();
  const remove = useDeleteAction(useDeleteFabric(), t("delete.done"));
  const fabrics = query.data ?? [];
  /** Deletes the fabric and closes the confirmation when it worked. */
  const confirm = async (): Promise<void> => {
    if (deleting && (await remove.confirm(deleting.id))) setDeleting(undefined);
  };
  return (
    <>
      <PageHeader
        title={t("title")}
        description={t("subtitle")}
        actions={
          <Link
            href="/admin/fabrics/new"
            className="flex min-h-11 items-center rounded-md bg-primary px-5 font-semibold text-on-primary"
          >
            {t("add")}
          </Link>
        }
      />
      <DraftNote />
      <CatalogueTabs active="fabrics" />
      <DataState
        isPending={query.isPending}
        error={query.error}
        isEmpty={fabrics.length === 0}
        emptyTitle={t("empty.title")}
        emptyDescription={t("empty.description")}
        onRetry={() => void query.refetch()}
      >
        <FabricsTable fabrics={fabrics} locale={locale} onDelete={setDeleting} />
      </DataState>
      <DeleteDialog
        kind="fabric"
        open={deleting !== undefined}
        onOpenChange={(open) => !open && setDeleting(undefined)}
        name={deleting?.nameEn ?? ""}
        onConfirm={() => void confirm()}
        pending={remove.pending}
        dir={DIRECTION[locale]}
      />
    </>
  );
}
