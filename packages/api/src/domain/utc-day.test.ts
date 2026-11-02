import { expect, it } from "vitest";
import { utcDayStart } from "./utc-day";

it("starts the day at 00:00 UTC, whatever the time of day", () => {
  expect(utcDayStart(new Date("2026-11-01T23:59:59.999Z")).toISOString()).toBe("2026-11-01T00:00:00.000Z");
  expect(utcDayStart(new Date("2026-11-01T00:00:00.000Z")).toISOString()).toBe("2026-11-01T00:00:00.000Z");
});
