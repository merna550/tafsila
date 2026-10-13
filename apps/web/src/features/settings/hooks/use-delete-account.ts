"use client";
/** Hook behind the delete-account dialog: calls DELETE /api/account, clears the local session, then opens the home page with a notice. */
import { DELETE_ACCOUNT_CONFIRMATION } from "@tafsila/schemas";
import { useMutation } from "@tanstack/react-query";
import { useLocale } from "next-intl";
import { useCallback } from "react";
import { z } from "zod";
import { apiRequest } from "@/shared/api";
import { clearLocalSession, useAuthClient } from "@/shared/auth";
import { useApiErrorHandler } from "@/shared/error-display";
import type { AppLocale } from "@/shared/i18n";
import { accountDeletedPath } from "../model/account-deleted";

/** What the dialog needs. */
export interface DeleteAccountAction {
  /** Deletes the account; resolves with true when it was deleted (failures show the shared toast and give false). */
  readonly confirm: () => Promise<boolean>;
  /** True while the request runs. */
  readonly pending: boolean;
}

/**
 * Prepares the account deletion. On success the browser leaves the app with a full page load so no cached data of the
 * deleted account stays in memory.
 *
 * @returns The confirm function and the pending flag.
 */
export function useDeleteAccount(): DeleteAccountAction {
  const client = useAuthClient();
  const locale = useLocale() as AppLocale;
  const handleError = useApiErrorHandler();
  const mutation = useMutation({
    mutationFn: () =>
      apiRequest("/account", {
        method: "DELETE",
        body: { confirm: DELETE_ACCOUNT_CONFIRMATION },
        schema: z.undefined(),
      }),
  });
  const confirm = useCallback(async (): Promise<boolean> => {
    try {
      await mutation.mutateAsync();
    } catch (error) {
      handleError(error, "action");
      return false;
    }
    await clearLocalSession(client);
    globalThis.location.assign(accountDeletedPath(locale));
    return true;
  }, [client, handleError, locale, mutation]);
  return { confirm, pending: mutation.isPending };
}
