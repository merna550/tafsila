"use client";
/** Loads the client named in the URL and shows her chip; shows nothing while loading or when she cannot be read. */
import { useTranslations } from "next-intl";
import type { ReactElement } from "react";
import { useClient } from "@/features/clients";
import { ClientChip } from "./components/ClientChip";

/** Props for {@link ClientChipSlot}. */
interface ClientChipSlotProps {
  /** The client id from the URL. */
  readonly clientId: string;
  /** Called to forget the client; omit once the design exists. */
  readonly onRemove?: () => void;
}

/**
 * Renders "For: <name>" for the client.
 *
 * @param props - Client id and optional remove handler.
 * @returns The chip, or null.
 */
export function ClientChipSlot({ clientId, onRemove }: Readonly<ClientChipSlotProps>): ReactElement | null {
  const t = useTranslations("designPicker");
  const client = useClient(clientId);
  if (client.data === undefined) return null;
  return (
    <ClientChip
      label={t("forClient", { name: client.data.name })}
      removeLabel={t("removeClient")}
      {...(onRemove === undefined ? {} : { onRemove })}
    />
  );
}
