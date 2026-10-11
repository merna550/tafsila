"use client";
/** Home call-to-action: fires `signup_started` (placeholder until the M1 signup form). */
import { Button } from "@tafsila/ui";
import { useTranslations } from "next-intl";
import type { ReactElement } from "react";
import { track } from "../../shared/analytics";

/**
 * Renders the "start now" button and records that signup started.
 *
 * @returns The button.
 */
export function SignupButton(): ReactElement {
  const t = useTranslations("home");
  return <Button onClick={() => track("signup_started", { source: "home" })}>{t("start")}</Button>;
}
