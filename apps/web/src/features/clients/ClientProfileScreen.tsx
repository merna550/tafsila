"use client";
/** The /clients/[id] screen: breadcrumb, client card with edit and delete, and her measurement sets. */
import { Breadcrumb } from "@tafsila/ui";
import { useLocale, useTranslations } from "next-intl";
import { notFound } from "next/navigation";
import { useMemo, useState, type ReactElement } from "react";
import { ApiError } from "@/shared/api";
import { DataState } from "@/shared/data-state";
import { DIRECTION, Link, useRouter, type AppLocale } from "@/shared/i18n";
import type { Client } from "@tafsila/schemas";
import { toDesignRow, useDesigns } from "@/entities/design";
import { ClientDesignsSection } from "./components/ClientDesignsSection";
import { ClientFormDialog } from "./components/ClientFormDialog";
import { ClientProfileCard } from "./components/ClientProfileCard";
import { DeleteClientDialog } from "./components/DeleteClientDialog";
import { MeasurementSetsSection } from "./components/MeasurementSetsSection";
import { useClient } from "./hooks/use-client";
import { useClientForm } from "./hooks/use-client-form";
import { useClientMeasurementSets } from "./hooks/use-client-measurement-sets";
import { useDeleteClientAction } from "./hooks/use-delete-client-action";
import { toClientProfileView, toMeasurementSetView } from "./model/client-view";
import { toKeyValues } from "./model/measurement-summary";

/** Props for {@link ClientProfileScreen}. */
interface ClientProfileScreenProps {
  /** Client id from the URL. */
  readonly id: string;
}

/** Props for the inner content, which exists once the client has loaded. */
interface ContentProps {
  /** The loaded client. */
  readonly client: Client;
}

/**
 * Shows the path "My clients / name".
 *
 * @param props - The client's name.
 * @param props.name - Name of the current client.
 * @returns The breadcrumb.
 */
function ClientBreadcrumb({ name }: Readonly<{ name: string }>): ReactElement {
  const t = useTranslations("clients.profile");
  const list = useTranslations("clients");
  const link = (
    <Link href="/clients" className="font-semibold text-primary underline">
      {list("title")}
    </Link>
  );
  return (
    <Breadcrumb
      label={t("breadcrumb")}
      items={[
        { key: "clients", content: link },
        { key: "client", content: name },
      ]}
    />
  );
}

/**
 * Loads and shows the client's measurement sets.
 *
 * @param props - Client id.
 * @param props.clientId - Client id.
 * @returns The sets section, or its loading or error state.
 */
function ClientSets({ clientId }: Readonly<{ clientId: string }>): ReactElement {
  const locale = useLocale() as AppLocale;
  const sets = useClientMeasurementSets(clientId);
  const views = useMemo(
    () => (sets.data?.items ?? []).map((set) => toMeasurementSetView(set, new Date(), locale)),
    [sets.data, locale],
  );
  const latest = sets.data?.items[0];
  return (
    <DataState
      isPending={sets.isPending}
      error={sets.error}
      isEmpty={false}
      onRetry={() => void sets.refetch()}
    >
      <MeasurementSetsSection
        clientId={clientId}
        sets={views}
        latestValues={latest ? toKeyValues(latest.measurements) : []}
      />
    </DataState>
  );
}

/** Latest designs shown on a profile. */
const PROFILE_DESIGNS_LIMIT = 5;

/**
 * Loads and shows the client's latest designs.
 *
 * @param props - Client id.
 * @param props.clientId - Client id.
 * @returns The designs section, or its loading or error state.
 */
function ClientDesigns({ clientId }: Readonly<{ clientId: string }>): ReactElement {
  const locale = useLocale() as AppLocale;
  const list = useDesigns({ clientId, limit: PROFILE_DESIGNS_LIMIT });
  const rows = useMemo(
    () => list.designs.map((design) => toDesignRow(design, new Date(), locale)),
    [list.designs, locale],
  );
  return (
    <DataState isPending={list.isPending} error={list.error} isEmpty={false} onRetry={list.refetch}>
      <ClientDesignsSection clientId={clientId} designs={rows} total={list.total} />
    </DataState>
  );
}

/**
 * Shows the loaded client with her sets and the edit and delete dialogs.
 *
 * @param props - The client.
 * @returns The content.
 */
function ClientProfileContent({ client }: Readonly<ContentProps>): ReactElement {
  const locale = useLocale() as AppLocale;
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { form, onSubmit, pending, reset } = useClientForm({ client, onSaved: () => setEditing(false) });
  const remove = useDeleteClientAction(client.id, () => router.push("/clients"));
  const view = toClientProfileView(client, locale);
  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-5">
      <ClientBreadcrumb name={client.name} />
      <div className="grid items-start gap-6 lg:grid-cols-3">
        <div className="min-w-0">
          <ClientProfileCard
            client={view}
            onEdit={() => {
              reset();
              setEditing(true);
            }}
            onDelete={() => setDeleting(true)}
          />
        </div>
        <div className="flex min-w-0 flex-col gap-6 lg:col-span-2">
          <ClientSets clientId={client.id} />
          <ClientDesigns clientId={client.id} />
        </div>
      </div>
      <ClientFormDialog
        open={editing}
        onOpenChange={setEditing}
        editing
        form={form}
        onSubmit={onSubmit}
        pending={pending}
        dir={DIRECTION[locale]}
      />
      <DeleteClientDialog
        open={deleting}
        onOpenChange={setDeleting}
        name={client.name}
        onConfirm={() => void remove.confirm()}
        pending={remove.pending}
        dir={DIRECTION[locale]}
      />
    </div>
  );
}

/**
 * Loads one client; another user's client (or a bad id) shows the standard not-found page.
 *
 * @param props - The client id.
 * @returns The screen.
 */
export function ClientProfileScreen({ id }: Readonly<ClientProfileScreenProps>): ReactElement {
  const client = useClient(id);
  const error = client.error;
  if (error instanceof ApiError && (error.kind === "not-found" || error.kind === "validation")) notFound();
  return (
    <DataState
      isPending={client.isPending}
      error={error}
      isEmpty={false}
      onRetry={() => void client.refetch()}
    >
      {client.data ? <ClientProfileContent client={client.data} /> : null}
    </DataState>
  );
}
