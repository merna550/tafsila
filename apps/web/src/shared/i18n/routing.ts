/** Locale routing: Arabic is the default and has no URL prefix, English lives under /en (decision 25a-2). */
import { defineRouting } from "next-intl/routing";

/** The one routing definition shared by the proxy, the request config and the navigation helpers. */
export const routing = defineRouting({
  locales: ["ar", "en"],
  defaultLocale: "ar",
  localePrefix: "as-needed",
});

/** A supported UI language. */
export type AppLocale = (typeof routing.locales)[number];

/** Text direction per language (SRS NFR-06). */
export const DIRECTION: Record<AppLocale, "rtl" | "ltr"> = { ar: "rtl", en: "ltr" };
