"use client";
/** Forgot-password form: asks for the email and sends the reset link; then shows the notice. */
import { Link as UiLink } from "@tafsila/ui";
import { useTranslations } from "next-intl";
import type { ReactElement } from "react";
import { Link } from "@/shared/i18n";
import { useForgotPassword } from "../hooks/use-forgot-password";
import { CheckEmailNotice } from "./CheckEmailNotice";
import { EmailField, FormError, SubmitButton } from "./fields";

/**
 * Renders the forgot-password form.
 *
 * @returns The form, or the notice once the mail was sent.
 */
export function ForgotPasswordForm(): ReactElement {
  const t = useTranslations("auth.forgot");
  const { form, onSubmit, formError, pending, sentTo } = useForgotPassword();
  if (sentTo) return <CheckEmailNotice email={sentTo} kind="reset" />;
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold">{t("title")}</h2>
        <p className="leading-7 text-muted">{t("intro")}</p>
      </div>
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
        <FormError message={formError} />
        <EmailField registration={form.register("email")} error={form.formState.errors.email} />
        <SubmitButton label={t("submit")} pending={pending} />
      </form>
      <UiLink asChild className="self-start">
        <Link href="/sign-in">{t("back")}</Link>
      </UiLink>
    </div>
  );
}
