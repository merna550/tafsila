import { describe, expect, it } from "vitest";
import { effectBounds, findRule, sortByPriority } from "./rule-view";

describe("rule view", () => {
  it("sorts the decisive rules first, then by id, without changing the input", () => {
    const rules = [
      { id: "b", priority: 2 },
      { id: "a", priority: 2 },
      { id: "c", priority: 5 },
    ];
    expect(sortByPriority(rules).map((r) => r.id)).toEqual(["c", "a", "b"]);
    expect(rules.map((r) => r.id)).toEqual(["b", "a", "c"]);
  });

  it("shows bounds on the 1 to 5 scale", () => {
    expect(effectBounds({ property: "drape", min: 3, strength: "must" })).toEqual([
      { kind: "min", shown: 4 },
    ]);
    expect(effectBounds({ property: "drape", min: 0, max: 2, strength: "prefer" })).toEqual([
      { kind: "min", shown: 1 },
      { kind: "max", shown: 3 },
    ]);
  });

  it("finds a rule by id", () => {
    const rule = { id: "x" } as Parameters<typeof findRule>[0][number];
    expect(findRule([rule], "x")).toBe(rule);
    expect(findRule([rule], "y")).toBeUndefined();
  });
});
