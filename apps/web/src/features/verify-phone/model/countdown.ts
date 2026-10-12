/** Pure helpers of the resend countdown: the screen counts down to a deadline, so a slow timer never drifts. */

/** Milliseconds in a second. */
const MS_PER_SECOND = 1000;
/** Seconds in a minute. */
const SECONDS_PER_MINUTE = 60;

/**
 * Whole seconds left until a deadline, never negative.
 *
 * @param deadlineMs - Time the countdown ends, in epoch milliseconds.
 * @param nowMs - Current time, in epoch milliseconds.
 * @returns Seconds left, rounded up so "0:01" shows until the very end.
 */
export function secondsLeft(deadlineMs: number, nowMs: number): number {
  return Math.max(0, Math.ceil((deadlineMs - nowMs) / MS_PER_SECOND));
}

/**
 * Formats seconds as `m:ss`, as in the design ("0:42").
 *
 * @param seconds - Whole seconds, zero or more.
 * @returns The clock text with Western digits.
 * @example
 * formatCountdown(42); // "0:42"
 */
export function formatCountdown(seconds: number): string {
  const minutes = Math.floor(seconds / SECONDS_PER_MINUTE);
  const rest = String(seconds % SECONDS_PER_MINUTE).padStart(2, "0");
  return `${minutes}:${rest}`;
}
