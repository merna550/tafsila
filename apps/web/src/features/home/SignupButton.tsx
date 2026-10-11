"use client";
/** Home call-to-action: fires `signup_started` and opens the sign-up screen. */
import { Button } from "@tafsila/ui";
import { useTranslations } from "next-intl";
import type { ReactElement } from "react";
import { track } from "../../shared/analytics";
import { useRouter } from "../../shared/i18n";

/**
 * Renders the "start now" button, records that signup started and opens the sign-up screen.
 *
 * @returns The button.
 */
export function SignupButton(): ReactElement {
  const t = useTranslations("home");
  const router = useRouter();
  /** Records the start and opens the sign-up screen. */
  const start = (): void => {
    track("signup_started", { source: "home" });
    router.push("/sign-up");
  };
  return <Button onClick={start}>{t("start")}</Button>;
}
