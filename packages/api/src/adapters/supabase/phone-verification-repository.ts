/** Drizzle phone verification repository and trial eligibility: they call the `private` SQL functions through withApiRole (decision 26-phone-otp-trial, 8). */
import { sql } from "drizzle-orm";
import { AppError } from "../../domain/errors";
import type { AttemptResult, LimitScope } from "../../domain/phone-limits";
import type {
  ConfirmResult,
  PhoneVerificationRepository,
  NumberState,
} from "../../ports/phone-verification-repository";
import type { TrialEligibility } from "../../ports/trial-eligibility";
import { scalar } from "./scalar";
import { sqlState } from "./sql-state";
import type { Tx, WithApiRole } from "./with-user";

/** SQLSTATE raised by private.confirm_phone when the number is taken. */
const SQLSTATE_USED = "PH001";
/** SQLSTATE raised by private.confirm_phone when the account is already verified. */
const SQLSTATE_VERIFIED = "PH002";

/**
 * Turns hash bytes into a bytea literal text (`\x…`), cast with `::bytea` in the query.
 *
 * @param bytes - A hash, or null.
 * @returns The literal, or null.
 */
function byteaLiteral(bytes: Uint8Array | null): string | null {
  return bytes ? `\\x${Buffer.from(bytes).toString("hex")}` : null;
}

/**
 * Writes the verified phone and grants the trial in the caller's transaction, so a failed grant rolls the verification back.
 * Maps the database's phone errors to AppError.
 *
 * @param tx - Transaction.
 * @param input - Account, verified number, its keyed hash and the credits of the free trial.
 * @returns When verified, whether the trial was available and whether it was granted now.
 */
async function confirmAndGrant(
  tx: Tx,
  input: { userId: string; e164: string; phoneHash: Uint8Array; trialCredits: number },
): Promise<ConfirmResult> {
  const { userId, e164, phoneHash, trialCredits } = input;
  try {
    const r = await scalar<{ verified_at: string; trial_eligible: boolean }>(
      tx,
      sql`select private.confirm_phone(${userId}::uuid, ${e164}::text, ${byteaLiteral(phoneHash)}::bytea) as result`,
    );
    const trialGranted = await scalar<boolean>(
      tx,
      sql`select private.grant_trial(${userId}::uuid, ${trialCredits}::integer) as result`,
    );
    return {
      verifiedAt: new Date(r.verified_at).toISOString(),
      trialEligible: r.trial_eligible,
      trialGranted,
    };
  } catch (error) {
    const state = sqlState(error);
    if (state === SQLSTATE_USED) throw new AppError("PHONE_ALREADY_USED");
    if (state === SQLSTATE_VERIFIED) throw new AppError("PHONE_ALREADY_VERIFIED");
    throw error;
  }
}

/**
 * Creates the repository.
 *
 * @param withApiRole - Door to the private functions.
 * @returns A PhoneVerificationRepository.
 */
export function createPhoneVerificationRepository(withApiRole: WithApiRole): PhoneVerificationRepository {
  return {
    status: (ctx, number) =>
      withApiRole(async (tx) => {
        const r = await scalar<{
          verified: boolean;
          phone: string | null;
          trial_eligible: boolean;
          number: NumberState | null;
        }>(
          tx,
          sql`select private.phone_status(${ctx.userId}::uuid, ${number?.e164 ?? null}::text, ${byteaLiteral(number?.phoneHash ?? null)}::bytea) as result`,
        );
        return { verified: r.verified, phone: r.phone, trialEligible: r.trial_eligible, number: r.number };
      }),
    attempt: (input) =>
      withApiRole(async (tx) => {
        const limits = JSON.stringify(
          input.rules.map((r) => ({ scope: r.scope, window_seconds: r.windowSeconds, max: r.max })),
        );
        const r = await scalar<{
          allowed: boolean;
          retry_after_seconds: number;
          scope: LimitScope | null;
          window_seconds: number | null;
          prior_events: number;
        }>(
          tx,
          sql`select private.phone_otp_attempt(${input.kind}::text, ${input.userId}::uuid, ${byteaLiteral(input.phoneHash)}::bytea, ${byteaLiteral(input.ipHash)}::bytea, ${limits}::jsonb, ${input.record}::boolean) as result`,
        );
        const result: AttemptResult = {
          allowed: r.allowed,
          retryAfterSeconds: r.retry_after_seconds,
          scope: r.scope,
          windowSeconds: r.window_seconds,
          priorEvents: r.prior_events,
        };
        return result;
      }),
    confirm: (userId, e164, phoneHash, trialCredits) =>
      withApiRole((tx) => confirmAndGrant(tx, { userId, e164, phoneHash, trialCredits })),
  };
}

/**
 * Creates the trial eligibility adapter (M7 reads it).
 *
 * @param withApiRole - Door to the private functions.
 * @returns A TrialEligibility.
 */
export function createTrialEligibility(withApiRole: WithApiRole): TrialEligibility {
  return {
    isEligible: (userId) =>
      withApiRole((tx) =>
        scalar<boolean>(tx, sql`select private.is_trial_eligible(${userId}::uuid) as result`),
      ),
  };
}
