"use client";
/** Application hook: signs out through shared/auth, then sends the user to the home page. */
import { useCallback, useState } from "react";
import { useRouter } from "@/shared/i18n";
import { signOut, useAuthClient } from "@/shared/auth";
import { useApiErrorHandler } from "@/shared/error-display";

/** What the sign-out button needs. */
export interface UseSignOut {
  /** Starts the sign-out. */
  readonly signOut: () => Promise<void>;
  /** True while the request runs. */
  readonly pending: boolean;
}

/**
 * Provides the sign-out action with its pending state; failures go to the shared error handler.
 *
 * @returns The action and its state.
 */
export function useSignOut(): UseSignOut {
  const client = useAuthClient();
  const router = useRouter();
  const handleError = useApiErrorHandler();
  const [pending, setPending] = useState(false);
  const run = useCallback(async () => {
    setPending(true);
    const result = await signOut(client);
    setPending(false);
    if (!result.ok) {
      handleError(result.error, "action");
      return;
    }
    router.replace("/");
    router.refresh();
  }, [client, handleError, router]);
  return { signOut: run, pending };
}
