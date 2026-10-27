import type { FabricRule } from "@tafsila/schemas";
import { describe, expect, it } from "vitest";
import { DRAFT_RULES } from "./draft-rules";
import { assertValidRules, ruleProblems } from "./validate-rules";

const base: FabricRule = {
  id: "t",
  when: [{ path: "skirt.type", op: "in", values: ["circle-half"] }],
  effect: { property: "drape", min: 2, strength: "must" },
  priority: 3,
  reason: { ar: "س", en: "r" },
};
const withWhen = (when: FabricRule["when"]): FabricRule => ({ ...base, when });

describe("ruleProblems", () => {
  it("accepts a valid rule", () => {
    expect(ruleProblems(base)).toEqual([]);
  });
  it("fails on an unknown path", () => {
    expect(ruleProblems(withWhen([{ path: "skirt.typ", op: "in", values: ["circle-half"] }]))).toHaveLength(
      1,
    );
  });
  it("fails on an unknown value", () => {
    expect(ruleProblems(withWhen([{ path: "skirt.type", op: "in", values: ["spiral"] }]))[0]).toContain(
      "spiral",
    );
  });
  it("fails when in has no values, a flag gets in, or a non-flag gets is-true", () => {
    expect(ruleProblems(withWhen([{ path: "skirt.type", op: "in" }]))).toHaveLength(1);
    expect(ruleProblems(withWhen([{ path: "lining", op: "in", values: ["x"] }]))).toHaveLength(1);
    expect(ruleProblems(withWhen([{ path: "skirt.type", op: "is-true" }]))).toHaveLength(1);
  });
});

describe("assertValidRules", () => {
  it("throws listing every problem", () => {
    expect(() => assertValidRules([withWhen([{ path: "nope", op: "in", values: ["a"] }])])).toThrow(
      /unknown path/,
    );
  });
  it("passes for every draft rule", () => {
    expect(() => assertValidRules(DRAFT_RULES)).not.toThrow();
  });
});
