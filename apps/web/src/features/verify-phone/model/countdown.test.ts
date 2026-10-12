import { describe, expect, it } from "vitest";
import { formatCountdown, secondsLeft } from "./countdown";

describe("secondsLeft", () => {
  it("rounds up so the last second still shows 1", () => {
    expect(secondsLeft(60_000, 0)).toBe(60);
    expect(secondsLeft(60_000, 59_001)).toBe(1);
  });

  it("is zero at the deadline and never negative afterwards", () => {
    expect(secondsLeft(60_000, 60_000)).toBe(0);
    expect(secondsLeft(60_000, 90_000)).toBe(0);
  });
});

describe("formatCountdown", () => {
  it.each([
    [42, "0:42"],
    [60, "1:00"],
    [5, "0:05"],
    [0, "0:00"],
  ])("formats %i seconds as %s", (seconds, text) => {
    expect(formatCountdown(seconds)).toBe(text);
  });
});
