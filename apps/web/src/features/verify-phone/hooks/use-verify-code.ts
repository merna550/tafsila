"use client";
/** Application hook: checks the code the person typed (POST /api/phone/verify). */
import { verifyPhoneResponseSchema, type VerifyPhoneResponse } from "@tafsila/schemas";
import { apiRequest } from "@/shared/api";
import { useApiAction, type ApiAction } from "./use-api-action";

/** The number and the six digits to check. */
export interface VerifyCodeInput {
  /** The number the code was sent to. */
  readonly phone: string;
  /** The six digits. */
  readonly code: string;
}

/**
 * Verifies a code; on success the API marks the phone verified and reports the trial eligibility.
 *
 * @returns `run({ phone, code })` and the pending flag.
 */
export function useVerifyCode(): ApiAction<VerifyCodeInput, VerifyPhoneResponse> {
  return useApiAction((body: VerifyCodeInput) =>
    apiRequest("/phone/verify", { method: "POST", body, schema: verifyPhoneResponseSchema }),
  );
}
