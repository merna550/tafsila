/** Display form of the phone number on the settings screen. */
import { formatEgyptianMobile } from "@tafsila/utils";

/**
 * Formats an E.164 Egyptian mobile as the design shows it: `+20 10 1234 5678`. Other text is returned unchanged.
 *
 * @param e164 - The verified number, such as `+201012345678`.
 * @returns The grouped international form.
 */
export function internationalPhone(e164: string): string {
  const local = formatEgyptianMobile(e164);
  return local.startsWith("0") && local !== e164 ? `+20 ${local.slice(1)}` : e164;
}
