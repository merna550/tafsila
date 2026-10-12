"use client";
/** The verify-phone card (FR-AUTH-02): number step, then code step, on one card as in the design. */
import { Button, Skeleton } from "@tafsila/ui";
import { useTranslations } from "next-intl";
import type { ReactElement } from "react";
import { CodeStep } from "./components/CodeStep";
import { PhoneNumberField } from "./components/PhoneNumberField";
import { StepHeader } from "./components/StepHeader";
import { useVerifyPhone, type VerifyPhoneState } from "./hooks/use-verify-phone";
import { displayPhone } from "./model/format";

/** Props of {@link VerifyPhone}. */
interface VerifyPhoneProps {
  /** Same-site path opened after verifying or skipping (already sanitised by the page). */
  readonly next: string;
}

/**
 * Renders the whole screen: header, title and the open step. The screen is skippable through "back".
 *
 * @param props - Where to go afterwards.
 * @returns The screen.
 */
export function VerifyPhone({ next }: Readonly<VerifyPhoneProps>): ReactElement {
  const t = useTranslations("phoneVerification");
  const state = useVerifyPhone(next);
  return (
    <div className="mx-auto flex w-full max-w-xl flex-col gap-5 px-4 py-6">
      <StepHeader backHref={next} onBack={state.skip} />
      <section className="flex flex-col gap-5.5 rounded-xl bg-surface px-6 py-8 shadow-card">
        <div className="flex flex-col gap-2">
          <h1 className="text-2xl font-semibold leading-9">{t("title")}</h1>
          <p className="text-lg leading-7 text-muted">{t("intro")}</p>
        </div>
        {state.checking ? <Skeleton variant="block" /> : <Steps state={state} />}
      </section>
    </div>
  );
}

/**
 * Renders the open step of the card.
 *
 * @param props - The screen state.
 * @param props.state - State and actions from `useVerifyPhone`.
 * @returns The number step or the code step.
 */
function Steps({ state }: Readonly<{ state: VerifyPhoneState }>): ReactElement {
  const t = useTranslations("phoneVerification");
  if (state.step === "code") {
    return (
      <div className="flex flex-col gap-5.5">
        <PhoneNumberField inputProps={{ value: displayPhone(state.phone), readOnly: true }} />
        <CodeStep
          phone={state.phone}
          code={state.code}
          onCodeChange={state.setCode}
          error={state.codeError}
          resendSeconds={state.resendSeconds}
          pending={state.pending}
          onConfirm={state.submitCode}
          onResend={state.resend}
          onChangeNumber={state.changeNumber}
        />
      </div>
    );
  }
  return (
    <form onSubmit={state.submitPhone} noValidate className="flex flex-col gap-5.5">
      <PhoneNumberField error={state.phoneError ?? undefined} inputProps={state.form.register("phone")} />
      <Button type="submit" disabled={state.pending || state.resendSeconds > 0} className="min-h-13 text-lg">
        {t("phone.sendCode")}
      </Button>
    </form>
  );
}
