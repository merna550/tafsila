import { describe, expect, it } from "vitest";
import { conditionFor, toggleValue } from "./condition-builder";
import {
  EMPTY_RULE_FORM,
  PREVIEW_RULE_ID,
  draftToRule,
  ruleFormSchema,
  ruleToDraft,
  toCreateRuleBody,
  toUpdateRuleBody,
} from "./rule-form";

/** A rule as the admin API returns it. */
const stored = {
  id: "circle-drape",
  when: [{ path: "skirt.type", op: "in" as const, values: ["circle-half"] }],
  effect: { property: "drape" as const, min: 3, strength: "must" as const },
  priority: 4,
  reason: { ar: "ينسدل", en: "Drapes" },
  isDraft: false,
  updatedAt: "2026-10-28T10:00:00.000Z",
  updatedBy: null,
};

describe("rule form", () => {
  it("round-trips a stored rule through the draft and the create body", () => {
    const draft = ruleToDraft(stored);
    expect(draft.values.reviewed).toBe(true);
    expect(toCreateRuleBody(draft)).toEqual({
      id: "circle-drape",
      when: stored.when,
      effect: stored.effect,
      priority: 4,
      reason: stored.reason,
      isDraft: false,
    });
    expect(toUpdateRuleBody(draft)).not.toHaveProperty("id");
  });

  it("leaves out a bound that is null", () => {
    const draft = ruleToDraft(stored);
    const body = toCreateRuleBody({ ...draft, values: { ...draft.values, min: null, max: 2 } });
    expect(body.effect).toEqual({ property: "drape", strength: "must", max: 2 });
  });

  it("needs a bound and keeps the minimum below the maximum", () => {
    const base = { ...ruleToDraft(stored).values };
    const none = ruleFormSchema.safeParse({ ...base, min: null, max: null });
    expect(none.success ? [] : none.error.issues.map((i) => i.message)).toContain("boundRequired");
    const crossed = ruleFormSchema.safeParse({ ...base, min: 3, max: 1 });
    expect(crossed.success ? [] : crossed.error.issues.map((i) => i.message)).toContain("boundOrder");
  });

  it("rejects an out-of-range value and a priority of 6", () => {
    const base = ruleToDraft(stored).values;
    expect(ruleFormSchema.safeParse({ ...base, min: 7 }).success).toBe(false);
    expect(ruleFormSchema.safeParse({ ...base, priority: 6 }).success).toBe(false);
  });

  it("builds the preview rule only from a valid draft with complete conditions", () => {
    const values = { ...EMPTY_RULE_FORM, reasonAr: "س", reasonEn: "r" };
    const open = { values, conditions: [conditionFor("skirt.type")] };
    expect(draftToRule(open)).toBeUndefined();
    const done = { values, conditions: [toggleValue(conditionFor("skirt.type"), "pleated")] };
    expect(draftToRule(done)?.id).toBe(PREVIEW_RULE_ID);
    expect(draftToRule({ ...done, values: { ...values, reasonEn: "" } })).toBeUndefined();
  });
});
