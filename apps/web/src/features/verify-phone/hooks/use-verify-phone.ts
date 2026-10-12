"use client";
/** Application hook of the verify-phone screen: the two steps, the form, the API calls, the countdown and the errors. */
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useCallback, useState } from "react";
import { useForm, type UseFormReturn } from "react-hook-form";
import { track } from "@/shared/analytics";
import {
  phoneFormSchema,
  type PhoneFormInput,
  type PhoneFormValues,
  type PhoneValidationKey,
} from "../model/verify-phone.schema";
import type { VerifyStep } from "../model/phone-errors";
import { useConfirmCode } from "./use-confirm-code";
import { usePhoneErrorPlacement } from "./use-phone-error-placement";
import { useResendCountdown } from "./use-resend-countdown";
import { useSendCode } from "./use-send-code";
import { useVerifiedRedirect } from "./use-verified-redirect";

/** What the screen reads and calls. */
export interface VerifyPhoneState {
  /** True until the status call decided whether the screen is needed (a verified account is sent on). */
  readonly checking: boolean;
  /** The open step. */
  readonly step: VerifyStep;
  /** Form of the number step. */
  readonly form: UseFormReturn<PhoneFormInput, unknown, PhoneFormValues>;
  /** The number the code was sent to, in E.164; empty before the first send. */
  readonly phone: string;
  /** The digits typed so far. */
  readonly code: string;
  /** Changes the digits. */
  readonly setCode: (code: string) => void;
  /** Error text under the number field. */
  readonly phoneError: string | null;
  /** Error text under the code boxes. */
  readonly codeError: string | null;
  /** True while a send or verify call runs. */
  readonly pending: boolean;
  /** Seconds until a new code may be requested. */
  readonly resendSeconds: number;
  /** Submit handler of the number step. */
  readonly submitPhone: (event?: React.BaseSyntheticEvent) => void;
  /** Sends a new code to the same number. */
  readonly resend: () => void;
  /** Checks the typed code. */
  readonly submitCode: () => void;
  /** Goes back to the number step. */
  readonly changeNumber: () => void;
  /** Records that the person left without verifying (no number, no code). */
  readonly skip: () => void;
}

/**
 * Drives the verify-phone screen.
 *
 * @param next - Same-site path to open after verifying (already sanitised by the page).
 * @returns The state and the actions for the components.
 */
export function useVerifyPhone(next: string): VerifyPhoneState {
  const t = useTranslations("phoneVerification");
  const checking = useVerifiedRedirect(next);
  const countdown = useResendCountdown();
  const errors = usePhoneErrorPlacement(next, countdown.start);
  const sendCode = useSendCode();
  const [step, setStep] = useState<VerifyStep>("phone");
  const [phone, setPhone] = useState("");
  const [code, setCodeState] = useState("");
  const form = useForm<PhoneFormInput, unknown, PhoneFormValues>({
    resolver: zodResolver(phoneFormSchema),
    defaultValues: { phone: "" },
    mode: "onSubmit",
  });
  const validationKey = form.formState.errors.phone?.message as PhoneValidationKey | undefined;
  const { show, clear, setCodeError } = errors;

  const send = useCallback(
    async (e164: string, from: VerifyStep): Promise<void> => {
      clear();
      const result = await sendCode.run(e164);
      if (!result.ok) {
        show(result.error, from);
        return;
      }
      setPhone(result.data.phone);
      setCodeState("");
      setStep("code");
      countdown.start(result.data.resendAfterSeconds);
    },
    [clear, countdown, sendCode, show],
  );
  const submitPhone = form.handleSubmit((values) => send(values.phone, "phone"));

  const confirm = useConfirmCode({ phone, code, next, showError: show, setCodeError });

  return {
    checking,
    step,
    form,
    phone,
    code,
    setCode: (value) => {
      setCodeState(value);
      setCodeError(null);
    },
    phoneError: errors.phoneError ?? (validationKey ? t(`validation.${validationKey}`) : null),
    codeError: errors.codeError,
    pending: sendCode.pending || confirm.pending,
    resendSeconds: countdown.seconds,
    submitPhone: (event) => void submitPhone(event),
    resend: () => void send(phone, "code"),
    submitCode: () => void confirm.confirm(),
    changeNumber: () => {
      setStep("phone");
      setCodeState("");
      clear();
    },
    skip: () => track("phone_verify_skipped", { step }),
  };
}
