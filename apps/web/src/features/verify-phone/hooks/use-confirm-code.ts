"use client";
/** Application hook: checks the six digits, calls the verify endpoint and leaves the screen on success. */
import { useTranslations } from "next-intl";
import { useCallback } from "react";
import { useRouter } from "@/shared/i18n";
import { useToast } from "@tafsila/ui";
import type { VerifyStep } from "../model/phone-errors";
import { codeSchema, type PhoneValidationKey } from "../model/verify-phone.schema";
import { useVerifyCode } from "./use-verify-code";

/** What {@link useConfirmCode} needs from the screen. */
interface ConfirmCodeOptions {
  /** The number the code was sent to, in E.164. */
  readonly phone: string;
  /** The digits typed so far. */
  readonly code: string;
  /** Same-site path to open after verifying. */
  readonly next: string;
  /** Shows a failed call's error where it belongs. */
  readonly showError: (error: unknown, from: VerifyStep) => void;
  /** Sets the text under the code boxes. */
  readonly setCodeError: (text: string | null) => void;
}

/** The action and its pending flag. */
interface ConfirmCode {
  /** Validates and sends the code. */
  readonly confirm: () => Promise<void>;
  /** True while the call runs. */
  readonly pending: boolean;
}

/**
 * Provides the "confirm" action of the code step.
 *
 * @param options - Number, digits, destination and the error slots.
 * @returns `confirm` and `pending`.
 */
export function useConfirmCode(options: Readonly<ConfirmCodeOptions>): ConfirmCode {
  const { phone, code, next, showError, setCodeError } = options;
  const router = useRouter();
  const t = useTranslations("phoneVerification");
  const { showToast } = useToast();
  const verifyCode = useVerifyCode();
  const confirm = useCallback(async () => {
    setCodeError(null);
    const parsed = codeSchema.safeParse(code);
    if (!parsed.success) {
      setCodeError(t(`validation.${parsed.error.issues[0]?.message as PhoneValidationKey}`));
      return;
    }
    const result = await verifyCode.run({ phone, code });
    if (!result.ok) {
      showError(result.error, "code");
      return;
    }
    showToast({ title: t("verified"), tone: "success" });
    router.replace(next);
  }, [code, next, phone, router, setCodeError, showError, showToast, t, verifyCode]);
  return { confirm, pending: verifyCode.pending };
}
