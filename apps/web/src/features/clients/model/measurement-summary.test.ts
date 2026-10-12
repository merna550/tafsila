import { sizeM } from "@tafsila/test-fixtures";
import { describe, expect, it } from "vitest";
import { KEY_FIELDS, mmToCm, toKeyValues } from "./measurement-summary";

describe("mmToCm", () => {
  it.each([
    [920, "92"],
    [925, "92.5"],
    [923, "92.3"],
    [1620, "162"],
  ])("turns %i mm into %s cm", (mm, expected) => {
    expect(mmToCm(mm)).toBe(expected);
  });
});

describe("toKeyValues", () => {
  it("returns the six key values in card order", () => {
    const values = toKeyValues(sizeM);
    expect(values.map((value) => value.field)).toEqual([...KEY_FIELDS]);
    expect(values[0]?.cm).toBe(mmToCm(sizeM.bust));
  });

  it("leaves out a missing value instead of showing NaN", () => {
    const rest: Partial<typeof sizeM> = { ...sizeM };
    delete rest.bust;
    expect(toKeyValues(rest).map((value) => value.field)).not.toContain("bust");
  });
});
