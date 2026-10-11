/** Test helper: renders an element to static HTML inside a next-intl provider with the real message files. */
import { NextIntlClientProvider } from "next-intl";
import type { ReactElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ar from "@messages/ar.json";
import en from "@messages/en.json";
import type { AppLocale } from "./routing";

/** The real messages per language. */
export const MESSAGES = { ar, en } as const;

/**
 * Renders an element with the messages of one language.
 *
 * @param element - What to render.
 * @param locale - Language of the messages; defaults to Arabic.
 * @returns The HTML string.
 */
export function renderWithIntl(element: ReactElement, locale: AppLocale = "ar"): string {
  return renderToStaticMarkup(
    <NextIntlClientProvider locale={locale} messages={MESSAGES[locale]}>
      {element}
    </NextIntlClientProvider>,
  );
}
