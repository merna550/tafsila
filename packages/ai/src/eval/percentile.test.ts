/** Percentile tests (issue #338): nearest-rank on known lists. */
import { describe, expect, it } from "vitest";
import { percentile } from "./percentile";

describe("percentile", () => {
  it("picks the nearest rank of a known list", () => {
    const values = [10, 1, 9, 2, 8, 3, 7, 4, 6, 5, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
    expect(percentile(values, 50)).toBe(10);
    expect(percentile(values, 95)).toBe(19);
    expect(percentile(values, 100)).toBe(20);
    expect(percentile([42], 95)).toBe(42);
  });

  it("returns null for no values and refuses a percentile out of range", () => {
    expect(percentile([], 50)).toBeNull();
    expect(() => percentile([1], 0)).toThrow(RangeError);
    expect(() => percentile([1], 101)).toThrow(RangeError);
  });
});
