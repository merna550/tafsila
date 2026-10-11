"use client";
/** Sign-in form: email, password, a "forgot password" link and the error under the form. */
import { Link as UiLink } from "@tafsila/ui";
import { useTranslations } from "next-intl";
import type { ReactElement } from "react";
import { Link } from "@/shared/i18n";
import { useSignIn } from "./hooks/use-sign-in";
import { EmailField, FormError, PasswordField, SubmitButton } from "./components/fields";

/** Props for {@link SignInForm}. */
interface SignInFormProps {
  /** Raw `next` query value (where to go after signing in). */
  readonly next: string | null;
  /** Error to show before any submit, for example an invalid email link. */
  readonly initialError?: string | null;
}

/**
 * Renders the sign-in form.
 *
 * @param props - The `next` value and an optional first error.
 * @returns The form.
 */
export function SignInForm({ next, initialError = null }: Readonly<SignInFormProps>): ReactElement {
  const t = useTranslations("auth");
  const { form, onSubmit, formError, pending } = useSignIn(next);
  const { register, formState } = form;
  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-5">
      <FormError message={formError ?? initialError} />
      <EmailField registration={register("email")} error={formState.errors.email} />
      <div className="flex flex-col gap-2">
        <PasswordField
          registration={register("password")}
          error={formState.errors.password}
          kind="password"
          autoComplete="current-password"
        />
        <UiLink asChild className="self-end text-sm font-medium">
          <Link href="/forgot-password">{t("signIn.forgot")}</Link>
        </UiLink>
      </div>
      <SubmitButton label={t("signIn.submit")} pending={pending} />
    </form>
  );
}
