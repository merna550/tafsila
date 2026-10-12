/** Forgot-password screen (FR-AUTH-04): asks for the email and sends the reset link. */
import type { ReactElement } from "react";
import { AuthCard, ForgotPasswordForm } from "@/features/auth";

/**
 * Renders the forgot-password screen.
 *
 * @returns The card.
 */
export default function ForgotPasswordPage(): ReactElement {
  return (
    <AuthCard>
      <ForgotPasswordForm />
    </AuthCard>
  );
}
