/** The users table: name with a LTR e-mail, phone with badge, sign-up date, client count and last sign-in. */
import { Button, EmptyState, Table } from "@tafsila/ui";
import { useTranslations } from "next-intl";
import type { ReactElement } from "react";
import type { AdminUserRowView } from "../model/user-view";
import { useAdminUserColumns } from "./use-admin-user-columns";

/** Props for {@link AdminUsersTable}. */
interface AdminUsersTableProps {
  /** Rows to show. */
  readonly rows: readonly AdminUserRowView[];
  /** True when a search or filter is active, for the "no results" text. */
  readonly filtered: boolean;
  /** True when more pages exist. */
  readonly hasMore: boolean;
  /** True while the next page loads. */
  readonly isLoadingMore: boolean;
  /** Loads the next page. */
  readonly onLoadMore: () => void;
  /** Clears the search and the filter. */
  readonly onClear: () => void;
}

/**
 * Renders the table with "show more", or the "no results" state.
 *
 * @param props - Rows and paging controls.
 * @returns The table.
 */
export function AdminUsersTable(props: Readonly<AdminUsersTableProps>): ReactElement {
  const { rows, filtered, hasMore, isLoadingMore, onLoadMore, onClear } = props;
  const t = useTranslations("admin.users");
  const columns = useAdminUserColumns();
  if (rows.length === 0) {
    return (
      <EmptyState
        title={t("noResults.title")}
        description={t("noResults.description")}
        action={
          filtered ? (
            <Button variant="secondary" onClick={onClear}>
              {t("noResults.clear")}
            </Button>
          ) : undefined
        }
      />
    );
  }
  return (
    <div className="flex flex-col items-center gap-6">
      <Table
        className="w-full"
        caption={t("title")}
        columns={columns}
        rows={rows}
        getRowKey={(row) => row.id}
      />
      {hasMore ? (
        <Button variant="secondary" onClick={onLoadMore} disabled={isLoadingMore}>
          {isLoadingMore ? t("loadingMore") : t("loadMore")}
        </Button>
      ) : null}
    </div>
  );
}
