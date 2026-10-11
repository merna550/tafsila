"use client";
/** Language switch: a link to the same page in the other language. */
import { useLocale, useTranslations } from "next-intl";
import type { ReactElement } from "react";
import { Link, usePathname } from "./navigation";
import { routing, type AppLocale } from "./routing";

/**
 * Renders a link that opens the current page in the other language.
 *
 * @returns The switch link.
 */
export function LocaleSwitch(): ReactElement {
  const t = useTranslations("common");
  const locale = useLocale() as AppLocale;
  const pathname = usePathname();
  const other = routing.locales.find((candidate) => candidate !== locale) ?? routing.defaultLocale;
  return (
    <Link
      href={pathname}
      locale={other}
      lang={other}
      className="text-sm underline underline-offset-4"
      data-testid="locale-switch"
    >
      {t("switchLanguage")}
    </Link>
  );
}
