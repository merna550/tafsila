import { describe, expect, it } from "vitest";
import { fabricLengthM, rowCount } from "./length";

const plain = { shrinkagePercent: 0, patternRepeatMm: 0 };

describe("fabricLengthM", () => {
  it("adds shrinkage and rounds up to 0.1 m", () => {
    // 1230 mm + 5 % = 1291.5 mm, rounded up to 1.3 m
    expect(fabricLengthM(1230, { shrinkagePercent: 5, patternRepeatMm: 0 }, 1)).toBeCloseTo(1.3, 9);
  });

  it("keeps an exact step on that step", () => {
    expect(fabricLengthM(1000, plain, 1)).toBe(1);
    expect(fabricLengthM(1000.005, plain, 1)).toBe(1);
    expect(fabricLengthM(1000.02, plain, 1)).toBeCloseTo(1.1, 9);
  });

  it("adds one repeat per row before rounding", () => {
    // 1000 + 50 (5 %) + 2 × 200 = 1450 mm → 1.5 m
    expect(fabricLengthM(1000, { shrinkagePercent: 5, patternRepeatMm: 200 }, 2)).toBe(1.5);
    expect(fabricLengthM(1000, { shrinkagePercent: 0, patternRepeatMm: 200 }, 0)).toBe(1);
  });

  it("is 0 for an empty strip", () => {
    expect(fabricLengthM(0, { shrinkagePercent: 5, patternRepeatMm: 0 }, 0)).toBe(0);
  });
});

describe("rowCount", () => {
  it("joins overlapping bands into one row", () => {
    expect(
      rowCount([
        [0, 500],
        [400, 900],
        [1000, 1200],
      ]),
    ).toBe(2);
  });

  it("counts touching bands as two rows and ignores empty bands", () => {
    expect(
      rowCount([
        [500, 900],
        [0, 500],
        [3, 3],
      ]),
    ).toBe(2);
    expect(rowCount([])).toBe(0);
  });
});
