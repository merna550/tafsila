"use client";
/** The /admin/users screen: stat tiles, search, verified filter, the table and the privacy note. */
import { PageHeader } from "@tafsila/ui";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState, type ReactElement } from "react";
import { DataState } from "@/shared/data-state";
import type { AppLocale } from "@/shared/i18n";
import { useDebouncedValue } from "@/shared/hooks/use-debounced-value";
import { AdminStatTiles } from "./components/AdminStatTiles";
import { AdminUsersTable } from "./components/AdminUsersTable";
import { AdminUsersToolbar } from "./components/AdminUsersToolbar";
import { useAdminStats } from "./hooks/use-admin-stats";
import { useAdminUsers } from "./hooks/use-admin-users";
import type { VerifiedFilter } from "./hooks/query-keys";
import { toAdminUserRow } from "./model/user-view";

/**
 * Loads the numbers and the users and composes the screen.
 *
 * @returns The screen.
 */
export function AdminUsersScreen(): ReactElement {
  const t = useTranslations("admin.users");
  const locale = useLocale() as AppLocale;
  const [text, setText] = useState("");
  const [filter, setFilter] = useState<VerifiedFilter>("all");
  const q = useDebouncedValue(text.trim());
  const stats = useAdminStats();
  const list = useAdminUsers(q, filter);
  const rows = useMemo(
    () => list.users.map((user) => toAdminUserRow(user, new Date(), locale)),
    [list.users, locale],
  );
  const filtered = q !== "" || filter !== "all";
  return (
    <>
      <PageHeader title={t("title")} />
      <AdminStatTiles stats={stats.data} />
      <AdminUsersToolbar text={text} onTextChange={setText} filter={filter} onFilterChange={setFilter} />
      <DataState isPending={list.isPending} error={list.error} isEmpty={false} onRetry={list.refetch}>
        <AdminUsersTable
          rows={rows}
          filtered={filtered}
          hasMore={list.hasMore}
          isLoadingMore={list.isLoadingMore}
          onLoadMore={list.loadMore}
          onClear={() => {
            setText("");
            setFilter("all");
          }}
        />
      </DataState>
      <p className="text-sm text-muted">{t("privacy")}</p>
    </>
  );
}
