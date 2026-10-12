"use client";
/** Application hook: puts a failed call's error where the screen shows it (ADR-030), using the PHONE_* code. */
import { useTranslations } from "next-intl";
import { useCallback, useState } from "react";
import { ApiError } from "@/shared/api";
import { useApiErrorHandler } from "@/shared/error-display";
import { useRouter } from "@/shared/i18n";
import { isPhoneErrorCode, ruleFor, type VerifyStep } from "../model/phone-errors";

/** Codes whose `retryAfterSeconds` restarts the resend countdown. */
const RETRY_CODES = new Set(["PHONE_RESEND_TOO_SOON", "PHONE_TOO_MANY_ATTEMPTS"]);

/** What the flow reads and calls. */
export interface PhoneErrorPlacement {
  /** Text from a PHONE_* error shown under the number field. */
  readonly phoneError: string | null;
  /** Text shown under the code boxes. */
  readonly codeError: string | null;
  /** Shows an error where it belongs; unknown errors go through the shared handler (toast, banner, redirect). */
  readonly show: (error: unknown, from: VerifyStep) => void;
  /** Removes both texts. */
  readonly clear: () => void;
  /** Sets the text under the code boxes (for the client-side "six digits" check). */
  readonly setCodeError: (text: string | null) => void;
}

/**
 * Provides the two error slots of the screen.
 *
 * @param next - Where to go when the phone turns out to be verified already.
 * @param startCountdown - Restarts the resend countdown with the server's `retryAfterSeconds`.
 * @returns The texts and the actions.
 */
export function usePhoneErrorPlacement(
  next: string,
  startCountdown: (seconds: number) => void,
): PhoneErrorPlacement {
  const t = useTranslations("phoneVerification.errors");
  const router = useRouter();
  const handleError = useApiErrorHandler();
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [codeError, setCodeError] = useState<string | null>(null);
  const clear = useCallback(() => {
    setPhoneError(null);
    setCodeError(null);
  }, []);
  const show = useCallback(
    (error: unknown, from: VerifyStep): void => {
      if (!(error instanceof ApiError) || !isPhoneErrorCode(error.code)) {
        handleError(error, "action");
        return;
      }
      const rule = ruleFor(error.code, from);
      if (rule.target === "done") router.replace(next);
      else if (rule.target === "phone") setPhoneError(t(rule.messageKey));
      else setCodeError(t(rule.messageKey));
      if (error.retryAfterSeconds && RETRY_CODES.has(error.code)) startCountdown(error.retryAfterSeconds);
    },
    [handleError, next, router, startCountdown, t],
  );
  return { phoneError, codeError, show, clear, setCodeError };
}
