/** Helpers shared by the e2e specs: the real message files, the language of the running project and the app's alert. */
import { readFileSync } from "node:fs";
import type { Locator, Page } from "@playwright/test";
import type arMessages from "../../messages/ar.json";

/** Shape of the message files. */
export type Messages = typeof arMessages;

/**
 * Reads a messages file with fs: native ESM in Playwright rejects bare JSON imports.
 *
 * @param locale - Which messages file to load.
 * @returns The parsed messages.
 */
export function loadMessages(locale: "ar" | "en"): Messages {
  const url = new URL(`../../messages/${locale}.json`, import.meta.url);
  return JSON.parse(readFileSync(url, "utf8")) as Messages;
}

/** Messages of both languages. */
export const MESSAGES = { ar: loadMessages("ar"), en: loadMessages("en") } as const;

/**
 * Finds the app's own error notice. Next.js adds a second, empty role="alert" (the route announcer).
 *
 * @param page - The page.
 * @returns Locator of the notice.
 */
export function appAlert(page: Page): Locator {
  return page.locator('[role="alert"]:not(#__next-route-announcer__)');
}

/**
 * Reads the language of the running project.
 *
 * @param testInfo - Playwright test info.
 * @returns Locale, URL prefix and its messages.
 */
export function projectLocale(testInfo: { project: { metadata: { locale?: unknown } } }): {
  locale: "ar" | "en";
  prefix: string;
  t: Messages;
} {
  const locale = testInfo.project.metadata.locale as "ar" | "en";
  return { locale, prefix: locale === "ar" ? "" : "/en", t: MESSAGES[locale] };
}
