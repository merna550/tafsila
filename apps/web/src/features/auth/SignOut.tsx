"use client";
/** Connects the sign-out hook to the presentational button. */
import { useTranslations } from "next-intl";
import type { ReactElement } from "react";
import { SignOutButton } from "./components/SignOutButton";
import { useSignOut } from "./hooks/use-sign-out";

/**
 * Renders the working sign-out control.
 *
 * @returns The control.
 */
export function SignOut(): ReactElement {
  const t = useTranslations("auth");
  const { signOut, pending } = useSignOut();
  return <SignOutButton label={t("signOut")} pending={pending} onSignOut={() => void signOut()} />;
}
