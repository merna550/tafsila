/** The UTC day used by the daily AI caps (documented in decision 339: caps reset at 00:00 UTC). */

/**
 * Returns 00:00 UTC of the day that contains `now`.
 *
 * @param now - Any instant.
 * @returns Start of that UTC day.
 */
export function utcDayStart(now: Date): Date {
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}
