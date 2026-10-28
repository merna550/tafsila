import { describe, expect, it } from "vitest";
import { sortShapes } from "./orders";
import { rectShape } from "./test-support/shapes";

const shapes = [
  rectShape({ id: "b#1", lengthMm: 100, widthMm: 300 }),
  rectShape({ id: "a#1", lengthMm: 300, widthMm: 100 }),
  rectShape({ id: "c#1", lengthMm: 200, widthMm: 200 }),
];

describe("sortShapes", () => {
  it("sorts by area, largest first, ties by id", () => {
    expect(sortShapes(shapes, "area").map((s) => s.id)).toEqual(["c#1", "a#1", "b#1"]);
  });

  it("sorts by width across the fabric", () => {
    expect(sortShapes(shapes, "width").map((s) => s.id)).toEqual(["b#1", "c#1", "a#1"]);
  });

  it("sorts by length along the grain", () => {
    expect(sortShapes(shapes, "length").map((s) => s.id)).toEqual(["a#1", "c#1", "b#1"]);
  });

  it("does not depend on the input order", () => {
    expect(sortShapes([...shapes].reverse(), "area")).toEqual(sortShapes(shapes, "area"));
  });
});
