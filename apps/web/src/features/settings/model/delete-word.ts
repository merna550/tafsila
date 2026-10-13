/** The word a person types to confirm deleting her account, and the check that it was typed exactly. */
import type { AppLocale } from "@/shared/i18n";

/** Confirmation word per language (copy.md glossary: "delete account / حذف الحساب"). */
export const DELETE_WORDS: Readonly<Record<AppLocale, string>> = { ar: "حذف", en: "DELETE" };

/**
 * Normalises typed text: Unicode composed form and no surrounding spaces, so the same word typed on different keyboards matches.
 *
 * @param text - Text typed by the person.
 * @returns The normalised text.
 */
function normalise(text: string): string {
  return text.normalize("NFC").trim();
}

/**
 * Tells whether the typed text is exactly the confirmation word of the page language (case matters in English).
 *
 * @param input - What the person typed.
 * @param locale - Page language.
 * @returns True on an exact match after trimming.
 * @example
 * matchesDeleteWord(" حذف ", "ar"); // true
 */
export function matchesDeleteWord(input: string, locale: AppLocale): boolean {
  return normalise(input) === normalise(DELETE_WORDS[locale]);
}
