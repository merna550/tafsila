import { describe, expect, it } from "vitest";
import type { CutPlanStep } from "@/shared/pattern-preview";
import { groupHighlights, highlightOf } from "./steps";

const g = (mm: number) => ({ from: { x: 0, y: 0 }, to: { x: mm, y: 0 }, mm });
const step = (
  id: string,
  group: CutPlanStep["group"],
  pointIds: string[],
  guides = [g(10)],
): CutPlanStep => ({
  id,
  no: 1,
  text: { ar: "", en: "" },
  pointIds,
  guides,
  group,
});

describe("highlightOf", () => {
  it("returns the points and guides of one step", () => {
    expect(highlightOf([step("a", "marks", ["A"])])).toEqual({ pointIds: ["A"], guides: [g(10)] });
  });
  it("returns the union of a group, each point once", () => {
    const h = highlightOf([step("a", "corners", ["A", "B"]), step("b", "corners", ["B", "C"], [g(20)])]);
    expect(h.pointIds).toEqual(["A", "B", "C"]);
    expect(h.guides).toHaveLength(2);
  });
});

describe("groupHighlights", () => {
  it("lists only groups with points, in print order", () => {
    const out = groupHighlights([
      step("a", "marks", ["D"]),
      step("b", "corners", ["A"]),
      step("c", "curves", []),
    ]);
    expect(out.map((e) => e.group)).toEqual(["corners", "marks"]);
  });
});
