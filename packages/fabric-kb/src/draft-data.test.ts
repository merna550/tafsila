import { fabricRuleSchema, fabricSchema } from "@tafsila/schemas";
import { describe, expect, it } from "vitest";
import { DRAFT_CATALOGUE } from "./draft-catalogue";
import { DRAFT_RULES } from "./draft-rules";
import { DRAFT } from "./draft-status";

describe("draft catalogue", () => {
  it("is marked DRAFT until Merna reviews it", () => {
    expect(DRAFT).toBe(true);
  });
  it("has valid fabrics with Arabic and English names and care notes", () => {
    for (const f of DRAFT_CATALOGUE) expect(fabricSchema.safeParse(f).success, f.id).toBe(true);
  });
  it("has unique ids and stretch 0 on every woven fabric", () => {
    const ids = DRAFT_CATALOGUE.map((f) => f.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const f of DRAFT_CATALOGUE) expect(f.properties.stretch).toBe(0);
  });
  it("includes the fabrics named in FR-REC-02", () => {
    const names = DRAFT_CATALOGUE.map((f) => f.nameAr);
    for (const n of ["كريب", "شيفون", "جورجيت", "ستان", "كتان", "قطن بوبلين", "فسكوز", "تافتا"]) {
      expect(names).toContain(n);
    }
  });
});

describe("draft rules", () => {
  it("are valid and have unique ids", () => {
    for (const r of DRAFT_RULES) expect(fabricRuleSchema.safeParse(r).success, r.id).toBe(true);
    expect(new Set(DRAFT_RULES.map((r) => r.id)).size).toBe(DRAFT_RULES.length);
  });
});
