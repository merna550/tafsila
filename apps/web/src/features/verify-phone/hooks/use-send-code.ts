"use client";
/** Application hook: asks the API to send a verification code (POST /api/phone/code). */
import { sendPhoneCodeResponseSchema, type SendPhoneCodeResponse } from "@tafsila/schemas";
import { apiRequest } from "@/shared/api";
import { useApiAction, type ApiAction } from "./use-api-action";

/**
 * Sends a code to a phone number. The API checks the number, the limits and the trial history before any SMS.
 *
 * @returns `run(phone)` with the phone as typed or in E.164, and the pending flag.
 */
export function useSendCode(): ApiAction<string, SendPhoneCodeResponse> {
  return useApiAction((phone: string) =>
    apiRequest("/phone/code", { method: "POST", body: { phone }, schema: sendPhoneCodeResponseSchema }),
  );
}
