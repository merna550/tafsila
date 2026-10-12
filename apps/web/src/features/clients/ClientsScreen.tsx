"use client";
/** The /clients screen: heading with count, "new client", debounced name search, the list and the create dialog. */
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState, type ReactElement } from "react";
import { DataState } from "@/shared/data-state";
import { DIRECTION, useRouter, type AppLocale } from "@/shared/i18n";
import { ClientFormDialog } from "./components/ClientFormDialog";
import { ClientsHeading } from "./components/ClientsHeading";
import { NewClientButton } from "./components/NewClientButton";
import { ClientSearch } from "./components/ClientSearch";
import { ClientsList } from "./components/ClientsList";
import { useClientForm } from "./hooks/use-client-form";
import { useClients } from "./hooks/use-clients";
import { useDebouncedValue } from "./hooks/use-debounced-value";
import { toClientRow } from "./model/client-view";

/**
 * Loads the clients and composes the list screen.
 *
 * @returns The screen.
 */
export function ClientsScreen(): ReactElement {
  const t = useTranslations("clients");
  const locale = useLocale() as AppLocale;
  const router = useRouter();
  const [text, setText] = useState("");
  const q = useDebouncedValue(text.trim());
  const list = useClients(q);
  const [creating, setCreating] = useState(false);
  const { form, onSubmit, pending, reset } = useClientForm({
    onSaved: (client) => router.push(`/clients/${client.id}`),
  });
  const rows = useMemo(
    () => list.clients.map((client) => toClientRow(client, new Date(), locale)),
    [list.clients, locale],
  );
  /** Opens the create dialog with empty fields. */
  const openCreate = (): void => {
    reset();
    setCreating(true);
  };
  const isFirstVisit = !list.isPending && list.total === 0 && q === "" && text.trim() === "";
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <ClientsHeading
        total={list.isPending ? null : list.total}
        action={isFirstVisit ? undefined : <NewClientButton label={t("new")} onClick={openCreate} />}
      />
      {isFirstVisit ? null : <ClientSearch value={text} onChange={setText} />}
      <DataState
        isPending={list.isPending}
        error={list.error}
        isEmpty={isFirstVisit}
        onRetry={list.refetch}
        emptyTitle={t("empty.title")}
        emptyDescription={t("empty.description")}
        emptyAction={<NewClientButton label={t("empty.action")} onClick={openCreate} />}
      >
        <ClientsList
          rows={rows}
          query={q}
          hasMore={list.hasMore}
          isLoadingMore={list.isLoadingMore}
          onLoadMore={list.loadMore}
          onClearSearch={() => setText("")}
        />
      </DataState>
      <ClientFormDialog
        open={creating}
        onOpenChange={setCreating}
        editing={false}
        form={form}
        onSubmit={onSubmit}
        pending={pending}
        dir={DIRECTION[locale]}
      />
    </div>
  );
}
