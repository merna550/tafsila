"use client";
/** Sign-up form: email, password twice; after sending, it shows the "check your email" notice instead. */
import { useTranslations } from "next-intl";
import type { ReactElement } from "react";
import { useSignUp } from "../hooks/use-sign-up";
import { CheckEmailNotice } from "./CheckEmailNotice";
import { EmailField, FormError, PasswordField, SubmitButton } from "./fields";

/**
 * Renders the sign-up form.
 *
 * @returns The form, or the notice once the mail was sent.
 */
export function SignUpForm(): ReactElement {
  const t = useTranslations("auth");
  const { form, onSubmit, formError, pending, sentTo } = useSignUp();
  const { register, formState } = form;
  if (sentTo) return <CheckEmailNotice email={sentTo} kind="confirm" />;
  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      <FormError message={formError} />
      <EmailField registration={register("email")} error={formState.errors.email} />
      <PasswordField
        registration={register("password")}
        error={formState.errors.password}
        kind="password"
        autoComplete="new-password"
        showHint
      />
      <PasswordField
        registration={register("confirmPassword")}
        error={formState.errors.confirmPassword}
        kind="confirmPassword"
        autoComplete="new-password"
      />
      <SubmitButton label={t("signUp.submit")} pending={pending} />
    </form>
  );
}
