"use client";
/** Hook behind the delete confirmation: deletes the design, shows a toast and reports success; failures go to the shared handler. */
import { useToast } from "@tafsila/ui";
import { useTranslations } from "next-intl";
import { useDeleteDesign } from "@/entities/design";
import { useApiErrorHandler } from "@/shared/error-display";

/** What the confirmation dialog needs. */
export interface DeleteDesignAction {
  /** Deletes the design; resolves when done (never rejects). */
  readonly confirm: (id: string) => Promise<void>;
  /** True while the request runs. */
  readonly pending: boolean;
}

/**
 * Prepares the delete action.
 *
 * @param onDeleted - Runs after a design was deleted (for example, close the dialog).
 * @returns The confirm function and the pending flag.
 */
export function useDeleteDesignAction(onDeleted: () => void): DeleteDesignAction {
  const t = useTranslations("designs.delete");
  const { showToast } = useToast();
  const handleError = useApiErrorHandler();
  const mutation = useDeleteDesign();
  /**
   * Deletes, then toasts and reports; a failure only shows the shared error toast.
   *
   * @param id - Design id.
   */
  const confirm = async (id: string): Promise<void> => {
    try {
      await mutation.mutateAsync(id);
    } catch (error) {
      handleError(error, "action");
      return;
    }
    showToast({ title: t("done"), tone: "success" });
    onDeleted();
  };
  return { confirm, pending: mutation.isPending };
}
