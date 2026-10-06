import { describe, expect, it } from "vitest";
import { cmToMm, mmToCm, roundTo } from "./units";

describe("units", () => {
  it("converts centimetres to millimetres and back", () => {
    expect(cmToMm(92)).toBe(920);
    expect(mmToCm(925)).toBe(92.5);
  });

  it("rounds without floating-point noise", () => {
    expect(roundTo(0.1 + 0.2, 2)).toBeCloseTo(0.3, 10);
    expect(roundTo(12.3456, 1)).toBeCloseTo(12.3, 10);
  });
});
