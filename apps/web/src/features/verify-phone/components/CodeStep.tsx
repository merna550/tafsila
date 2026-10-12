/** Second step of the card: the "code sent" notice, the six code boxes, the resend countdown and the buttons. */
import { Button, CodeInput, FormField } from "@tafsila/ui";
import { useTranslations } from "next-intl";
import type { ReactElement } from "react";
import { CODE_LENGTH } from "../model/verify-phone.schema";
import { formatCountdown } from "../model/countdown";
import { displayPhone, isolateLtr } from "../model/format";

/** Props of {@link CodeStep}. */
interface CodeStepProps {
  /** The number the code was sent to, in E.164. */
  readonly phone: string;
  /** Digits typed so far. */
  readonly code: string;
  /** Changes the digits. */
  readonly onCodeChange: (code: string) => void;
  /** Error text under the boxes, already translated. */
  readonly error: string | null;
  /** Seconds until a new code may be requested. */
  readonly resendSeconds: number;
  /** True while a call runs. */
  readonly pending: boolean;
  /** Checks the code. */
  readonly onConfirm: () => void;
  /** Asks for a new code. */
  readonly onResend: () => void;
  /** Goes back to the number step. */
  readonly onChangeNumber: () => void;
}

/**
 * Renders the code step.
 *
 * @param props - Number, code, error, countdown, state and the four actions.
 * @returns The step.
 */
export function CodeStep(props: Readonly<CodeStepProps>): ReactElement {
  const { phone, code, onCodeChange, error, resendSeconds, pending, onConfirm, onResend, onChangeNumber } =
    props;
  const t = useTranslations("phoneVerification");
  return (
    <>
      <p role="status" className="flex items-start gap-2.5 rounded-md bg-primary-soft px-3.5 py-3 leading-6">
        {t("notice", { phone: isolateLtr(displayPhone(phone)) })}
      </p>
      <FormField label={t("code.label")} error={error ?? undefined}>
        {(control) => (
          <CodeInput
            {...control}
            value={code}
            onChange={onCodeChange}
            length={CODE_LENGTH}
            getBoxLabel={(index) => t("code.digit", { n: index + 1 })}
            disabled={pending}
          />
        )}
      </FormField>
      {resendSeconds > 0 ? (
        <p className="-mt-3 text-muted">{t("code.resendIn", { time: formatCountdown(resendSeconds) })}</p>
      ) : (
        <Button variant="ghost" onClick={onResend} disabled={pending} className="-mt-3 self-start">
          {t("code.resend")}
        </Button>
      )}
      <div className="flex flex-wrap gap-3">
        <Button
          onClick={onConfirm}
          disabled={pending || code.length < CODE_LENGTH}
          className="min-h-13 grow-2 basis-56 text-lg"
        >
          {t("code.confirm")}
        </Button>
        <Button
          variant="secondary"
          onClick={onChangeNumber}
          disabled={pending}
          className="min-h-13 grow basis-36"
        >
          {t("code.changeNumber")}
        </Button>
      </div>
    </>
  );
}
