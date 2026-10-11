"use client";
/** The two tabs above the sign-in and sign-up forms; they are links, so each screen keeps its own URL. */
import { useTranslations } from "next-intl";
import type { ReactElement } from "react";
import { Link } from "@/shared/i18n";

/** Props for {@link AuthTabs}. */
interface AuthTabsProps {
  /** The screen that is open. */
  readonly active: "signIn" | "signUp";
}

/**
 * Renders the sign-in / create-account switch.
 *
 * @param props - The open screen.
 * @returns The tab links.
 */
export function AuthTabs({ active }: Readonly<AuthTabsProps>): ReactElement {
  const t = useTranslations("auth.tabs");
  const tabs = [
    { key: "signIn", href: "/sign-in" },
    { key: "signUp", href: "/sign-up" },
  ] as const;
  return (
    <nav aria-label={t("label")} className="flex gap-1 rounded-md bg-surface-hover p-1">
      {tabs.map(({ key, href }) => (
        <Link
          key={key}
          href={href}
          aria-current={active === key ? "page" : undefined}
          className={`flex min-h-11 flex-1 items-center justify-center rounded-sm text-base font-semibold ${
            active === key ? "bg-surface text-text shadow-card" : "text-muted"
          }`}
        >
          {t(key)}
        </Link>
      ))}
    </nav>
  );
}
