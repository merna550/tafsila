/** In-memory phone verification repository and trial eligibility: same rules as the SQL functions, for service and route tests. */
import { AppError } from "../../domain/errors";
import { EVENT_RETENTION_SECONDS, evaluateLimits, type LimitEvent } from "../../domain/phone-limits";
import type { Clock } from "../../ports/clock";
import type { PhoneStatus, PhoneVerificationRepository } from "../../ports/phone-verification-repository";
import type { TrialEligibility } from "../../ports/trial-eligibility";

/** Milliseconds in a second. */
const MS_PER_SECOND = 1000;

/** A verified number: who holds it now (null after the account is deleted) and whether the trial was granted. */
interface TrialRow {
  userId: string | null;
  trialGrantedAt: Date | null;
}

/** The fake tables. */
interface State {
  readonly trial: Map<string, TrialRow>;
  readonly profiles: Map<string, { phone: string; verifiedAt: Date }>;
  readonly events: LimitEvent[];
}

/** The repository plus the hooks tests use to simulate other writers. */
export interface MemoryPhoneVerification extends PhoneVerificationRepository, TrialEligibility {
  /** Simulates deleting an account: its verified number stays, unlinked. */
  deleteAccount(userId: string): void;
  /** Simulates the billing code granting the trial. */
  grantTrial(userId: string): void;
  /** Recorded rate-limit events. */
  readonly events: LimitEvent[];
}

/**
 * Converts hash bytes to a map key.
 *
 * @param bytes - A hash.
 * @returns Hex text.
 */
const hex = (bytes: Uint8Array): string => Buffer.from(bytes).toString("hex");

/**
 * Same rule as private.is_trial_eligible: verified, the number row is the user's and the trial is not granted.
 *
 * @param state - Fake tables.
 * @param userId - Account.
 * @returns True when eligible.
 */
function isEligible(state: State, userId: string): boolean {
  if (!state.profiles.has(userId)) return false;
  return [...state.trial.values()].some((row) => row.userId === userId && row.trialGrantedAt === null);
}

/**
 * Same rule as private.phone_status for a number: own, taken by a row or a live profile, or free.
 *
 * @param state - Fake tables.
 * @param userId - Caller.
 * @param number - The number asked about.
 * @returns The number state.
 */
function numberState(
  state: State,
  userId: string,
  number: { e164: string; phoneHash: Uint8Array },
): PhoneStatus["number"] {
  const row = state.trial.get(hex(number.phoneHash));
  if (row?.userId === userId) return "own";
  const liveOther = [...state.profiles.entries()].some(([id, p]) => p.phone === number.e164 && id !== userId);
  return row || liveOther ? "taken" : "free";
}

/**
 * Creates the memory repository.
 *
 * @param clock - Time source for events and the verified time.
 * @returns A MemoryPhoneVerification.
 */
export function createMemoryPhoneVerification(clock: Clock): MemoryPhoneVerification {
  const state: State = { trial: new Map(), profiles: new Map(), events: [] };
  const { events } = state;
  return {
    events,
    deleteAccount(userId) {
      state.profiles.delete(userId);
      for (const row of state.trial.values()) if (row.userId === userId) row.userId = null;
    },
    grantTrial(userId) {
      for (const row of state.trial.values()) if (row.userId === userId) row.trialGrantedAt = clock.now();
    },
    isEligible: (userId) => Promise.resolve(isEligible(state, userId)),
    status(ctx, number) {
      const profile = state.profiles.get(ctx.userId);
      return Promise.resolve({
        verified: profile !== undefined,
        phone: profile?.phone ?? null,
        trialEligible: isEligible(state, ctx.userId),
        number: number ? numberState(state, ctx.userId, number) : null,
      });
    },
    attempt(input) {
      const now = clock.now();
      const cutoff = now.getTime() - EVENT_RETENTION_SECONDS * MS_PER_SECOND;
      events.splice(0, events.length, ...events.filter((e) => e.at.getTime() >= cutoff));
      const keys = {
        userId: input.userId,
        phoneHash: hex(input.phoneHash),
        ipHash: input.ipHash ? hex(input.ipHash) : null,
      };
      const result = evaluateLimits(events, { kind: input.kind, keys, rules: input.rules }, now);
      if (result.allowed && input.record) events.push({ kind: input.kind, ...keys, at: now });
      return Promise.resolve(result);
    },
    confirm(userId, e164, phoneHash) {
      if (state.profiles.has(userId)) return Promise.reject(new AppError("PHONE_ALREADY_VERIFIED"));
      if (numberState(state, userId, { e164, phoneHash }) !== "free") {
        return Promise.reject(new AppError("PHONE_ALREADY_USED"));
      }
      const now = clock.now();
      state.profiles.set(userId, { phone: e164, verifiedAt: now });
      state.trial.set(hex(phoneHash), { userId, trialGrantedAt: null });
      return Promise.resolve({ verifiedAt: now.toISOString(), trialEligible: true });
    },
  };
}
