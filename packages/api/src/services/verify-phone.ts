/** Use case: check the code, then write the verified phone in one database call that re-checks uniqueness. */
import type { VerifyPhoneResponse } from "@tafsila/schemas";
import { toAsciiDigits } from "@tafsila/utils";
import { AppError } from "../domain/errors";
import { VERIFY_FAIL_LIMITS, type AttemptResult } from "../domain/phone-limits";
import type { AuthContext } from "../ports/token-verifier";
import type { PhoneDeps } from "./phone-shared";
import { requireEgyptianMobile } from "./phone-shared";

/** Digits in a code. */
const CODE_PATTERN = /^\d{6}$/;

/** What the route passes in. */
export interface VerifyPhoneInput {
  readonly ctx: AuthContext;
  /** Client IP (first x-forwarded-for hop), or null when unknown. */
  readonly ip: string | null;
  /** The number as typed. */
  readonly phone: string;
  /** The code as typed (Arabic digits allowed). */
  readonly code: string;
}

/**
 * Throws the "too many wrong codes" error and reports it.
 *
 * @param deps - Ports.
 * @param userId - Caller.
 * @param check - The refused attempt.
 */
function tooManyAttempts(deps: PhoneDeps, userId: string, check: AttemptResult): never {
  deps.analytics.capture(userId, "phone_verification_failed", { reason: "rate_limited" });
  throw new AppError("PHONE_TOO_MANY_ATTEMPTS", { details: { retryAfterSeconds: check.retryAfterSeconds } });
}

/**
 * Asks the provider to check the code; a wrong code gives null, other failures propagate.
 *
 * @param deps - Ports.
 * @param e164 - Number.
 * @param code - Six digits.
 * @returns The account the provider attached the number to, or null when the code is wrong.
 */
let diag = "";
async function providerUser(deps: PhoneDeps, e164: string, code: string): Promise<string | null> {
  try {
    return (await deps.otp.verify(e164, code)).userId;
  } catch (error) {
    if (error instanceof AppError && error.code === "PHONE_CODE_INVALID") {
      diag = error.messageEn;
      return null;
    }
    throw error;
  }
}

/**
 * Writes the verified phone and reports the outcome.
 *
 * @param deps - Ports.
 * @param userId - Caller.
 * @param e164 - Number.
 * @param phoneHash - Keyed hash of the number.
 * @returns When verified and whether the trial is available.
 */
async function confirm(
  deps: PhoneDeps,
  userId: string,
  e164: string,
  phoneHash: Uint8Array,
): Promise<VerifyPhoneResponse> {
  try {
    const confirmed = await deps.phones.confirm(userId, e164, phoneHash);
    deps.analytics.capture(userId, "phone_verified", { trial_eligible: confirmed.trialEligible });
    return confirmed;
  } catch (error) {
    if (error instanceof AppError && error.code === "PHONE_ALREADY_USED") {
      deps.analytics.capture(userId, "phone_verification_failed", { reason: "already_used" });
    }
    throw error;
  }
}

/**
 * Verifies the code for the caller and marks the phone verified.
 *
 * @param deps - Ports and environment rules.
 * @param input - Caller, number and code.
 * @returns When the phone was verified and whether the trial is still available.
 * @throws {AppError} PHONE_INVALID, PHONE_ALREADY_VERIFIED, PHONE_ALREADY_USED, PHONE_TOO_MANY_ATTEMPTS or PHONE_CODE_INVALID.
 */
export async function verifyPhone(deps: PhoneDeps, input: VerifyPhoneInput): Promise<VerifyPhoneResponse> {
  const { ctx } = input;
  const e164 = requireEgyptianMobile(input.phone);
  const code = toAsciiDigits(input.code).replace(/\s/g, "");
  if (!CODE_PATTERN.test(code)) throw new AppError("PHONE_CODE_INVALID");
  const phoneHash = deps.hasher.phone(e164);
  const status = await deps.phones.status(ctx, { e164, phoneHash });
  if (status.verified) throw new AppError("PHONE_ALREADY_VERIFIED");
  if (status.number === "taken") {
    deps.analytics.capture(ctx.userId, "phone_verification_failed", { reason: "already_used" });
    throw new AppError("PHONE_ALREADY_USED");
  }

  const base = {
    kind: "verify_fail",
    userId: ctx.userId,
    phoneHash,
    ipHash: input.ip ? deps.hasher.ip(input.ip) : null,
  } as const;
  const check = await deps.phones.attempt({ ...base, rules: VERIFY_FAIL_LIMITS, record: false });
  // A correct code is never blocked by the IP limit alone: only a wrong code is refused then.
  const ipOnly = !check.allowed && check.scope === "ip";
  if (!check.allowed && !ipOnly) tooManyAttempts(deps, ctx.userId, check);

  if ((await providerUser(deps, e164, code)) !== ctx.userId) {
    if (ipOnly) tooManyAttempts(deps, ctx.userId, check);
    await deps.phones.attempt({ ...base, rules: [], record: true });
    deps.analytics.capture(ctx.userId, "phone_verification_failed", { reason: "invalid_code" });
    throw new AppError("PHONE_CODE_INVALID", { messageEn: diag || "DIAG user mismatch" });
  }

  return confirm(deps, ctx.userId, e164, phoneHash);
}
