import { FABRIC_LEVEL } from "@tafsila/schemas";
import { describe, expect, it } from "vitest";
import { MESSAGES } from "@/shared/i18n/testing";
import { METER_STEPS, propertyRows, SHOWN_PROPERTIES } from "./property-labels";

const PROPS = { drape: 4, weight: 2, body: 1, stretch: 0, sheen: 3 };

describe("propertyRows", () => {
  it("lists the shown properties in screen order, without stretch", () => {
    expect(propertyRows(PROPS).map((r) => r.name)).toEqual(["drape", "weight", "body", "sheen"]);
  });

  it("fills level + 1 steps of the five", () => {
    expect(propertyRows(PROPS).map((r) => r.filled)).toEqual([5, 3, 2, 4]);
    expect(METER_STEPS).toBe(5);
  });

  it.each(Object.values(FABRIC_LEVEL))("has a level word in both languages for level %i", (level) => {
    const [row] = propertyRows({ ...PROPS, drape: level });
    for (const lang of ["ar", "en"] as const) {
      const words = MESSAGES[lang].fabric.recommend.levels as Record<string, string>;
      expect(words[row?.levelKey ?? ""]).toBeTruthy();
    }
  });

  it("has a label in both languages for every shown property", () => {
    for (const lang of ["ar", "en"] as const) {
      const labels = MESSAGES[lang].fabric.recommend.properties as Record<string, string>;
      for (const name of SHOWN_PROPERTIES) expect(labels[name]).toBeTruthy();
    }
  });
});
