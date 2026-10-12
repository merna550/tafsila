"use client";
/** Notice on the dashboard when the account has no verified phone; the verify screen is skippable, this brings people back. */
import { Link as UiLink } from "@tafsila/ui";
import { useTranslations } from "next-intl";
import type { ReactElement } from "react";
import { Link } from "@/shared/i18n";
import { usePhoneStatus } from "./hooks/use-phone-status";

/** Where the banner link goes: the verify screen, then back to the dashboard. */
const VERIFY_HREF = "/verify?next=%2Fdashboard";

/**
 * Renders the banner only when the status loaded and the phone is not verified (nothing while loading or on error,
 * because the banner is a reminder and must never block the page).
 *
 * @returns The banner, or null.
 */
export function PhoneNotVerifiedBanner(): ReactElement | null {
  const t = useTranslations("phoneVerification.banner");
  const result = usePhoneStatus();
  if (result.state !== "ready" || result.status.verified) return null;
  return (
    <aside
      aria-label={t("label")}
      className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-md bg-accent-soft px-4 py-3"
    >
      <p className="leading-7">{t("text")}</p>
      <UiLink asChild className="font-semibold">
        <Link href={VERIFY_HREF}>{t("action")}</Link>
      </UiLink>
    </aside>
  );
}
