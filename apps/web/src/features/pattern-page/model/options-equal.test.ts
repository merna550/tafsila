import { defaultSeamAllowanceMm } from "@tafsila/schemas";
import { describe, expect, it } from "vitest";
import type { PatternOptionsValue } from "@/features/pattern-options";
import { optionsEqual } from "./options-equal";

const base: PatternOptionsValue = {
  clientId: "c",
  measurementSetId: "s",
  easeProfile: "regular",
  seamAllowanceMm: defaultSeamAllowanceMm(),
  fabricWidthMm: 1400,
};

describe("optionsEqual", () => {
  it("is true for equal values and for two nulls", () => {
    expect(optionsEqual(base, { ...base, seamAllowanceMm: { ...base.seamAllowanceMm } })).toBe(true);
    expect(optionsEqual(null, null)).toBe(true);
  });
  it("is false when one field or one allowance differs", () => {
    expect(optionsEqual(base, { ...base, easeProfile: "loose" })).toBe(false);
    expect(optionsEqual(base, { ...base, seamAllowanceMm: { ...base.seamAllowanceMm, hem: 99 } })).toBe(
      false,
    );
    expect(optionsEqual(base, null)).toBe(false);
  });
});
