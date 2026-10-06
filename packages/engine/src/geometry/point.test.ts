import { describe, expect, it } from "vitest";
import { sampleCubic } from "./bezier";
import { distance, polylineLength, pt } from "./point";

describe("geometry", () => {
  it("measures straight distances", () => {
    expect(distance(pt(0, 0), pt(30, 40))).toBe(50);
  });

  it("measures a polyline as the sum of its segments", () => {
    expect(polylineLength([pt(0, 0), pt(10, 0), pt(10, 10)])).toBe(20);
  });

  it("samples a straight Bézier to a line of the same length", () => {
    const line = sampleCubic({ p0: pt(0, 0), p1: pt(10, 0), p2: pt(20, 0), p3: pt(30, 0) });
    expect(polylineLength(line)).toBeCloseTo(30, 6);
  });
});
