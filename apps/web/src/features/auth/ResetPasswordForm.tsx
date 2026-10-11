"use client";
/** Reset-password form: the new password twice, for the recovery session opened by the email link. */
import { useTranslations } from "next-intl";
import type { ReactElement } from "react";
import { useResetPassword } from "./hooks/use-reset-password";
import { FormError, PasswordField, SubmitButton } from "./components/fields";

/**
 * Renders the reset-password form.
 *
 * @returns The form.
 */
export function ResetPasswordForm(): ReactElement {
  const t = useTranslations("auth.reset");
  const { form, onSubmit, formError, pending } = useResetPassword();
  const { register, formState } = form;
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold">{t("title")}</h2>
        <p className="leading-7 text-muted">{t("intro")}</p>
      </div>
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
        <FormError message={formError} />
        <PasswordField
          registration={register("password")}
          error={formState.errors.password}
          kind="newPassword"
          autoComplete="new-password"
          showHint
        />
        <PasswordField
          registration={register("confirmPassword")}
          error={formState.errors.confirmPassword}
          kind="confirmPassword"
          autoComplete="new-password"
        />
        <SubmitButton label={t("submit")} pending={pending} />
      </form>
    </div>
  );
}
