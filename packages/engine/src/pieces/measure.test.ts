/** Tests of the piece measuring helpers (issue #128). */
import { describe, expect, it } from "vitest";
import { lineSeg, pt } from "../geometry";
import { dartLegLengthsMm, edgeLengthMm, edgeSegments, type MeasurablePiece } from "./measure";

// A 100 x 50 rectangle whose bottom edge holds a 10 mm dart mouth.
const piece: MeasurablePiece = {
  stitchPath: [
    lineSeg(pt(0, 0), pt(100, 0)),
    lineSeg(pt(100, 0), pt(100, 50)),
    lineSeg(pt(100, 50), pt(60, 50)),
    lineSeg(pt(60, 50), pt(50, 50)),
    lineSeg(pt(50, 50), pt(0, 50)),
    lineSeg(pt(0, 50), pt(0, 0)),
  ],
  edges: [
    { id: "top", fromSegment: 0, toSegment: 0, seamAllowanceMm: 10 },
    { id: "right", fromSegment: 1, toSegment: 1, seamAllowanceMm: 10 },
    { id: "bottom", fromSegment: 2, toSegment: 4, seamAllowanceMm: 10 },
  ],
  darts: [{ id: "d", edgeId: "bottom", apex: pt(55, 20), legs: [pt(60, 50), pt(50, 50)] }],
};

describe("measure", () => {
  it("returns the segments of an edge and none for an unknown edge", () => {
    expect(edgeSegments(piece, "bottom")).toHaveLength(3);
    expect(edgeSegments(piece, "nope")).toEqual([]);
  });

  it("measures an edge with and without its darts closed", () => {
    expect(edgeLengthMm(piece, "bottom")).toBeCloseTo(100, 9);
    expect(edgeLengthMm(piece, "bottom", { closeDarts: true })).toBeCloseTo(90, 9);
    expect(edgeLengthMm(piece, "top", { closeDarts: true })).toBeCloseTo(100, 9);
    expect(edgeLengthMm(piece, "nope")).toBe(0);
  });

  it("measures dart legs", () => {
    const [a, b] = dartLegLengthsMm(piece.darts[0]!);
    expect(a).toBeCloseTo(Math.hypot(5, 30), 9);
    expect(b).toBeCloseTo(a, 9);
  });
});
