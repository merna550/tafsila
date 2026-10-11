/** Sign-up screen (FR-AUTH-01): email and password, optional Google. */
import { loadPublicConfig } from "@tafsila/config";
import type { ReactElement } from "react";
import { AuthCard, AuthTabs, GoogleButton, SignUpForm } from "@/features/auth";

/**
 * Renders the sign-up screen.
 *
 * @returns The card.
 */
export default function SignUpPage(): ReactElement {
  return (
    <AuthCard>
      <AuthTabs active="signUp" />
      <SignUpForm />
      {loadPublicConfig().authGoogleEnabled ? <GoogleButton next={null} /> : null}
    </AuthCard>
  );
}
