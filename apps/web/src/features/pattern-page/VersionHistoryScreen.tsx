"use client";
/** The /designs/[id]/versions screen: every saved version newest first, with open, restore and the older-engine notice (issue #252). */
import { ENGINE_VERSION } from "@tafsila/engine/version";
import { Button } from "@tafsila/ui";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, type ReactElement } from "react";
import { useDesign } from "@/features/design-picker";
import { RestoreVersionDialog, toVersionRow, useVersions, VersionRow } from "@/features/pattern-versions";
import { DataState } from "@/shared/data-state";
import { DIRECTION, type AppLocale } from "@/shared/i18n";
import { VersionHistoryHeader } from "./components/VersionHistoryHeader";
import { useRestoreAction } from "./hooks/use-restore-action";

/** Props of {@link VersionHistoryScreen}. */
interface VersionHistoryScreenProps {
  /** Design id from the URL. */
  readonly designId: string;
}

/**
 * Loads the versions and composes the list and the restore confirmation.
 *
 * @param props - The design id.
 * @returns The screen.
 */
export function VersionHistoryScreen({ designId }: Readonly<VersionHistoryScreenProps>): ReactElement {
  const t = useTranslations("versionHistory");
  const locale = useLocale() as AppLocale;
  const design = useDesign(designId);
  const list = useVersions(designId);
  const restore = useRestoreAction(designId);
  const rows = useMemo(
    () => list.versions.map((v) => toVersionRow(v, ENGINE_VERSION, new Date(), locale)),
    [list.versions, locale],
  );
  const title = design.data?.design.title ?? t("fallbackTitle");
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-4">
      <VersionHistoryHeader
        title={title}
        total={list.isPending ? null : list.total}
        patternHref={`/designs/${designId}/pattern`}
      />
      <DataState
        isPending={list.isPending}
        error={list.error}
        isEmpty={list.total === 0}
        onRetry={list.refetch}
        emptyTitle={t("empty.title")}
        emptyDescription={t("empty.description")}
      >
        <ul className="flex flex-col gap-3">
          {rows.map((row) => (
            <VersionRow
              key={row.id}
              row={row}
              openHref={`/designs/${designId}/versions/${row.id}`}
              onRestore={(r) => restore.ask({ id: r.id, versionNo: r.versionNo })}
            />
          ))}
        </ul>
        {list.hasMore ? (
          <Button variant="secondary" onClick={list.loadMore} disabled={list.isLoadingMore}>
            {list.isLoadingMore ? t("loadingMore") : t("loadMore")}
          </Button>
        ) : null}
      </DataState>
      <RestoreVersionDialog
        versionNo={restore.asking?.versionNo ?? null}
        onClose={restore.cancel}
        onConfirm={restore.confirm}
        pending={restore.pending}
        dirty={restore.dirty}
        dir={DIRECTION[locale]}
      />
    </div>
  );
}
