import { describe, expect, it } from "vitest";
import { sampleCubic } from "./bezier";
import {
  add,
  angleRad,
  assertFinitePoint,
  cross,
  distance,
  dot,
  lerp,
  norm,
  normalize,
  perpendicular,
  polylineLength,
  pt,
  samePoint,
  scale,
  sub,
} from "./point";
import { cubicSeg } from "./segment";

describe("point and vector helpers", () => {
  it("measures straight distances", () => {
    expect(distance(pt(0, 0), pt(30, 40))).toBe(50);
    expect(norm(pt(3, 4))).toBe(5);
  });

  it("measures a polyline as the sum of its segments", () => {
    expect(polylineLength([pt(0, 0), pt(10, 0), pt(10, 10)])).toBe(20);
    expect(polylineLength([pt(1, 1)])).toBe(0);
  });

  it("samples a straight Bézier to a line of the same length", () => {
    const line = sampleCubic(cubicSeg(pt(0, 0), pt(10, 0), pt(20, 0), pt(30, 0)));
    expect(polylineLength(line)).toBeCloseTo(30, 6);
  });

  it("does vector arithmetic", () => {
    expect(add(pt(1, 2), pt(3, 4))).toEqual(pt(4, 6));
    expect(sub(pt(1, 2), pt(3, 4))).toEqual(pt(-2, -2));
    expect(scale(pt(1, -2), 3)).toEqual(pt(3, -6));
    expect(dot(pt(1, 0), pt(0, 1))).toBe(0);
    expect(cross(pt(1, 0), pt(0, 1))).toBe(1);
    expect(lerp(pt(0, 0), pt(10, 20), 0.25)).toEqual(pt(2.5, 5));
    expect(perpendicular(pt(1, 0))).toEqual(pt(-0, 1));
    expect(angleRad(pt(0, 1))).toBeCloseTo(Math.PI / 2, 12);
  });

  it("normalises vectors and rejects zero length", () => {
    expect(normalize(pt(3, 4)).x).toBeCloseTo(0.6, 12);
    expect(normalize(pt(3, 4)).y).toBeCloseTo(0.8, 12);
    expect(() => normalize(pt(0, 0))).toThrow(
      expect.objectContaining({ code: "GEOMETRY_DEGENERATE_SEGMENT" }),
    );
  });

  it("compares points within the tolerance", () => {
    expect(samePoint(pt(0, 0), pt(0.005, 0))).toBe(true);
    expect(samePoint(pt(0, 0), pt(0.02, 0))).toBe(false);
    expect(samePoint(pt(0, 0), pt(0.02, 0), 0.05)).toBe(true);
  });

  it("rejects non-finite coordinates", () => {
    expect(() => assertFinitePoint(pt(Number.NaN, 0))).toThrow(
      expect.objectContaining({ code: "GEOMETRY_DEGENERATE_SEGMENT" }),
    );
    expect(() => assertFinitePoint(pt(0, Number.POSITIVE_INFINITY))).toThrow();
    expect(() => assertFinitePoint(pt(1, 2))).not.toThrow();
  });
});
