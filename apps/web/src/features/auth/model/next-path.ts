/** Turns the `next` query value into a path the locale-aware router can open. */
import { DEFAULT_AFTER_SIGN_IN, sanitizeNext } from "@/shared/auth";

/** Non-default locale prefix that the guard puts into `next` (Arabic has none). */
const LOCALE_PREFIX = /^\/en(?=\/|$)/;

/**
 * Accepts a same-site `next` value and removes the language prefix, because the locale-aware router adds it again.
 *
 * @param value - Raw `next` query value.
 * @returns A safe path without a language prefix; the dashboard when the value is missing or unsafe.
 * @example
 * resolveNextPath("/en/dashboard"); // "/dashboard"
 * resolveNextPath("//evil.com"); // "/dashboard"
 */
export function resolveNextPath(value: string | null | undefined): string {
  const safe = sanitizeNext(value);
  if (!safe) return DEFAULT_AFTER_SIGN_IN;
  return safe.replace(LOCALE_PREFIX, "") || DEFAULT_AFTER_SIGN_IN;
}
