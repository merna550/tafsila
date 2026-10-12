/** Phone verification repository port: the database side of the flow (status, rate-limit events, the confirm write). */
import type { AuthContext } from "./token-verifier";
import type { AttemptKind, AttemptResult, LimitRule } from "../domain/phone-limits";

/** How a number relates to the caller. */
export type NumberState = "free" | "own" | "taken";

/** Verification state of the caller, plus the state of a number when one was asked about. */
export interface PhoneStatus {
  readonly verified: boolean;
  readonly phone: string | null;
  readonly trialEligible: boolean;
  /** Null when no number was asked about. */
  readonly number: NumberState | null;
}

/** Input of a rate-limit check. */
export interface AttemptInput {
  readonly kind: AttemptKind;
  readonly userId: string;
  readonly phoneHash: Uint8Array;
  readonly ipHash: Uint8Array | null;
  readonly rules: readonly LimitRule[];
  /** Record the event when it is allowed. */
  readonly record: boolean;
}

/** Result of the confirm write. */
export interface ConfirmResult {
  readonly verifiedAt: string;
  readonly trialEligible: boolean;
}

/** Reads and writes phone verification state; adapters run through `withApiRole` and the `private` functions. */
export interface PhoneVerificationRepository {
  /** Verification state of the caller; with a number, also whether it is free, own or taken. */
  status(ctx: AuthContext, number?: { e164: string; phoneHash: Uint8Array }): Promise<PhoneStatus>;
  /** Atomic rate-limit check, recording the event when allowed and asked. */
  attempt(input: AttemptInput): Promise<AttemptResult>;
  /** Writes the verified phone; throws AppError PHONE_ALREADY_USED or PHONE_ALREADY_VERIFIED. */
  confirm(userId: string, e164: string, phoneHash: Uint8Array): Promise<ConfirmResult>;
}
