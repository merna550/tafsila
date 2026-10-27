import { halfCircleKneeSkirt, linedCircleSkirt, dartedBlouse } from "@tafsila/test-fixtures";
import type { RuleCondition } from "@tafsila/schemas";
import { describe, expect, it } from "vitest";
import { conditionMatches, readPath, ruleMatches } from "./conditions";

describe("readPath", () => {
  it("reads nested values and returns undefined for absent parts", () => {
    expect(readPath(halfCircleKneeSkirt, "skirt.type")).toBe("circle-half");
    expect(readPath(dartedBlouse, "skirt.type")).toBeUndefined();
    expect(readPath(dartedBlouse, "category.x")).toBeUndefined();
  });
});

describe("conditionMatches", () => {
  const circle: RuleCondition = { path: "skirt.type", op: "in", values: ["circle-half", "circle-full"] };
  it("in", () => {
    expect(conditionMatches(halfCircleKneeSkirt, circle)).toBe(true);
    expect(conditionMatches(halfCircleKneeSkirt, { ...circle, values: ["pleated"] })).toBe(false);
  });
  it("not-in", () => {
    expect(conditionMatches(halfCircleKneeSkirt, { ...circle, op: "not-in" })).toBe(false);
    expect(conditionMatches(halfCircleKneeSkirt, { ...circle, op: "not-in", values: ["pleated"] })).toBe(
      true,
    );
  });
  it("is-true", () => {
    expect(conditionMatches(linedCircleSkirt, { path: "lining", op: "is-true" })).toBe(true);
    expect(conditionMatches(halfCircleKneeSkirt, { path: "lining", op: "is-true" })).toBe(false);
  });
  it("an absent value never matches, not even not-in, and does not throw", () => {
    expect(conditionMatches(dartedBlouse, circle)).toBe(false);
    expect(conditionMatches(dartedBlouse, { ...circle, op: "not-in" })).toBe(false);
  });
  it("matches pocket lists by any entry (in) or none (not-in)", () => {
    const pockets: RuleCondition = { path: "pockets", op: "in", values: ["side-seam"] };
    expect(conditionMatches(linedCircleSkirt, pockets)).toBe(true);
    expect(conditionMatches(halfCircleKneeSkirt, pockets)).toBe(false);
    expect(conditionMatches(halfCircleKneeSkirt, { ...pockets, op: "not-in" })).toBe(true);
  });
});

describe("ruleMatches", () => {
  it("needs every condition to hold", () => {
    const a: RuleCondition = { path: "skirt.type", op: "in", values: ["circle-half"] };
    const b: RuleCondition = { path: "lining", op: "is-true" };
    expect(ruleMatches(linedCircleSkirt, [a, b])).toBe(true);
    expect(ruleMatches(halfCircleKneeSkirt, [a, b])).toBe(false);
  });
});
