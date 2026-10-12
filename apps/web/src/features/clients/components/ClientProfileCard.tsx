/** Side card of the client profile: avatar, name, "client since", notes and the edit and delete buttons. */
import { Button } from "@tafsila/ui";
import { useTranslations } from "next-intl";
import type { ReactElement } from "react";
import type { ClientProfileView } from "../model/client-view";

/** Props for {@link ClientProfileCard}. */
interface ClientProfileCardProps {
  /** The client to show. */
  readonly client: ClientProfileView;
  /** Opens the edit dialog. */
  readonly onEdit: () => void;
  /** Opens the delete confirmation. */
  readonly onDelete: () => void;
}

/**
 * Renders the client's details with their actions.
 *
 * @param props - The view and the two handlers.
 * @returns The card.
 */
export function ClientProfileCard({
  client,
  onEdit,
  onDelete,
}: Readonly<ClientProfileCardProps>): ReactElement {
  const t = useTranslations("clients.profile");
  return (
    <aside className="flex flex-col gap-5 rounded-lg bg-surface p-6 shadow-card">
      <div className="flex items-center gap-4">
        <span
          aria-hidden="true"
          className="flex size-16 shrink-0 items-center justify-center rounded-full bg-primary-soft text-2xl font-semibold text-primary"
        >
          {client.initial}
        </span>
        <div className="min-w-0">
          <h1 className="break-words text-2xl font-semibold text-text">{client.name}</h1>
          <p className="text-sm text-muted">{t("since", { date: client.since })}</p>
        </div>
      </div>
      {client.notes ? (
        <div className="rounded-md bg-surface-hover p-3">
          <h2 className="text-sm font-semibold text-text">{t("notes")}</h2>
          <p className="whitespace-pre-line break-words text-base leading-7 text-text">{client.notes}</p>
        </div>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" className="flex-1" onClick={onEdit}>
          {t("edit")}
        </Button>
        <Button variant="secondary" className="flex-1 border-danger text-danger" onClick={onDelete}>
          {t("delete")}
        </Button>
      </div>
    </aside>
  );
}
