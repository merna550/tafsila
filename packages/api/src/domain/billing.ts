/** Billing rules that need no database: the trial size, the "renews soon" window and the grant list shown to the user. */
import type { CreditsResponse } from "@tafsila/schemas";

/** Free credits a phone-verified user gets once (ADR-365 item 2). Not product data: the trial is not sold. */
export const TRIAL_CREDITS = 3;

/** A plan is "renewing soon" when its period ends within this many days. */
export const RENEW_SOON_DAYS = 7;

/** Milliseconds in a day. */
const MS_PER_DAY = 86_400_000;

/** Credits left in one lot. */
export interface CreditLot {
  readonly remaining: number;
  /** ISO time, or null when the lot never expires. */
  readonly expiresAt: string | null;
}

/**
 * Whether a plan period ends within the renew-soon window (a period already over is not "soon").
 *
 * @param periodEnd - When the current period ends.
 * @param now - Current time.
 * @returns True when 0 < time left <= 7 days.
 */
export function isRenewSoon(periodEnd: Date, now: Date): boolean {
  const left = periodEnd.getTime() - now.getTime();
  return left > 0 && left <= RENEW_SOON_DAYS * MS_PER_DAY;
}

/**
 * Orders two lots by expiry; a lot that never expires goes last.
 *
 * @param a - First lot.
 * @param b - Second lot.
 * @returns Negative when `a` expires first.
 */
function byExpiry(a: CreditLot, b: CreditLot): number {
  if (a.expiresAt === b.expiresAt) return 0;
  if (a.expiresAt === null) return 1;
  if (b.expiresAt === null) return -1;
  return Date.parse(a.expiresAt) - Date.parse(b.expiresAt);
}

/**
 * Turns lots into the grant list of the response: the lot that expires first comes first, never-expiring lots last.
 *
 * @param lots - Lots with credits left.
 * @returns The grants, sorted.
 */
export function toGrants(lots: readonly CreditLot[]): CreditsResponse["grants"] {
  return [...lots].sort(byExpiry).map((lot) => ({ credits: lot.remaining, expiresAt: lot.expiresAt }));
}
