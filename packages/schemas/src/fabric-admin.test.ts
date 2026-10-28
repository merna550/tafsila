import { describe, expect, it } from "vitest";
import {
  createFabricInputSchema,
  createFabricRuleInputSchema,
  updateFabricInputSchema,
  updateFabricRuleInputSchema,
} from "./fabric-admin";

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

describe("admin fabric inputs", () => {
  it("defaults isDraft to false on create", () => {
    expect(createFabricInputSchema.parse(fabric).isDraft).toBe(false);
    expect(createFabricRuleInputSchema.parse(rule).isDraft).toBe(false);
  });
  it("rejects an empty patch", () => {
    expect(updateFabricInputSchema.safeParse({}).success).toBe(false);
    expect(updateFabricRuleInputSchema.safeParse({}).success).toBe(false);
  });
  it("accepts a one-field patch and ignores the id", () => {
    expect(updateFabricInputSchema.parse({ nameEn: "Crêpe", id: "x" })).toEqual({ nameEn: "Crêpe" });
    expect(updateFabricRuleInputSchema.parse({ priority: 5 })).toEqual({ priority: 5 });
  });
});
