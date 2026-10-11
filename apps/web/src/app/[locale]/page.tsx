/** Home page placeholder: proves RTL/LTR layout, shared UI, messages and the API are wired. */
import { hasLocale } from "next-intl";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import type { ReactElement } from "react";
import { SignupButton } from "../../features/home";
import { routing } from "../../shared/i18n";

/**
 * Renders the landing placeholder in the request language.
 *
 * @param props - Route params.
 * @param props.params - Route params holding the locale.
 * @returns The home page.
 */
export default async function HomePage({
  params,
}: Readonly<{ params: Promise<{ locale: string }> }>): Promise<ReactElement> {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  const t = await getTranslations("home");
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-start gap-6 px-6 py-24">
      <h1 className="text-2xl font-bold">{t("title")}</h1>
      <p className="text-lg leading-8">{t("intro")}</p>
      <div className="flex gap-3">
        <SignupButton />
        <a href="/api/health" className="self-center text-sm underline underline-offset-4">
          {t("health")}
        </a>
      </div>
    </div>
  );
}
