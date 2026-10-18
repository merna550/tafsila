/** Tests for the seam allowance finishing step (FR-PAT-03, issue #130). */
import fc from "fast-check";
import { DEFAULT_SEAM_ALLOWANCE_MM, type Edge } from "@tafsila/schemas";
import { SIZE_MATRIX, vNeckHalfCircleDress } from "@tafsila/test-fixtures";
import { describe, expect, it } from "vitest";
import { SEAM_ALLOWANCE_TOLERANCE_MM } from "../constants/finishing";
import { DraftingError } from "../errors/drafting-error";
import {
  type Point,
  cubicSeg,
  isClosed,
  lineSeg,
  pointOnSegment,
  pt,
  reversePath,
  samplePath,
  selfIntersections,
} from "../geometry";
import { createContext, type PieceDraft } from "../pipeline/draft-context";
import { DEFAULT_ENGINE_OPTIONS, generatePattern } from "../pipeline/generate-pattern";
import { rectangleEdges, rectangleRegistry } from "../pipeline/test-support/rectangle-module";
import { deepFreeze } from "../test-utils/deep-freeze";
import { finishing, finishingSteps } from ".";
import { allowanceFor, seamAllowanceStep, segmentAllowances, withSeamAllowance } from "./seam-allowance";

const defaults = { defaultsMm: DEFAULT_SEAM_ALLOWANCE_MM, perEdgeMm: {} };

/** Shape of the A-line test piece. */
interface Trapezoid {
  readonly hemMm: number;
  readonly waistMm: number;
  readonly heightMm: number;
}

/**
 * An anticlockwise half skirt: hem, side, waist, centre front (on the fold), one edge per segment.
 *
 * @param shape - Hem width, waist width and height in mm.
 * @returns The piece.
 */
function trapezoid({ hemMm, waistMm, heightMm }: Trapezoid): PieceDraft {
  const stitchPath = [
    lineSeg(pt(0, 0), pt(hemMm, 0)),
    lineSeg(pt(hemMm, 0), pt(waistMm, heightMm)),
    lineSeg(pt(waistMm, heightMm), pt(0, heightMm)),
    lineSeg(pt(0, heightMm), pt(0, 0)),
  ];
  const kinds = ["hem", "side", "other", "fold"] as const;
  return {
    id: "skirt",
    name: { ar: "التنورة", en: "Skirt" },
    cut: { quantity: 1, onFold: true, mirror: false, fabric: "main" },
    stitchPath,
    edges: kinds.map((kind, i) => ({ id: kind, fromSegment: i, toSegment: i, kind, seamAllowanceMm: 0 })),
    notches: [],
    bodyLines: [],
    grainLine: [pt(10, 10), pt(10, 100)],
    darts: [],
  };
}

/**
 * The same piece run the other way round (clockwise); edge indices follow the reversed segments.
 *
 * @param piece - An anticlockwise piece with one segment per edge.
 * @returns The clockwise piece.
 */
function clockwise(piece: PieceDraft): PieceDraft {
  const last = piece.stitchPath.length - 1;
  const edges = piece.edges.map((e) => ({
    ...e,
    fromSegment: last - e.toSegment,
    toSegment: last - e.fromSegment,
  }));
  return { ...piece, stitchPath: reversePath(piece.stitchPath), edges };
}

/**
 * Shortest distance from a point to a closed polyline.
 *
 * @param point - The point.
 * @param polygon - Polyline points in order.
 * @returns Distance in mm.
 */
function distanceToPolygon(point: Point, polygon: readonly Point[]): number {
  return Math.min(
    ...polygon.map((a, i) => {
      const b = polygon[(i + 1) % polygon.length]!;
      const ab = { x: b.x - a.x, y: b.y - a.y };
      const lengthSq = ab.x * ab.x + ab.y * ab.y || 1;
      const t = Math.min(1, Math.max(0, ((point.x - a.x) * ab.x + (point.y - a.y) * ab.y) / lengthSq));
      return Math.hypot(point.x - (a.x + t * ab.x), point.y - (a.y + t * ab.y));
    }),
  );
}

/**
 * Distance from the middle of each edge's stitch line to the cutting line.
 *
 * @param piece - A finished piece.
 * @returns Measured allowance per edge id, in mm.
 */
function measuredAllowances(piece: PieceDraft): Record<string, number> {
  const polygon = samplePath(piece.cutPath!);
  return Object.fromEntries(
    piece.edges.map((e) => [
      e.id,
      distanceToPolygon(pointOnSegment(piece.stitchPath[e.fromSegment]!, 0.5), polygon),
    ]),
  );
}

/**
 * Asserts every edge's cut line lies its allowance away from the stitch line.
 *
 * @param piece - A finished piece.
 */
function expectAllowancesKept(piece: PieceDraft): void {
  const measured = measuredAllowances(piece);
  for (const edge of piece.edges) {
    expect(Math.abs(measured[edge.id]! - edge.seamAllowanceMm)).toBeLessThanOrEqual(
      SEAM_ALLOWANCE_TOLERANCE_MM,
    );
  }
}

const skirt = trapezoid({ hemMm: 300, waistMm: 250, heightMm: 400 });
const arbTrapezoid = fc.record({
  hemMm: fc.double({ min: 150, max: 800, noNaN: true }),
  waistMm: fc.double({ min: 100, max: 500, noNaN: true }),
  heightMm: fc.double({ min: 200, max: 1100, noNaN: true }),
});
const arbDefaults = fc.record({
  side: fc.double({ min: 5, max: 40, noNaN: true }),
  neckline: fc.constant(10),
  armhole: fc.constant(10),
  hem: fc.double({ min: 10, max: 60, noNaN: true }),
  other: fc.double({ min: 5, max: 30, noNaN: true }),
});

describe("allowanceFor", () => {
  it("gives 0 on a fold edge even when an override names it", () => {
    const fold: Edge = { id: "cf", fromSegment: 3, toSegment: 3, kind: "fold", seamAllowanceMm: 9 };
    expect(allowanceFor("skirt", fold, { ...defaults, perEdgeMm: { "skirt/cf": 20 } })).toBe(0);
  });

  it("uses the defaults: hem 30, side 15, neckline and armhole 10, no kind as other", () => {
    const edge = (kind?: Edge["kind"]): Edge => ({
      id: "e",
      fromSegment: 0,
      toSegment: 0,
      kind,
      seamAllowanceMm: 0,
    });
    const got = [edge("hem"), edge("side"), edge("neckline"), edge("armhole"), edge()].map((e) =>
      allowanceFor("p", e, defaults),
    );
    expect(got).toEqual([30, 15, 10, 10, 15]);
  });
});

describe("seamAllowanceStep", () => {
  it("keeps every edge its allowance away from the stitch line (property, both orientations)", () => {
    fc.assert(
      fc.property(arbTrapezoid, arbDefaults, fc.boolean(), (shape, defaultsMm, flip) => {
        const piece = flip ? clockwise(trapezoid(shape)) : trapezoid(shape);
        const done = withSeamAllowance(piece, { defaultsMm, perEdgeMm: {} });
        expectAllowancesKept(done);
        expect(selfIntersections(done.cutPath!)).toEqual([]);
      }),
    );
  });

  it("leaves the cutting line on the stitch line along a fold edge", () => {
    const done = withSeamAllowance(skirt, defaults);
    expect(done.edges.map((e) => [e.id, e.seamAllowanceMm])).toEqual([
      ["hem", 30],
      ["side", 15],
      ["other", 15],
      ["fold", 0],
    ]);
    expect(measuredAllowances(done).fold).toBeCloseTo(0, 6);
  });

  it("grows a clockwise and an anticlockwise rectangle outwards alike", () => {
    const rectangle = trapezoid({ hemMm: 200, waistMm: 200, heightMm: 300 });
    const xs = [rectangle, clockwise(rectangle)].map((p) =>
      samplePath(withSeamAllowance(p, defaults).cutPath!),
    );
    for (const polygon of xs) {
      expect(Math.max(...polygon.map((q) => q.x))).toBeCloseTo(215, 6);
      expect(Math.min(...polygon.map((q) => q.y))).toBeCloseTo(-30, 6);
    }
  });

  it("changes only the overridden edge", () => {
    const base = withSeamAllowance(skirt, defaults);
    const changed = withSeamAllowance(skirt, { ...defaults, perEdgeMm: { "skirt/side": 25 } });
    expect(changed.edges.map((e) => e.seamAllowanceMm)).toEqual([30, 25, 15, 0]);
    const before = measuredAllowances(base);
    const after = measuredAllowances(changed);
    expect(after.side).toBeCloseTo(25, 1);
    expect([after.hem, after.other, after.fold]).toEqual([before.hem, before.other, before.fold]);
  });

  it("offsets a curved, concave edge and keeps the cut line simple", () => {
    const scoop = cubicSeg(pt(250, 400), pt(180, 340), pt(80, 340), pt(0, 400));
    const piece = {
      ...skirt,
      stitchPath: [skirt.stitchPath[0]!, skirt.stitchPath[1]!, scoop, skirt.stitchPath[3]!],
    };
    const done = withSeamAllowance(piece, defaults);
    expect(isClosed(done.cutPath!)).toBe(true);
    expect(selfIntersections(done.cutPath!)).toEqual([]);
    expect(measuredAllowances(done).other).toBeCloseTo(15, 1);
  });

  it("gives a segment no edge covers the other default", () => {
    const piece = { ...skirt, edges: skirt.edges.slice(0, 2) };
    expect(segmentAllowances(piece, defaults).allowancesMm).toEqual([30, 15, 15, 15]);
  });

  it("follows an edge that wraps past the last segment", () => {
    const piece = { ...skirt, edges: [{ ...skirt.edges[0]!, fromSegment: 3, toSegment: 0 }] };
    expect(segmentAllowances(piece, defaults).allowancesMm).toEqual([30, 15, 15, 30]);
  });

  it("refuses overlapping edges and edges past the end of the path", () => {
    const overlap = { ...skirt, edges: [skirt.edges[0]!, { ...skirt.edges[1]!, fromSegment: 0 }] };
    const outside = { ...skirt, edges: [{ ...skirt.edges[0]!, toSegment: 7 }] };
    expect(() => withSeamAllowance(overlap, defaults)).toThrow(
      expect.objectContaining({ code: "FINISHING_EDGES_OVERLAP" }),
    );
    expect(() => withSeamAllowance(outside, defaults)).toThrow(
      expect.objectContaining({ code: "FINISHING_EDGE_OUT_OF_RANGE" }),
    );
  });

  it("names the piece when a curve is too tight for its allowance", () => {
    const tight = cubicSeg(pt(250, 400), pt(0, 0), pt(250, 0), pt(0, 400));
    const piece = {
      ...skirt,
      stitchPath: [skirt.stitchPath[0]!, skirt.stitchPath[1]!, tight, skirt.stitchPath[3]!],
    };
    const run = () => withSeamAllowance(piece, { ...defaults, perEdgeMm: { "skirt/other": 200 } });
    expect(run).toThrow(DraftingError);
    expect(run).toThrow(/^skirt: /);
  });

  it("does not change its frozen input and gives the same output for the same input", () => {
    const ctx = deepFreeze(
      createContext(vNeckHalfCircleDress, SIZE_MATRIX[0]!.measurements, DEFAULT_ENGINE_OPTIONS),
    );
    const withSkirt = deepFreeze({ ...ctx, pieces: [structuredClone(skirt)] });
    expect(seamAllowanceStep(withSkirt)).toEqual(seamAllowanceStep(withSkirt));
    expect(withSkirt.pieces[0]!.cutPath).toBeUndefined();
  });
});

describe("finishing", () => {
  it("runs the seam allowance step first", () => {
    expect(finishingSteps[0]).toBe(seamAllowanceStep);
  });

  it("gives the rectangle a closed, simple cutting line in every size of the matrix", () => {
    for (const entry of SIZE_MATRIX) {
      const options = { ...DEFAULT_ENGINE_OPTIONS, sizeLabel: entry.id };
      const piece = generatePattern(
        vNeckHalfCircleDress,
        entry.measurements,
        options,
        rectangleRegistry,
      ).pieces.find((p) => p.id === "front-panel");
      const cut = piece!.cutPath;
      expect(isClosed(cut)).toBe(true);
      expect(selfIntersections(cut)).toEqual([]);
      expectAllowancesKept(piece!);
      expect(piece!.edges.map((e) => e.id)).toEqual(rectangleEdges.map((e) => e.id));
    }
  });

  it("leaves a context with no pieces unchanged in content", () => {
    const ctx = createContext(vNeckHalfCircleDress, SIZE_MATRIX[0]!.measurements, DEFAULT_ENGINE_OPTIONS);
    expect(finishing(ctx)).toEqual(ctx);
  });
});
