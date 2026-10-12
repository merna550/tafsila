/** The loaded clients as a grid of rows with a "show more" button, or the "no results" state of a search. */
import { Button, EmptyState } from "@tafsila/ui";
import { useTranslations } from "next-intl";
import type { ReactElement } from "react";
import type { ClientRowView } from "../model/client-view";
import { ClientRow } from "./ClientRow";

/** Props for {@link ClientsList}. */
interface ClientsListProps {
  /** Rows to show. */
  readonly rows: readonly ClientRowView[];
  /** The current search, used by the "no results" text. */
  readonly query: string;
  /** True when more pages exist. */
  readonly hasMore: boolean;
  /** True while the next page loads. */
  readonly isLoadingMore: boolean;
  /** Loads the next page. */
  readonly onLoadMore: () => void;
  /** Clears the search. */
  readonly onClearSearch: () => void;
}

/**
 * Renders the rows, or "no results" with a clear-search action when a search found nobody.
 *
 * @param props - Rows, search and paging controls.
 * @returns The list.
 */
export function ClientsList(props: Readonly<ClientsListProps>): ReactElement {
  const { rows, query, hasMore, isLoadingMore, onLoadMore, onClearSearch } = props;
  const t = useTranslations("clients");
  if (rows.length === 0) {
    return (
      <EmptyState
        title={t("noResults.title")}
        description={t("noResults.description", { q: query })}
        action={
          <Button variant="secondary" onClick={onClearSearch}>
            {t("search.clear")}
          </Button>
        }
      />
    );
  }
  return (
    <div className="flex flex-col items-center gap-6">
      <ul className="grid w-full gap-4 md:grid-cols-2">
        {rows.map((row) => (
          <ClientRow key={row.id} row={row} />
        ))}
      </ul>
      {hasMore ? (
        <Button variant="secondary" onClick={onLoadMore} disabled={isLoadingMore}>
          {isLoadingMore ? t("loadingMore") : t("loadMore")}
        </Button>
      ) : null}
    </div>
  );
}
