import { describe, expect, it } from "vitest";
import { DEFAULT_FABRIC_OPTIONS, FABRIC_WIDTH_PRESETS_MM, fabricOptionsSchema } from "./fabric-options";

describe("fabricOptionsSchema", () => {
  it("fills every default from an empty object", () => {
    expect(fabricOptionsSchema.parse({})).toEqual({
      widthMm: 1400,
      layout: "folded",
      directionalNap: false,
      shrinkagePercent: 5,
      patternRepeatMm: 0,
    });
  });
  it("exports the defaults as a constant", () => {
    expect(DEFAULT_FABRIC_OPTIONS).toEqual(fabricOptionsSchema.parse({}));
  });
  it("accepts every preset width", () => {
    for (const widthMm of FABRIC_WIDTH_PRESETS_MM) {
      expect(fabricOptionsSchema.safeParse({ widthMm }).success).toBe(true);
    }
  });
  it("accepts a custom width inside the limits", () => {
    expect(fabricOptionsSchema.parse({ widthMm: 1450 }).widthMm).toBe(1450);
  });
  it("rejects a width below the limit", () => {
    expect(fabricOptionsSchema.safeParse({ widthMm: 400 }).success).toBe(false);
  });
  it("rejects a shrinkage above 20 %", () => {
    expect(fabricOptionsSchema.safeParse({ shrinkagePercent: 25 }).success).toBe(false);
  });
  it("rejects a negative pattern repeat", () => {
    expect(fabricOptionsSchema.safeParse({ patternRepeatMm: -1 }).success).toBe(false);
  });
  it("rejects an unknown layout", () => {
    expect(fabricOptionsSchema.safeParse({ layout: "double" }).success).toBe(false);
  });
});
