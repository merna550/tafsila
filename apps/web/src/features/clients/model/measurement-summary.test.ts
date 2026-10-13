import { sizeM } from "@tafsila/test-fixtures";
import { formatCm } from "@tafsila/utils";
import { describe, expect, it } from "vitest";
import { KEY_FIELDS, toKeyValues } from "./measurement-summary";

describe("toKeyValues", () => {
  it("returns the six key values in card order", () => {
    const values = toKeyValues(sizeM);
    expect(values.map((value) => value.field)).toEqual([...KEY_FIELDS]);
    expect(values[0]?.cm).toBe(formatCm(sizeM.bust));
  });

  it("leaves out a missing value instead of showing NaN", () => {
    const rest: Partial<typeof sizeM> = { ...sizeM };
    delete rest.bust;
    expect(toKeyValues(rest).map((value) => value.field)).not.toContain("bust");
  });
});
