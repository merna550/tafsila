/** Use case: send a verification code, after every check (format, environment, already verified, limits, already used) has passed. */
import type { SendPhoneCodeResponse } from "@tafsila/schemas";
import { AppError } from "../domain/errors";
import { RESEND_COOLDOWN_SECONDS, SEND_LIMITS, sendLimitErrorCode } from "../domain/phone-limits";
import type { AuthContext } from "../ports/token-verifier";
import type { PhoneDeps } from "./phone-shared";
import { requireEgyptianMobile } from "./phone-shared";

/** What the route passes in. */
export interface SendPhoneCodeInput {
  /** The verified caller. */
  readonly ctx: AuthContext;
  /** The caller's access token (GoTrue phone change acts as the user). */
  readonly accessToken: string;
  /** Client IP (first x-forwarded-for hop), or null when unknown. */
  readonly ip: string | null;
  /** The number as typed. */
  readonly phone: string;
}

/**
 * Hands the code to the provider and reports a failure as an analytics event before rethrowing it.
 *
 * @param deps - Ports.
 * @param input - Caller.
 * @param e164 - Normalised number.
 */
async function deliver(deps: PhoneDeps, input: SendPhoneCodeInput, e164: string): Promise<void> {
  try {
    await deps.otp.send({ userId: input.ctx.userId, accessToken: input.accessToken }, e164);
  } catch (error) {
    const reason =
      error instanceof AppError && error.code === "PHONE_ALREADY_USED" ? "already_used" : "send_failed";
    deps.analytics.capture(input.ctx.userId, "phone_verification_failed", { reason });
    throw error;
  }
}

/**
 * Sends a code to the number for the caller.
 *
 * @param deps - Ports and environment rules.
 * @param input - Caller and number.
 * @returns The normalised number and the resend countdown.
 * @throws {AppError} PHONE_INVALID, PHONE_TEST_ONLY, PHONE_ALREADY_VERIFIED, PHONE_RESEND_TOO_SOON, PHONE_TOO_MANY_ATTEMPTS,
 *   PHONE_ALREADY_USED or PHONE_SEND_FAILED.
 */
export async function sendPhoneCode(
  deps: PhoneDeps,
  input: SendPhoneCodeInput,
): Promise<SendPhoneCodeResponse> {
  const { ctx } = input;
  const e164 = requireEgyptianMobile(input.phone, deps.rules);
  const phoneHash = deps.hasher.phone(e164);
  const status = await deps.phones.status(ctx, { e164, phoneHash });
  if (status.verified) throw new AppError("PHONE_ALREADY_VERIFIED");

  const attempt = await deps.phones.attempt({
    kind: "send",
    userId: ctx.userId,
    phoneHash,
    ipHash: input.ip ? deps.hasher.ip(input.ip) : null,
    rules: SEND_LIMITS,
    record: true,
  });
  if (!attempt.allowed) {
    deps.analytics.capture(ctx.userId, "phone_verification_failed", { reason: "rate_limited" });
    throw new AppError(sendLimitErrorCode(attempt), {
      details: { retryAfterSeconds: attempt.retryAfterSeconds },
    });
  }
  if (status.number !== "free") {
    deps.analytics.capture(ctx.userId, "phone_verification_failed", { reason: "already_used" });
    throw new AppError("PHONE_ALREADY_USED");
  }

  await deliver(deps, input, e164);
  deps.analytics.capture(ctx.userId, "phone_code_requested", {
    attempt: attempt.priorEvents > 0 ? "resend" : "first",
  });
  return { phone: e164, resendAfterSeconds: RESEND_COOLDOWN_SECONDS };
}
