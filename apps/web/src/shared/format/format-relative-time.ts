/** Relative time and month names with `Intl`, always with Western digits (NFR-06). The clock is passed in, never read here. */

/** Languages the app writes dates in. */
export type DateLocale = "ar" | "en";

/* eslint-disable no-magic-numbers -- the file defines the time unit constants */
const SECOND = 1000;
const MINUTE = 60 * SECOND;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;
/** A month and a year as a whole number of days, good enough for "3 months ago". */
const MONTH = 30 * DAY;
const YEAR = 365 * DAY;

/**
 * Builds the `Intl` locale tag: Gregorian calendar and Western digits for both languages.
 *
 * @param locale - App language.
 * @returns A BCP 47 tag with Unicode extensions.
 */
function intlTag(locale: DateLocale): string {
  return `${locale}-u-ca-gregory-nu-latn`;
}

/**
 * Picks the unit and the signed amount that describe an elapsed time ("-3 days").
 *
 * @param elapsedMs - Milliseconds since the date; negative when the date is in the future.
 * @returns The amount (negative for the past) and its `Intl` unit.
 */
function amountAndUnit(elapsedMs: number): { value: number; unit: Intl.RelativeTimeFormatUnit } {
  const sign = elapsedMs < 0 ? 1 : -1;
  const abs = Math.abs(elapsedMs);
  const steps: [number, Intl.RelativeTimeFormatUnit, number][] = [
    [MINUTE, "second", SECOND],
    [HOUR, "minute", MINUTE],
    [DAY, "hour", HOUR],
    [WEEK, "day", DAY],
    [MONTH, "week", WEEK],
    [YEAR, "month", MONTH],
  ];
  for (const [limit, unit, size] of steps) {
    if (abs < limit) {
      return { value: unit === "second" ? 0 : sign * Math.floor(abs / size), unit };
    }
  }
  return { value: sign * Math.floor(abs / YEAR), unit: "year" };
}

/**
 * Describes how long ago a date was: "now", "5 minutes ago", "yesterday", "3 days ago", "2 weeks ago", "3 months ago".
 *
 * @param date - The moment to describe.
 * @param now - The current time (passed in so the result is testable).
 * @param locale - App language.
 * @returns The phrase in that language.
 * @example
 * formatRelativeTime(new Date("2026-10-09"), new Date("2026-10-12"), "en"); // "3 days ago"
 */
export function formatRelativeTime(date: Date, now: Date, locale: DateLocale): string {
  const { value, unit } = amountAndUnit(now.getTime() - date.getTime());
  return new Intl.RelativeTimeFormat(intlTag(locale), { numeric: "auto" }).format(value, unit);
}

/**
 * Formats a date as a month name and a year ("مارس 2026", "March 2026").
 *
 * @param date - The date.
 * @param locale - App language.
 * @returns The month and year.
 */
export function formatMonthYear(date: Date, locale: DateLocale): string {
  return new Intl.DateTimeFormat(intlTag(locale), { month: "long", year: "numeric", timeZone: "UTC" }).format(
    date,
  );
}

/**
 * Formats a date as a day and a month name ("3 أكتوبر", "3 October"), adding the year when it is not the current one.
 *
 * @param date - The date.
 * @param now - The current time (passed in so the result is testable).
 * @param locale - App language.
 * @returns The short date.
 */
export function formatShortDate(date: Date, now: Date, locale: DateLocale): string {
  const sameYear = date.getUTCFullYear() === now.getUTCFullYear();
  return new Intl.DateTimeFormat(intlTag(locale), {
    day: "numeric",
    month: "long",
    ...(sameYear ? {} : { year: "numeric" }),
    timeZone: "UTC",
  }).format(date);
}
