"use client";
/** Application hook of the Google button: starts the OAuth redirect and counts the sign-up start. */
import { useCallback, useState } from "react";
import { signInWithGoogle, useAuthClient } from "@/shared/auth";
import { track } from "@/shared/analytics";
import { useApiErrorHandler } from "@/shared/error-display";

/** What the Google button needs. */
export interface UseGoogleSignIn {
  /** Starts the redirect to Google. */
  readonly start: () => Promise<void>;
  /** True from the click until the browser leaves the page. */
  readonly pending: boolean;
}

/**
 * Provides the Google sign-in action. Google returns to `/auth/callback`, which opens the session.
 *
 * @param next - Raw `next` value to hand through the round trip.
 * @returns The action and its state.
 */
export function useGoogleSignIn(next: string | null): UseGoogleSignIn {
  const client = useAuthClient();
  const handleError = useApiErrorHandler();
  const [pending, setPending] = useState(false);
  const start = useCallback(async () => {
    setPending(true);
    track("signup_started", { source: "sign_up_page", method: "google" });
    const callback = new URL("/auth/callback", window.location.origin);
    if (next) callback.searchParams.set("next", next);
    const result = await signInWithGoogle(client, callback.toString());
    if (!result.ok) {
      setPending(false);
      handleError(result.error, "action");
    }
  }, [client, handleError, next]);
  return { start, pending };
}
