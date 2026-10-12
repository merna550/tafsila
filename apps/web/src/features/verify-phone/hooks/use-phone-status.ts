"use client";
/** Application hook: reads whether the signed-in account has a verified phone (GET /api/phone). */
import { phoneStatusResponseSchema, type PhoneStatusResponse } from "@tafsila/schemas";
import { useEffect, useState } from "react";
import { apiRequest } from "@/shared/api";

/** Loading state of the status. */
export type PhoneStatusState =
  | { readonly state: "loading" }
  | { readonly state: "error" }
  | { readonly state: "ready"; readonly status: PhoneStatusResponse };

/**
 * Loads the phone status once when the component mounts.
 *
 * @returns Loading, error (the screen then simply shows nothing extra) or the status.
 */
export function usePhoneStatus(): PhoneStatusState {
  const [result, setResult] = useState<PhoneStatusState>({ state: "loading" });
  useEffect(() => {
    const controller = new AbortController();
    apiRequest("/phone", { schema: phoneStatusResponseSchema, signal: controller.signal })
      .then((status) => setResult({ state: "ready", status }))
      .catch(() => {
        if (!controller.signal.aborted) setResult({ state: "error" });
      });
    return () => controller.abort();
  }, []);
  return result;
}
