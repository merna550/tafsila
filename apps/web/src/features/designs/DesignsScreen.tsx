"use client";
/** The /designs screen: heading with count, "new pattern", title search, client filter (in the URL), the cards and the delete confirmation. */
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState, type ReactElement } from "react";
import { NewPatternLink, toDesignRow, useDesigns, type DesignRow } from "@/entities/design";
import { useClients } from "@/features/clients";
import { DataState } from "@/shared/data-state";
import { DIRECTION, type AppLocale } from "@/shared/i18n";
import { DeleteDesignDialog } from "./components/DeleteDesignDialog";
import { DesignsFilters } from "./components/DesignsFilters";
import { DesignsHeading } from "./components/DesignsHeading";
import { DesignsList } from "./components/DesignsList";
import { useDeleteDesignAction } from "./hooks/use-delete-design-action";
import { useDesignsFilters } from "./hooks/use-designs-filters";

/** Most clients offered in the filter. */
const CLIENT_OPTIONS_LIMIT = 100;

/** Props for {@link DesignsScreen}. */
interface DesignsScreenProps {
  /** Client filter from `?clientId=`. */
  readonly clientId?: string;
}

/**
 * Loads the designs and composes the list screen.
 *
 * @param props - The client filter from the URL.
 * @returns The screen.
 */
export function DesignsScreen({ clientId }: Readonly<DesignsScreenProps>): ReactElement {
  const t = useTranslations("designs");
  const locale = useLocale() as AppLocale;
  const [deleting, setDeleting] = useState<DesignRow | null>(null);
  const filters = useDesignsFilters(clientId);
  const list = useDesigns({ q: filters.q, ...(clientId === undefined ? {} : { clientId }) });
  const clients = useClients("", CLIENT_OPTIONS_LIMIT);
  const remove = useDeleteDesignAction(() => setDeleting(null));
  const rows = useMemo(
    () => list.designs.map((design) => toDesignRow(design, new Date(), locale)),
    [list.designs, locale],
  );
  const isFirstVisit = !list.isPending && list.total === 0 && !filters.isFiltering;
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <DesignsHeading
        total={list.isPending ? null : list.total}
        action={isFirstVisit ? undefined : <NewPatternLink />}
      />
      {isFirstVisit ? null : (
        <DesignsFilters
          text={filters.text}
          onTextChange={filters.setText}
          clients={clients.clients}
          clientId={clientId}
          onClientChange={filters.changeClient}
          dir={DIRECTION[locale]}
        />
      )}
      <DataState
        isPending={list.isPending}
        error={list.error}
        isEmpty={isFirstVisit}
        onRetry={list.refetch}
        emptyTitle={t("empty.title")}
        emptyDescription={t("empty.description")}
        emptyAction={<NewPatternLink label={t("empty.action")} />}
      >
        <DesignsList
          rows={rows}
          hasMore={list.hasMore}
          isLoadingMore={list.isLoadingMore}
          onLoadMore={list.loadMore}
          onClearFilters={filters.clearFilters}
          onDelete={setDeleting}
        />
      </DataState>
      <DeleteDesignDialog
        open={deleting !== null}
        onOpenChange={(open) => (open ? undefined : setDeleting(null))}
        title={deleting?.title ?? ""}
        onConfirm={() => (deleting === null ? undefined : void remove.confirm(deleting.id))}
        pending={remove.pending}
        dir={DIRECTION[locale]}
      />
    </div>
  );
}
