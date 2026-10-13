import { demoSizeChart, sizeM } from "@tafsila/test-fixtures";
import { describe, expect, it } from "vitest";
import { ALL_FIELDS } from "./field-groups";
import { diffFromSize, resetField } from "./overrides";

describe("diffFromSize", () => {
  it("is empty when nothing changed", () => {
    expect(diffFromSize(demoSizeChart, "M", sizeM)).toEqual([]);
  });

  it("lists the changed field", () => {
    expect(diffFromSize(demoSizeChart, "M", { ...sizeM, waist: 750 })).toEqual(["waist"]);
  });

  it("marks a field the size has but the set lacks", () => {
    const rest: Partial<typeof sizeM> = { ...sizeM };
    delete rest.underBust;
    expect(diffFromSize(demoSizeChart, "M", rest)).toEqual(["underBust"]);
  });

  it("marks every field for an unknown size", () => {
    expect(diffFromSize(demoSizeChart, "XXXL", sizeM)).toEqual(ALL_FIELDS);
  });
});

describe("resetField", () => {
  it("puts the size's value back", () => {
    expect(resetField(demoSizeChart, "M", { ...sizeM, waist: 750 }, "waist").waist).toBe(sizeM.waist);
  });

  it("leaves values alone for an unknown size", () => {
    const values = { ...sizeM, waist: 750 };
    expect(resetField(demoSizeChart, "nope", values, "waist")).toBe(values);
  });
});
