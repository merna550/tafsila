/** Small pieces shared by the four auth forms: translated fields, the form-level error and the submit button. */
import { Button, FormField, Input } from "@tafsila/ui";
import { useTranslations } from "next-intl";
import type { ReactElement } from "react";
import type { FieldError, UseFormRegisterReturn } from "react-hook-form";
import type { ValidationKey } from "../model/auth.schema";

/** Props shared by the text fields. */
interface FieldProps {
  /** Result of `form.register(name)`. */
  readonly registration: UseFormRegisterReturn;
  /** Validation error of the field; its message is a key of `auth.validation`. */
  readonly error?: FieldError;
}

/**
 * Email field: aligned to the start of the page direction, as in the design.
 *
 * @param props - Registration and error.
 * @returns The labelled input.
 */
export function EmailField({ registration, error }: Readonly<FieldProps>): ReactElement {
  const t = useTranslations("auth");
  const tv = useTranslations("auth.validation");
  const key = error?.message as ValidationKey | undefined;
  return (
    <FormField label={t("fields.email")} error={key ? tv(key) : undefined}>
      {(control) => (
        <Input
          {...control}
          {...registration}
          type="email"
          inputMode="email"
          autoComplete="email"
          className="text-start"
        />
      )}
    </FormField>
  );
}

/** Props of {@link PasswordField}. */
interface PasswordFieldProps extends FieldProps {
  /** Which label to show. */
  readonly kind: "password" | "confirmPassword" | "newPassword";
  /** Browser autofill hint. */
  readonly autoComplete: "current-password" | "new-password";
  /** Show the "at least 8 characters" hint. */
  readonly showHint?: boolean;
}

/**
 * Password field with an optional hint.
 *
 * @param props - Registration, error, kind and autofill hint.
 * @returns The labelled input.
 */
export function PasswordField({
  registration,
  error,
  kind,
  autoComplete,
  showHint = false,
}: Readonly<PasswordFieldProps>): ReactElement {
  const t = useTranslations("auth");
  const tv = useTranslations("auth.validation");
  const key = error?.message as ValidationKey | undefined;
  return (
    <FormField
      label={t(`fields.${kind}`)}
      hint={showHint ? t("fields.passwordHint") : undefined}
      error={key ? tv(key) : undefined}
    >
      {(control) => <Input {...control} {...registration} type="password" autoComplete={autoComplete} />}
    </FormField>
  );
}

/**
 * Error under the form for auth failures such as a wrong password; announced to screen readers.
 *
 * @param props - The message, or null for nothing.
 * @param props.message - Text already in the page language.
 * @returns The alert, or null.
 */
export function FormError({ message }: Readonly<{ message: string | null }>): ReactElement | null {
  if (!message) return null;
  return (
    <p role="alert" className="rounded-md bg-accent-soft p-3 text-sm font-semibold text-danger">
      {message}
    </p>
  );
}

/**
 * The full-width submit button; disabled while the request runs.
 *
 * @param props - Label and pending state.
 * @param props.label - Button text.
 * @param props.pending - True while the request runs.
 * @returns The button.
 */
export function SubmitButton({
  label,
  pending,
}: Readonly<{ label: string; pending: boolean }>): ReactElement {
  return (
    <Button type="submit" disabled={pending} className="min-h-12 w-full text-lg">
      {label}
    </Button>
  );
}
