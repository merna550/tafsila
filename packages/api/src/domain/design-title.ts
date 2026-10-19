/** Default design title (decision 242): the category word in the user's language plus the Cairo date. */
import type { GarmentCategory, Profile } from "@tafsila/schemas";

/** Category words per language (docs/design/copy.md glossary). */
const CATEGORY_WORDS: Record<GarmentCategory, Record<Profile["locale"], string>> = {
  dress: { ar: "فستان", en: "Dress" },
  skirt: { ar: "تنورة", en: "Skirt" },
  blouse: { ar: "بلوزة", en: "Blouse" },
};

/** Formats a date as `YYYY-MM-DD` (the en-CA layout) in Cairo time. */
const CAIRO_DATE = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Africa/Cairo",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/**
 * Names a new design that was created without a title, e.g. `فستان 2026-10-19`.
 *
 * @param category - Garment category.
 * @param locale - The user's language.
 * @param now - Current instant (from the Clock port).
 * @returns Category word, a space and the Cairo date.
 */
export function defaultDesignTitle(category: GarmentCategory, locale: Profile["locale"], now: Date): string {
  return `${CATEGORY_WORDS[category][locale]} ${CAIRO_DATE.format(now)}`;
}
