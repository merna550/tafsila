import { describe, expect, it } from "vitest";
import {
  arcToCubics,
  cubicSeg,
  distance,
  distancePointToPolyline,
  lineSeg,
  pathLength,
  pt,
  samplePath,
} from "../geometry";
import { rectanglePiece } from "../test-utils/cut-piece";
import { connectionCurve, curvePoints } from "./curve-points";
import { type CutRun, cutRuns, reverseRun, runStart } from "./runs";

/** A semicircle of radius 50 mm (length 157 mm) from (0, 0) to (100, 0), as one curve run. */
const SEMICIRCLE: CutRun = {
  kind: "curve",
  segments: arcToCubics({ center: pt(50, 0), radiusMm: 50, fromRad: Math.PI, toRad: 0 }),
};

describe("cutRuns (issue #284, decision 284 item 1)", () => {
  it("splits a rectangle into 4 straight runs with no curve points", () => {
    const runs = cutRuns(rectanglePiece().cutPath);
    expect(runs.map((r) => r.kind)).toEqual(["straight", "straight", "straight", "straight"]);
    expect(runs.flatMap((r) => curvePoints(r, 25))).toEqual([]);
  });

  it("does not split at a smooth join of two cubics, but splits at a 90° turn", () => {
    const path = [
      cubicSeg(pt(0, 0), pt(30, 0), pt(60, 10), pt(100, 40)),
      cubicSeg(pt(100, 40), pt(140, 70), pt(160, 90), pt(160, 140)),
      lineSeg(pt(160, 140), pt(0, 140)),
      lineSeg(pt(0, 140), pt(0, 0)),
    ];
    const runs = cutRuns(path);
    expect(runs).toHaveLength(3);
    expect(runs[0]!.segments).toHaveLength(2);
    expect(runs[0]!.kind).toBe("curve");
  });

  it("treats a 5° kink between two lines as a corner, and collinear lines as one straight run", () => {
    const kinked = [
      lineSeg(pt(0, 0), pt(100, 0)),
      lineSeg(pt(100, 0), pt(200, 8.75)),
      lineSeg(pt(200, 8.75), pt(200, 100)),
      lineSeg(pt(200, 100), pt(0, 100)),
      lineSeg(pt(0, 100), pt(0, 50)),
      lineSeg(pt(0, 50), pt(0, 0)),
    ];
    const runs = cutRuns(kinked);
    expect(runs).toHaveLength(5);
    expect(runs.every((r) => r.kind === "straight")).toBe(true);
  });

  it("splits at a mitred seam-allowance corner of the seed skirt hem (about 30°)", () => {
    const hemCorner = [
      lineSeg(pt(0, 0), pt(0, 500)),
      lineSeg(pt(0, 500), pt(8, 515)),
      lineSeg(pt(8, 515), pt(200, 515)),
      lineSeg(pt(200, 515), pt(200, 0)),
      lineSeg(pt(200, 0), pt(0, 0)),
    ];
    expect(cutRuns(hemCorner)).toHaveLength(5);
  });

  it("keeps a path without corners as one curve run", () => {
    const circle = [
      ...SEMICIRCLE.segments,
      ...arcToCubics({ center: pt(50, 0), radiusMm: 50, fromRad: 0, toRad: -Math.PI }),
    ];
    const runs = cutRuns(circle);
    expect(runs).toHaveLength(1);
    expect(runs[0]!.kind).toBe("curve");
  });

  it("reverses a run", () => {
    const run = cutRuns(rectanglePiece().cutPath)[0]!;
    expect(runStart(reverseRun(run))).toEqual(run.segments.at(-1)!.to);
  });
});

describe("curvePoints (FR-CUT-02, decision 284 items 2 and 8)", () => {
  it("cuts a 157 mm semicircle at step 25 into 7 equal gaps of 22.4 mm", () => {
    expect(pathLength(SEMICIRCLE.segments)).toBeCloseTo(157.08, 1);
    const points = [pt(0, 0), ...curvePoints(SEMICIRCLE, 25), pt(100, 0)];
    expect(points).toHaveLength(8);
    const arcGap = pathLength(SEMICIRCLE.segments) / 7;
    expect(arcGap).toBeCloseTo(22.44, 1);
    const chord = 2 * 50 * Math.sin(arcGap / 50 / 2);
    for (let i = 1; i < points.length; i += 1)
      expect(distance(points[i - 1]!, points[i]!)).toBeCloseTo(chord, 1);
  });

  it("gives a short curve no inner point", () => {
    expect(
      curvePoints({ kind: "curve", segments: [cubicSeg(pt(0, 0), pt(5, 2), pt(10, 2), pt(15, 0))] }, 25),
    ).toEqual([]);
  });

  it("halves a gap on a tight bend so the smooth curve stays within 0.75 mm", () => {
    const tight: CutRun = {
      kind: "curve",
      segments: [
        lineSeg(pt(0, 0), pt(60, 0)),
        ...arcToCubics({ center: pt(60, 12), radiusMm: 12, fromRad: -Math.PI / 2, toRad: 0 }),
        lineSeg(pt(72, 12), pt(72, 70)),
      ],
    };
    const inner = curvePoints(tight, 25);
    const points = [pt(0, 0), ...inner, pt(72, 70)];
    const line = samplePath(tight.segments, 64);
    for (const p of samplePath(connectionCurve(points), 16))
      expect(distancePointToPolyline(p, line)).toBeLessThan(1);
    expect(inner.length).toBeGreaterThan(Math.ceil(pathLength(tight.segments) / 25) - 1);
  });
});
