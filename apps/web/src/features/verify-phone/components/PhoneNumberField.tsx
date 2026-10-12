/** The phone field: the fixed "+20" box and the number input, always left-to-right, even on right-to-left pages. */
import { FormField, Input } from "@tafsila/ui";
import { useTranslations } from "next-intl";
import type { InputHTMLAttributes, ReactElement } from "react";
import { COUNTRY_PREFIX, PHONE_EXAMPLE } from "../model/format";

/** Props of {@link PhoneNumberField}. */
interface PhoneNumberFieldProps {
  /** Error text under the field, already translated. */
  readonly error?: string;
  /** Attributes of the input: React Hook Form's registration, or `value` and `readOnly` for a shown number. */
  readonly inputProps: InputHTMLAttributes<HTMLInputElement>;
}

/**
 * Renders the labelled phone field.
 *
 * @param props - Error and input attributes.
 * @returns The field.
 */
export function PhoneNumberField({ error, inputProps }: Readonly<PhoneNumberFieldProps>): ReactElement {
  const t = useTranslations("phoneVerification");
  return (
    <FormField label={t("phone.label")} error={error}>
      {(control) => (
        <div dir="ltr" className="flex gap-2">
          <span className="flex min-h-12 items-center rounded-md border border-border bg-surface-hover px-3 text-lg">
            {COUNTRY_PREFIX}
          </span>
          <Input
            {...control}
            type="tel"
            inputMode="tel"
            autoComplete="tel-national"
            placeholder={PHONE_EXAMPLE}
            className="min-h-12 min-w-0 flex-1 text-lg"
            {...inputProps}
          />
        </div>
      )}
    </FormField>
  );
}
