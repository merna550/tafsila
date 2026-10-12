/** Display helpers of the verify-phone screen. */
import { formatEgyptianMobile } from "@tafsila/utils";

/** Fixed country box next to the number field; the person types the rest. */
export const COUNTRY_PREFIX = "+20";

/** Example shown inside the empty number field (a made-up number in the local format). */
export const PHONE_EXAMPLE = "010 1234 5678";

/** Left-to-right isolate and pop marks: keep a number readable inside Arabic sentences. */
const LRI = "⁦";
const PDI = "⁩";

/**
 * Formats an E.164 number for the screen: grouped like the design (`010 1234 5678`).
 *
 * @param e164 - The number the code was sent to.
 * @returns The grouped local form.
 */
export function displayPhone(e164: string): string {
  return formatEgyptianMobile(e164);
}

/**
 * Wraps text in direction marks so a number keeps its left-to-right order inside right-to-left text.
 *
 * @param text - The text to isolate.
 * @returns The text between the isolate marks.
 */
export function isolateLtr(text: string): string {
  return `${LRI}${text}${PDI}`;
}
