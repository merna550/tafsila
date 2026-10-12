"use client";
/** Hook behind the delete confirmation: deletes the client, shows a toast and reports success; failures go to the shared handler. */
import { useToast } from "@tafsila/ui";
import { useTranslations } from "next-intl";
import { useApiErrorHandler } from "@/shared/error-display";
import { useDeleteClient } from "./use-client-mutations";

/** What the confirmation dialog needs. */
export interface DeleteClientAction {
  /** Deletes the client; resolves when done (never rejects). */
  readonly confirm: () => Promise<void>;
  /** True while the request runs. */
  readonly pending: boolean;
}

/**
 * Prepares the delete action for one client.
 *
 * @param id - Client id.
 * @param onDeleted - Runs after the client was deleted (for example, go back to the list).
 * @returns The confirm function and the pending flag.
 */
export function useDeleteClientAction(id: string, onDeleted: () => void): DeleteClientAction {
  const t = useTranslations("clients.delete");
  const { showToast } = useToast();
  const handleError = useApiErrorHandler();
  const mutation = useDeleteClient(id);
  /** Deletes, then toasts and reports; a failure only shows the shared error toast. */
  const confirm = async (): Promise<void> => {
    try {
      await mutation.mutateAsync();
    } catch (error) {
      handleError(error, "action");
      return;
    }
    showToast({ title: t("done"), tone: "success" });
    onDeleted();
  };
  return { confirm, pending: mutation.isPending };
}
