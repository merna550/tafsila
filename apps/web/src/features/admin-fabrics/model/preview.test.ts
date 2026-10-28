import { DRAFT_CATALOGUE, DRAFT_RULES } from "@tafsila/fabric-kb";
import type { FabricRule } from "@tafsila/schemas";
import { describe, expect, it } from "vitest";
import { applyDraftFabric, applyDraftRule, previewRule } from "./preview";
import { DEFAULT_PREVIEW_DESIGN, PREVIEW_DESIGNS } from "./preview-designs";

/** A decisive rule that no real fabric of the catalogue can satisfy except the very sheer ones. */
const strictRule: FabricRule = {
  id: "preview-draft",
  when: [{ path: "category", op: "in", values: ["dress"] }],
  effect: { property: "weight", max: 0, strength: "must" },
  priority: 5,
  reason: { ar: "س", en: "r" },
};

describe("preview", () => {
  it("replaces a rule with the same id and appends a new one", () => {
    const first = DRAFT_RULES[0] as FabricRule;
    const replaced = applyDraftRule(DRAFT_RULES, { ...first, priority: 1 });
    expect(replaced).toHaveLength(DRAFT_RULES.length);
    expect(replaced.find((r) => r.id === first.id)?.priority).toBe(1);
    expect(applyDraftRule(DRAFT_RULES, strictRule)).toHaveLength(DRAFT_RULES.length + 1);
  });

  it("replaces a fabric with the same id and appends a new one", () => {
    const first = DRAFT_CATALOGUE[0]!;
    expect(applyDraftFabric(DRAFT_CATALOGUE, { ...first, nameEn: "Renamed" })[0]?.nameEn).toBe("Renamed");
    expect(applyDraftFabric(DRAFT_CATALOGUE, { ...first, id: "new-one" })).toHaveLength(
      DRAFT_CATALOGUE.length + 1,
    );
  });

  it("shows the effect of an unsaved edit without changing the saved rules", () => {
    const preview = previewRule(DEFAULT_PREVIEW_DESIGN.spec, DRAFT_CATALOGUE, DRAFT_RULES, strictRule);
    expect(preview.changed).toBe(true);
    expect(preview.after.avoid.length).toBeGreaterThan(preview.before.avoid.length);
    expect(DRAFT_RULES.some((r) => r.id === strictRule.id)).toBe(false);
  });

  it("reports no change when the edit does not apply to the design", () => {
    const blouseOnly: FabricRule = {
      ...strictRule,
      when: [{ path: "category", op: "in", values: ["blouse"] }],
    };
    const dress = PREVIEW_DESIGNS.find((d) => d.spec.category === "dress")!;
    expect(previewRule(dress.spec, DRAFT_CATALOGUE, DRAFT_RULES, blouseOnly).changed).toBe(false);
  });

  it("offers designs of the three categories the rules cover", () => {
    expect(new Set(PREVIEW_DESIGNS.map((d) => d.spec.category))).toEqual(
      new Set(["dress", "skirt", "blouse"]),
    );
  });
});
