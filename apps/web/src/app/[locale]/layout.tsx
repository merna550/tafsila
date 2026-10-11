/** Locale layout: sets the document language and direction (Arabic RTL by default, SRS NFR-06) and provides the messages. */
import { loadPublicConfig } from "@tafsila/config";
import type { Metadata } from "next";
import { IBM_Plex_Sans_Arabic } from "next/font/google";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations } from "next-intl/server";
import { connection } from "next/server";
import type { ReactElement, ReactNode } from "react";
import { DIRECTION, routing } from "../../shared/i18n";
import { ObservabilityProvider } from "../../shared/observability/ObservabilityProvider";
import { AppFrame } from "./AppFrame";
import "../globals.css";

/** IBM Plex Sans Arabic (Arabic + Latin), self-hosted at build time; exposed as --font-plex for the design tokens. */
const plex = IBM_Plex_Sans_Arabic({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "600"],
  display: "swap",
  variable: "--font-plex",
});

/** Route params of the locale segment. */
interface LocaleParams {
  /** The URL locale. */
  readonly params: Promise<{ locale: string }>;
}

/**
 * Lists the locales to pre-render.
 *
 * @returns One params object per locale.
 */
export function generateStaticParams(): { locale: string }[] {
  return routing.locales.map((locale) => ({ locale }));
}

/**
 * Builds the page title and description in the request language.
 *
 * @param props - Route params.
 * @returns The metadata.
 */
export async function generateMetadata({ params }: Readonly<LocaleParams>): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "metadata" });
  return { title: t("title"), description: t("description") };
}

/**
 * Wraps every page with the document shell in the request language and starts error tracking and analytics.
 * Reads the browser configuration per request (not at build time) so one build runs everywhere.
 *
 * @param props - Route params and the page content.
 * @param props.children - Page to render.
 * @param props.params - Route params holding the locale.
 * @returns The html/body shell.
 */
export default async function LocaleLayout({
  children,
  params,
}: Readonly<LocaleParams & { children: ReactNode }>): Promise<ReactElement> {
  await connection();
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  return (
    <html lang={locale} dir={DIRECTION[locale]} className={plex.variable}>
      <body className="min-h-screen antialiased">
        <NextIntlClientProvider>
          <ObservabilityProvider config={loadPublicConfig()} />
          <AppFrame dir={DIRECTION[locale]}>{children}</AppFrame>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
