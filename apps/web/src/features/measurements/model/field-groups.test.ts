import { measurementsSchema } from "@tafsila/schemas";
import { describe, expect, it } from "vitest";
import { ALL_FIELDS, FIELD_GROUPS, isOptionalField } from "./field-groups";

describe("FIELD_GROUPS", () => {
  it("covers every key of measurementsSchema exactly once", () => {
    const keys = Object.keys(measurementsSchema.shape).filter((key) => key !== "unit");
    const byName = (a: string, b: string): number => a.localeCompare(b);
    expect(ALL_FIELDS.toSorted(byName)).toEqual(keys.toSorted(byName));
    expect(new Set(ALL_FIELDS).size).toBe(ALL_FIELDS.length);
  });

  it("has the 9 / 3 / 6 split of the design", () => {
    expect(FIELD_GROUPS.map((group) => group.fields.length)).toEqual([9, 3, 6]);
  });

  it("marks only underBust optional", () => {
    expect(ALL_FIELDS.filter(isOptionalField)).toEqual(["underBust"]);
  });
});
