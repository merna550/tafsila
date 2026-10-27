import { describe, expect, it } from "vitest";
import { fabricRuleSchema, fabricSchema } from "./fabric";

const fabric = {
  id: "crepe",
  nameAr: "كريب",
  nameEn: "Crepe",
  properties: { drape: 3, weight: 2, body: 2, stretch: 0, sheen: 1 },
  careNotes: { ar: "غسيل لطيف", en: "Gentle wash" },
};
const rule = {
  id: "r-1",
  when: [{ path: "skirt.type", op: "in", values: ["circle-half"] }],
  effect: { property: "drape", min: 2, strength: "must" },
  priority: 3,
  reason: { ar: "سبب", en: "Reason" },
};

describe("fabricSchema", () => {
  it("accepts a valid fabric", () => {
    expect(fabricSchema.safeParse(fabric).success).toBe(true);
  });
  it("rejects a property above 4", () => {
    expect(
      fabricSchema.safeParse({ ...fabric, properties: { ...fabric.properties, drape: 5 } }).success,
    ).toBe(false);
  });
  it("rejects a missing Arabic name", () => {
    expect(fabricSchema.safeParse({ ...fabric, nameAr: "" }).success).toBe(false);
  });
  it("rejects an id that is not kebab-case", () => {
    expect(fabricSchema.safeParse({ ...fabric, id: "Crepe A" }).success).toBe(false);
  });
});

describe("fabricRuleSchema", () => {
  it("accepts a valid rule", () => {
    expect(fabricRuleSchema.safeParse(rule).success).toBe(true);
  });
  it("rejects empty conditions", () => {
    expect(fabricRuleSchema.safeParse({ ...rule, when: [] }).success).toBe(false);
  });
  it("rejects priority 0", () => {
    expect(fabricRuleSchema.safeParse({ ...rule, priority: 0 }).success).toBe(false);
  });
  it("rejects an effect without min or max, and min above max", () => {
    expect(
      fabricRuleSchema.safeParse({ ...rule, effect: { property: "drape", strength: "must" } }).success,
    ).toBe(false);
    expect(
      fabricRuleSchema.safeParse({ ...rule, effect: { property: "drape", min: 3, max: 1, strength: "must" } })
        .success,
    ).toBe(false);
  });
});
