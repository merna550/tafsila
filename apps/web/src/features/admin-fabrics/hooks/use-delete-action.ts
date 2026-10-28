"use client";
/** Hook behind a delete confirmation (fabric or rule): runs the delete, toasts on success and sends failures to the shared handler. */
import { useToast } from "@tafsila/ui";
import type { UseMutationResult } from "@tanstack/react-query";
import { useApiErrorHandler } from "@/shared/error-display";

/** What a confirmation dialog needs. */
export interface DeleteAction {
  /** Deletes the item; resolves true when it was deleted (never rejects). */
  readonly confirm: (id: string) => Promise<boolean>;
  /** True while the request runs. */
  readonly pending: boolean;
}

/**
 * Prepares the delete action for a mutation that takes the item id.
 *
 * @param mutation - The delete mutation.
 * @param doneMessage - Toast text after a successful delete (already translated).
 * @returns The confirm function and the pending flag.
 */
export function useDeleteAction(
  mutation: UseMutationResult<undefined, Error, string>,
  doneMessage: string,
): DeleteAction {
  const { showToast } = useToast();
  const handleError = useApiErrorHandler();
  /**
   * Deletes, then toasts; a failure only shows the shared error toast.
   *
   * @param id - The item id.
   * @returns True when it was deleted.
   */
  const confirm = async (id: string): Promise<boolean> => {
    try {
      await mutation.mutateAsync(id);
    } catch (error) {
      handleError(error, "action");
      return false;
    }
    showToast({ title: doneMessage, tone: "success" });
    return true;
  };
  return { confirm, pending: mutation.isPending };
}
