import { describe, expect, it } from "vitest";
import { CURVE_FLAT_TOLERANCE_MM } from "../constants/dimensions";
import { arcToCubics, cubicSeg, lineSeg, pt } from "../geometry";
import { edgeCurve } from "./edge-curve";

/** Radius of the test arc, in mm. */
const ARC_RADIUS_MM = 300;
/** Sweep of the test arc, in radians (a quarter turn). */
const ARC_SWEEP_RAD = Math.PI / 2;

describe("edgeCurve", () => {
  it("calls a straight line straight", () => {
    expect(edgeCurve([lineSeg(pt(0, 0), pt(100, 0))])).toBeUndefined();
  });

  it("calls a run of lines with a corner straight, because no segment is a curve", () => {
    expect(edgeCurve([lineSeg(pt(0, 0), pt(100, 0)), lineSeg(pt(100, 0), pt(100, 80))])).toBeUndefined();
  });

  it("calls a Bézier drawn flat straight", () => {
    const flat = cubicSeg(pt(0, 0), pt(30, 0.1), pt(60, 0.1), pt(100, 0));
    expect(edgeCurve([flat])).toBeUndefined();
  });

  it("measures the depth of a bow against its chord", () => {
    const bow = cubicSeg(pt(0, 0), pt(0, 40), pt(100, 40), pt(100, 0));
    const curve = edgeCurve([bow])!;
    expect(curve.depthMm).toBeCloseTo(30, 1);
    expect(curve.depthMm).toBeGreaterThan(CURVE_FLAT_TOLERANCE_MM);
    expect(curve.deepest.x).toBeCloseTo(50, 0);
    expect(curve.foot!.x).toBeCloseTo(50, 0);
    expect(curve.foot!.y).toBeCloseTo(0, 6);
  });

  it("finds the radius of a true circular arc and its sagitta as the depth", () => {
    const arc = arcToCubics({ center: pt(0, 0), radiusMm: ARC_RADIUS_MM, fromRad: 0, toRad: ARC_SWEEP_RAD });
    const curve = edgeCurve(arc)!;
    const chordMm = 2 * ARC_RADIUS_MM * Math.sin(ARC_SWEEP_RAD / 2);
    const sagittaMm = ARC_RADIUS_MM * (1 - Math.cos(ARC_SWEEP_RAD / 2));
    expect(chordMm).toBeGreaterThan(0);
    expect(curve.depthMm).toBeCloseTo(sagittaMm, 0);
    expect(curve.radiusMm).toBeCloseTo(ARC_RADIUS_MM, 0);
  });

  it("gives a depth but no radius for an S curve, which is not one arc", () => {
    const s = [
      cubicSeg(pt(0, 0), pt(30, 40), pt(60, 40), pt(100, 10)),
      cubicSeg(pt(100, 10), pt(140, -20), pt(170, -20), pt(200, 0)),
    ];
    const curve = edgeCurve(s)!;
    expect(curve.depthMm).toBeGreaterThan(CURVE_FLAT_TOLERANCE_MM);
    expect(curve.radiusMm).toBeUndefined();
  });

  it("has a depth but no chord or radius for a closed edge", () => {
    const loop = [
      cubicSeg(pt(0, 0), pt(0, 60), pt(60, 60), pt(60, 0)),
      cubicSeg(pt(60, 0), pt(60, -60), pt(0, -60), pt(0, 0)),
    ];
    const curve = edgeCurve(loop)!;
    expect(curve.depthMm).toBeGreaterThan(CURVE_FLAT_TOLERANCE_MM);
    expect(curve.foot).toBeUndefined();
    expect(curve.radiusMm).toBeUndefined();
  });

  it("is the same whichever way the edge is walked", () => {
    const bow = cubicSeg(pt(0, 0), pt(0, 40), pt(100, 40), pt(100, 0));
    const reversed = cubicSeg(pt(100, 0), pt(100, 40), pt(0, 40), pt(0, 0));
    expect(edgeCurve([reversed])!.depthMm).toBeCloseTo(edgeCurve([bow])!.depthMm, 6);
  });

  it("says nothing for an empty edge", () => {
    expect(edgeCurve([])).toBeUndefined();
  });
});
