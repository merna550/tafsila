/** Reset-password screen (FR-AUTH-04): reached from the email link, which opens a recovery session first. */
import { getLocale } from "next-intl/server";
import type { ReactElement } from "react";
import { AuthCard, ResetPasswordForm } from "@/features/auth";
import { getSessionUser } from "@/shared/auth/server";
import { redirect } from "@/shared/i18n";

/**
 * Renders the reset form, or sends visitors without a recovery session to sign-in with a "link invalid" notice.
 *
 * @returns The card.
 */
export default async function ResetPasswordPage(): Promise<ReactElement> {
  const user = await getSessionUser();
  if (!user) redirect({ href: "/sign-in?error=link", locale: await getLocale() });
  return (
    <AuthCard>
      <ResetPasswordForm />
    </AuthCard>
  );
}
