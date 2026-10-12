/** Egyptian mobile number handling shared by the API and the web form (decision 26-phone-otp-trial, FR-AUTH-02). */

/** Arabic-Indic and Persian digits mapped to ASCII, so copy-paste from Arabic text works. */
const EASTERN_DIGITS = /[٠-٩۰-۹]/g;

/** Eastern digit code points end in the digit value modulo 16 (U+0660 and U+06F0 are multiples of 16). */
const DIGIT_MODULO = 16;

/** Separators and invisible direction marks (U+200E/F, U+202A-E, U+2066-9) that come with pasted numbers. */
const IGNORED_CHARS = /[\s\-.()‎‏‪-‮⁦-⁩]/g;

/** `+20`, `0020` or `20` followed by the mobile part; `+200` (trunk zero after the box); or the local forms. */
const EGYPTIAN_MOBILE = /^(?:(?:\+?20|0020)(1[0125]\d{8})|\+200(1[0125]\d{8})|0?(1[0125]\d{8}))$/;

/**
 * Converts Arabic-Indic and Persian digits to ASCII digits.
 *
 * @param input - Text that may contain eastern digits.
 * @returns The same text with ASCII digits.
 * @example
 * toAsciiDigits("٠١٢"); // "012"
 */
export function toAsciiDigits(input: string): string {
  return input.replace(EASTERN_DIGITS, (digit) => String(digit.charCodeAt(0) % DIGIT_MODULO));
}

/**
 * Normalises an Egyptian mobile number to E.164 (`+201XXXXXXXXX`), or null when it is not a mobile number.
 * Accepts the local, international and "after the +20 box" forms; landlines and other prefixes are refused.
 *
 * @param input - What the person typed or pasted.
 * @returns The E.164 number, or null.
 * @example
 * normalizeEgyptianMobile("010 1234 5678"); // "+201012345678"
 */
export function normalizeEgyptianMobile(input: string): string | null {
  const cleaned = toAsciiDigits(input).replace(IGNORED_CHARS, "");
  const match = EGYPTIAN_MOBILE.exec(cleaned);
  const national = match?.[1] ?? match?.[2] ?? match?.[3];
  return national ? `+20${national}` : null;
}

/**
 * Formats an E.164 Egyptian mobile for display as `010 1234 5678` (always rendered left-to-right).
 *
 * @param e164 - A number from {@link normalizeEgyptianMobile}.
 * @returns The grouped local form, or the input unchanged when it is not an Egyptian mobile.
 * @example
 * formatEgyptianMobile("+201012345678"); // "010 1234 5678"
 */
export function formatEgyptianMobile(e164: string): string {
  const match = /^\+20(1[0125]\d{8})$/.exec(e164);
  const national = match?.[1];
  if (!national) return e164;
  return `0${national.slice(0, 2)} ${national.slice(2, GROUP_END)} ${national.slice(GROUP_END)}`;
}

/** Index where the second group of a formatted number ends. */
const GROUP_END = 6;

/** Anything shaped like an Egyptian mobile, in text of any kind (used to keep phones out of logs and events). */
export const EGYPTIAN_MOBILE_IN_TEXT = /(?:\+?20|0020|0)?\s?1[0125](?:[\s-]?\d){8}/g;

/**
 * Masks every Egyptian-mobile-shaped substring.
 *
 * @param text - Any text (a URL, a message).
 * @returns The text with phone-like parts replaced by `[phone]`.
 * @example
 * maskPhones("/verify?p=01012345678"); // "/verify?p=[phone]"
 */
export function maskPhones(text: string): string {
  return toAsciiDigits(text).replace(EGYPTIAN_MOBILE_IN_TEXT, "[phone]");
}
