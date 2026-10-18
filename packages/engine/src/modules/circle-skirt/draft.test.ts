/** Key points and radii of the circle-skirt quarter (issue #136). */
import { describe, expect, it } from "vitest";
import { isClosed, pathLength, pointInPolygon, samplePath, selfIntersections, pt } from "../../geometry";
import { expectNear } from "../../test-utils/expect-near";
import { draftCircleQuarter, solveWaistRadiusMm } from "./draft";

/** Finished waist (waist + ease) and length used by the unit tests. */
const WAIST_MM = 760;
const LENGTH_MM = 600;

describe("draftCircleQuarter", () => {
  it("gives a half circle the waist radius W / π", () => {
    const q = draftCircleQuarter({
      type: "circle-half",
      finishedWaistMm: WAIST_MM,
      skirtLengthMm: LENGTH_MM,
    });
    expect(q.waistRadiusMm).toBeCloseTo(WAIST_MM / Math.PI, 1);
    expect(q.sweepRad).toBeCloseTo(Math.PI / 4, 12);
  });

  it("gives a full circle the waist radius W / 2π", () => {
    const q = draftCircleQuarter({
      type: "circle-full",
      finishedWaistMm: WAIST_MM,
      skirtLengthMm: LENGTH_MM,
    });
    expect(q.waistRadiusMm).toBeCloseTo(WAIST_MM / (2 * Math.PI), 1);
    expect(q.hemRadiusMm).toBeCloseTo(q.waistRadiusMm + LENGTH_MM, 9);
  });

  it("draws a quarter of the finished waist on the curve, within 0.01 mm", () => {
    for (const type of ["circle-half", "circle-full"] as const) {
      const q = draftCircleQuarter({ type, finishedWaistMm: WAIST_MM, skirtLengthMm: LENGTH_MM });
      const waist = q.stitchPath.slice(q.runs.waist[0], q.runs.waist[1] + 1);
      expect(Math.abs(pathLength(waist) - WAIST_MM / 4)).toBeLessThanOrEqual(0.01);
    }
  });

  it("puts the waist centre at the origin and the hem centre one length below", () => {
    const q = draftCircleQuarter({
      type: "circle-half",
      finishedWaistMm: WAIST_MM,
      skirtLengthMm: LENGTH_MM,
    });
    expectNear(q.keyPoints["circle.waistCentre"]!, pt(0, 0));
    expectNear(q.keyPoints["circle.hemCentre"]!, pt(0, LENGTH_MM));
  });

  it("makes the full circle's side seam a horizontal radius of one skirt length", () => {
    const q = draftCircleQuarter({
      type: "circle-full",
      finishedWaistMm: WAIST_MM,
      skirtLengthMm: LENGTH_MM,
    });
    const r = q.waistRadiusMm;
    expectNear(q.keyPoints["circle.waistSide"]!, pt(r, -r));
    expectNear(q.keyPoints["circle.hemSide"]!, pt(r + LENGTH_MM, -r));
    expect(pathLength([q.stitchPath[q.runs.side[0]]!])).toBeCloseTo(LENGTH_MM, 6);
  });

  it("draws a closed outline with no crossings and a vertical grain line inside it", () => {
    for (const type of ["circle-half", "circle-full"] as const) {
      const q = draftCircleQuarter({ type, finishedWaistMm: WAIST_MM, skirtLengthMm: LENGTH_MM });
      expect(isClosed(q.stitchPath)).toBe(true);
      expect(selfIntersections(q.stitchPath)).toEqual([]);
      const [from, to] = q.grainLine;
      expect(from.x).toBe(to.x);
      const outline = samplePath(q.stitchPath);
      expect(pointInPolygon(from, outline) && pointInPolygon(to, outline)).toBe(true);
    }
  });

  it("covers the edges in order with no gap: waist, side, hem, centre", () => {
    const q = draftCircleQuarter({
      type: "circle-full",
      finishedWaistMm: WAIST_MM,
      skirtLengthMm: LENGTH_MM,
    });
    const { waist, side, hem, centre } = q.runs;
    expect([waist[0], side[0], hem[0], centre[0]]).toEqual([0, waist[1] + 1, side[1] + 1, hem[1] + 1]);
    expect(centre[1]).toBe(q.stitchPath.length - 1);
  });
});

describe("solveWaistRadiusMm", () => {
  it("returns the exact circle radius for a tiny sweep", () => {
    expect(solveWaistRadiusMm(10, 0.1)).toBeCloseTo(100, 3);
  });
});
