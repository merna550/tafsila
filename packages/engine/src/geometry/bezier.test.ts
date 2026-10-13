import { describe, expect, it } from "vitest";
import {
  cubicLength,
  curveThroughPoints,
  derivativeOnCubic,
  pointOnCubic,
  splitCubic,
  tAtLength,
  tangentOnCubic,
} from "./bezier";
import { distance, pt } from "./point";
import { cubicSeg } from "./segment";

/** Control-point distance that makes a cubic approximate a quarter circle. */
const KAPPA = 0.5523;
const R = 100;
const quarter = cubicSeg(pt(R, 0), pt(R, KAPPA * R), pt(KAPPA * R, R), pt(0, R));
const straight = cubicSeg(pt(0, 0), pt(10, 0), pt(20, 0), pt(30, 0));

describe("cubic Bézier helpers", () => {
  it("measures a straight cubic exactly", () => {
    expect(cubicLength(straight)).toBeCloseTo(30, 2);
  });

  it("measures a quarter circle to within 0.03 %", () => {
    const exact = (Math.PI * R) / 2;
    expect(Math.abs(cubicLength(quarter) - exact) / exact).toBeLessThan(0.0003);
  });

  it("has ends at its end points and a derivative of 3 × the first leg", () => {
    expect(pointOnCubic(quarter, 0)).toEqual(pt(R, 0));
    expect(pointOnCubic(quarter, 1)).toEqual(pt(0, R));
    expect(derivativeOnCubic(quarter, 0)).toEqual(pt(0, 3 * KAPPA * R));
  });

  it("gives unit tangents, also where a control point sits on an end", () => {
    const t = tangentOnCubic(quarter, 0);
    expect(t.x).toBeCloseTo(0, 12);
    expect(t.y).toBeCloseTo(1, 12);
    const pinched = cubicSeg(pt(0, 0), pt(0, 0), pt(10, 0), pt(20, 0));
    const start = tangentOnCubic(pinched, 0);
    expect(start.x).toBeCloseTo(1, 6);
    expect(start.y).toBeCloseTo(0, 6);
  });

  it("splits into two halves that meet and keep the length", () => {
    const [left, right] = splitCubic(quarter, 0.3);
    expect(left.to).toEqual(right.from);
    expect(distance(left.to, pointOnCubic(quarter, 0.3))).toBeLessThan(1e-9);
    expect(cubicLength(left) + cubicLength(right)).toBeCloseTo(cubicLength(quarter), 2);
  });

  it("finds the parameter at a length", () => {
    expect(tAtLength(straight, 15)).toBeCloseTo(0.5, 3);
    expect(tAtLength(straight, 0)).toBe(0);
    expect(tAtLength(straight, 30)).toBe(1);
    const half = cubicLength(quarter) / 2;
    expect(cubicLength(splitCubic(quarter, tAtLength(quarter, half))[0])).toBeCloseTo(half, 2);
    expect(() => tAtLength(straight, 31)).toThrow(
      expect.objectContaining({ code: "GEOMETRY_LENGTH_OUT_OF_RANGE" }),
    );
    expect(() => tAtLength(straight, -1)).toThrow(
      expect.objectContaining({ code: "GEOMETRY_LENGTH_OUT_OF_RANGE" }),
    );
  });

  it("draws a curve through points with the given end directions", () => {
    const points = [pt(0, 0), pt(50, 20), pt(100, 0)];
    const curves = curveThroughPoints(points, pt(1, 1), pt(1, -1));
    expect(curves).toHaveLength(2);
    expect(curves[0]!.from).toEqual(points[0]);
    expect(curves[0]!.to).toEqual(points[1]);
    expect(curves[1]!.to).toEqual(points[2]);
    const start = tangentOnCubic(curves[0]!, 0);
    expect(start.x).toBeCloseTo(Math.SQRT1_2, 9);
    expect(start.y).toBeCloseTo(Math.SQRT1_2, 9);
    const end = tangentOnCubic(curves[1]!, 1);
    expect(end.y).toBeCloseTo(-Math.SQRT1_2, 9);
    // Smooth at the inner point: both sides share the Catmull-Rom tangent (parallel to p2 − p0).
    const inLeft = tangentOnCubic(curves[0]!, 1);
    const outRight = tangentOnCubic(curves[1]!, 0);
    expect(inLeft.x).toBeCloseTo(outRight.x, 9);
    expect(inLeft.y).toBeCloseTo(0, 9);
  });

  it("rejects too few or repeated points and zero tangents", () => {
    const code = { code: "GEOMETRY_DEGENERATE_SEGMENT" };
    expect(() => curveThroughPoints([pt(0, 0)], pt(1, 0), pt(1, 0))).toThrow(expect.objectContaining(code));
    expect(() => curveThroughPoints([pt(0, 0), pt(0, 0)], pt(1, 0), pt(1, 0))).toThrow(
      expect.objectContaining(code),
    );
    expect(() => curveThroughPoints([pt(0, 0), pt(9, 0)], pt(0, 0), pt(1, 0))).toThrow(
      expect.objectContaining(code),
    );
  });
});
