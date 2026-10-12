/** Helpers shared by the phone use cases: number checking and the common dependencies. */
import { normalizeEgyptianMobile } from "@tafsila/utils";
import { AppError } from "../domain/errors";
import type { Analytics } from "../ports/analytics";
import type { PhoneHasher } from "../ports/phone-hasher";
import type { PhoneOtp } from "../ports/phone-otp";
import type { PhoneVerificationRepository } from "../ports/phone-verification-repository";

/** Environment rules for phone numbers. */
export interface PhoneRules {
  /** When true only `testNumbers` may be used (every environment except production). */
  readonly testOnly: boolean;
  /** Allowed E.164 numbers when `testOnly`. */
  readonly testNumbers: readonly string[];
}

/** Ports both phone use cases need. */
export interface PhoneDeps {
  readonly otp: PhoneOtp;
  readonly hasher: PhoneHasher;
  readonly phones: PhoneVerificationRepository;
  readonly analytics: Analytics;
  readonly rules: PhoneRules;
}

/**
 * Normalises typed text to E.164, throwing PHONE_INVALID when it is not a mobile and PHONE_TEST_ONLY when a rule list is given
 * and the number is not on it.
 *
 * @param raw - What the person typed.
 * @param rules - When given, the environment's test-number guard is applied.
 * @returns The E.164 number.
 * @throws {AppError} PHONE_INVALID or PHONE_TEST_ONLY.
 */
export function requireEgyptianMobile(raw: string, rules?: PhoneRules): string {
  const e164 = normalizeEgyptianMobile(raw);
  if (!e164) throw new AppError("PHONE_INVALID");
  if (rules?.testOnly && !rules.testNumbers.includes(e164)) throw new AppError("PHONE_TEST_ONLY");
  return e164;
}
