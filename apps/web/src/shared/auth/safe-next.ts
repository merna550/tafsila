/** The `next` redirect target after sign-in: only same-site paths are accepted (ADR-72), anything else is dropped. */

/** Where to go when there is no safe `next`. */
export const DEFAULT_AFTER_SIGN_IN = "/dashboard";

/** First printable ASCII code; everything below, and DEL, is a control character. */
const FIRST_PRINTABLE = 0x20;
/** The DEL control character. */
const DEL = 0x7f;

/**
 * Tells whether a string holds a backslash or a control character; browsers treat them as path separators.
 *
 * @param value - The string to inspect.
 * @returns True when it holds one.
 */
function hasUnsafeCharacter(value: string): boolean {
  return [...value].some((char) => {
    const code = char.codePointAt(0) ?? 0;
    return char === "\\" || code < FIRST_PRINTABLE || code === DEL;
  });
}

/**
 * Accepts a same-site path and refuses everything that could leave the site.
 *
 * @param value - The raw `next` query value.
 * @returns The path when it is safe, otherwise null.
 * @example
 * sanitizeNext("/dashboard"); // "/dashboard"
 * sanitizeNext("//evil.com"); // null
 */
export function sanitizeNext(value: string | null | undefined): string | null {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) return null;
  return hasUnsafeCharacter(value) ? null : value;
}
