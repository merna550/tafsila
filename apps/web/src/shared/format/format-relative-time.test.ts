import { describe, expect, it } from "vitest";
import { formatMonthYear, formatRelativeTime, formatShortDate } from "./format-relative-time";

const NOW = new Date("2026-10-12T12:00:00.000Z");

/**
 * A date a given number of milliseconds before the fixed clock.
 *
 * @param ms - How long before.
 * @returns The date.
 */
const ago = (ms: number): Date => new Date(NOW.getTime() - ms);
const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

describe("formatRelativeTime", () => {
  it.each([
    [10_000, "now"],
    [5 * MINUTE, "5 minutes ago"],
    [3 * HOUR, "3 hours ago"],
    [DAY, "yesterday"],
    [3 * DAY, "3 days ago"],
    [14 * DAY, "2 weeks ago"],
    [95 * DAY, "3 months ago"],
    [800 * DAY, "2 years ago"],
  ])("says %i ms ago in English", (ms, expected) => {
    expect(formatRelativeTime(ago(ms), NOW, "en")).toBe(expected);
  });

  it("says it in Arabic with Western digits", () => {
    expect(formatRelativeTime(ago(DAY), NOW, "ar")).toBe("أمس");
    const threeDays = formatRelativeTime(ago(3 * DAY), NOW, "ar");
    expect(threeDays).toContain("3");
    expect(threeDays).not.toMatch(/[٠-٩]/);
    expect(formatRelativeTime(ago(14 * DAY), NOW, "ar")).toBe("قبل أسبوعين");
  });

  it("treats a date slightly in the future as now", () => {
    expect(formatRelativeTime(new Date(NOW.getTime() + 5_000), NOW, "en")).toBe("now");
  });
});

describe("formatMonthYear", () => {
  it("names the month in both languages with a Western-digit year", () => {
    const march = new Date("2026-03-14T10:00:00.000Z");
    expect(formatMonthYear(march, "en")).toBe("March 2026");
    expect(formatMonthYear(march, "ar")).toBe("مارس 2026");
  });
});

describe("formatShortDate", () => {
  it("writes the day and month with Western digits, without the year in the current year", () => {
    expect(formatShortDate(new Date("2026-10-03T10:00:00.000Z"), NOW, "en")).toBe("October 3");
    expect(formatShortDate(new Date("2026-10-03T10:00:00.000Z"), NOW, "ar")).toBe("3 أكتوبر");
  });

  it("adds the year for another year", () => {
    expect(formatShortDate(new Date("2025-03-20T10:00:00.000Z"), NOW, "en")).toBe("March 20, 2025");
  });
});
