/** Where the `/auth/confirm` and `/auth/callback` route handlers send the browser; pure, so it is unit tested. */
import { DEFAULT_AFTER_SIGN_IN, sanitizeNext } from "./safe-next";

/** Link types the confirm handler accepts (Supabase `verifyOtp` types for the two mails we send). */
export type ConfirmType = "signup" | "email" | "recovery";

/** Where a failed or malformed link ends: the sign-in screen with the "link invalid" notice. */
export const LINK_FAILED_PATH = "/sign-in?error=link";
/** The reset form, opened with the recovery session. */
export const RESET_PASSWORD_PATH = "/reset-password";
/** The dashboard with the flag that fires `signup_completed` once. */
export const WELCOME_PATH = `${DEFAULT_AFTER_SIGN_IN}?welcome=1`;
/** The phone verification screen (skippable); it opens `next` afterwards, here the welcome dashboard. */
export const VERIFY_PHONE_PATH = "/verify";

/**
 * Builds the verify-phone address that continues to a path afterwards.
 *
 * @param next - Same-site path to open after verifying or skipping.
 * @returns The verify path with an encoded `next`.
 */
function verifyThen(next: string): string {
  return `${VERIFY_PHONE_PATH}?next=${encodeURIComponent(next)}`;
}
/** An account created less than this many seconds ago counts as a new sign-up after Google. */
const NEW_ACCOUNT_SECONDS = 60;
/** Milliseconds in a second. */
const MS_PER_SECOND = 1000;

/**
 * Narrows the `type` query value of a mail link.
 *
 * @param value - Raw query value.
 * @returns The type, or null when it is not one of ours.
 */
export function parseConfirmType(value: string | null): ConfirmType | null {
  return value === "signup" || value === "email" || value === "recovery" ? value : null;
}

/**
 * Chooses the page after a mail link was verified.
 *
 * @param type - The verified link type.
 * @returns The reset form for recovery links, otherwise the verify-phone screen that continues to the welcome dashboard.
 */
export function confirmDestination(type: ConfirmType): string {
  return type === "recovery" ? RESET_PASSWORD_PATH : verifyThen(WELCOME_PATH);
}

/**
 * Chooses the page after Google sign-in: new accounts go to the verify-phone screen and then the welcome dashboard,
 * others go to `next` or the dashboard.
 *
 * @param next - Raw `next` query value (only same-site paths are followed).
 * @param createdAt - ISO time the account was created.
 * @param now - Current time (a parameter, so tests are exact).
 * @returns The path to redirect to.
 */
export function callbackDestination(next: string | null, createdAt: string | undefined, now: Date): string {
  const ageSeconds = createdAt
    ? (now.getTime() - new Date(createdAt).getTime()) / MS_PER_SECOND
    : Number.POSITIVE_INFINITY;
  if (ageSeconds >= 0 && ageSeconds < NEW_ACCOUNT_SECONDS) return verifyThen(`${WELCOME_PATH}&method=google`);
  return sanitizeNext(next) ?? DEFAULT_AFTER_SIGN_IN;
}
