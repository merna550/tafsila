/** Per-request i18n config: picks the locale from the URL (falling back to Arabic) and loads its messages. */
import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { routing } from "./routing";

/** Resolves the locale of the request and its message file. */
// next/root-params is still experimental; the proxy sets this locale on every request, so the stable API is used.
// eslint-disable-next-line sonarjs/deprecation
export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;
  const messages = (await import(`../../../messages/${locale}.json`)) as { default: Record<string, unknown> };
  return { locale, messages: messages.default };
});
