/** The loaded designs as a grid of cards with a "show more" button, or the "no results" state of a search or filter. */
import { Button, EmptyState } from "@tafsila/ui";
import { useTranslations } from "next-intl";
import type { ReactElement } from "react";
import type { DesignRow as DesignRowView } from "@/entities/design";
import { DesignRow } from "./DesignRow";

/** Props for {@link DesignsList}. */
interface DesignsListProps {
  /** Rows to show. */
  readonly rows: readonly DesignRowView[];
  /** True when more pages exist. */
  readonly hasMore: boolean;
  /** True while the next page loads. */
  readonly isLoadingMore: boolean;
  /** Loads the next page. */
  readonly onLoadMore: () => void;
  /** Clears the search and the client filter. */
  readonly onClearFilters: () => void;
  /** Asks to delete a design. */
  readonly onDelete: (row: DesignRowView) => void;
}

/**
 * Renders the cards, or "no results" with a clear action when the filters found nothing.
 *
 * @param props - Rows, paging controls and handlers.
 * @returns The list.
 */
export function DesignsList(props: Readonly<DesignsListProps>): ReactElement {
  const { rows, hasMore, isLoadingMore, onLoadMore, onClearFilters, onDelete } = props;
  const t = useTranslations("designs");
  if (rows.length === 0) {
    return (
      <EmptyState
        title={t("noResults.title")}
        description={t("noResults.description")}
        action={
          <Button variant="secondary" onClick={onClearFilters}>
            {t("noResults.clear")}
          </Button>
        }
      />
    );
  }
  return (
    <div className="flex flex-col items-center gap-6">
      <ul className="grid w-full gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map((row) => (
          <DesignRow key={row.id} row={row} onDelete={onDelete} />
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
