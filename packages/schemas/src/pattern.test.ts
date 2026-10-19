/** Tests for the PatternResult contract. */
import { describe, expect, it } from "vitest";
import { markSchema, patternResultSchema, type PatternResult, type Point } from "./pattern";

/** Corners of a 200 x 300 mm rectangle (schemas cannot import the fixtures package: it depends on schemas). */
const corners: Point[] = [
  { x: 0, y: 0 },
  { x: 200, y: 0 },
  { x: 200, y: 300 },
  { x: 0, y: 300 },
];

/** A closed rectangle of four line segments. */
const rect = corners.map((from, i) => ({
  kind: "line" as const,
  from,
  to: corners[(i + 1) % 4]!,
}));

/** A minimal valid pattern. */
const rectanglePattern: PatternResult = {
  engineVersion: "0.1.0",
  pieces: [
    {
      id: "p",
      name: { ar: "ق", en: "P" },
      cut: { quantity: 1, onFold: false, mirror: false, fabric: "main" },
      stitchPath: rect,
      cutPath: rect,
      edges: [{ id: "side", fromSegment: 1, toSegment: 1, seamAllowanceMm: 15 }],
      notches: [],
      bodyLines: [],
      grainLine: [
        { x: 100, y: 50 },
        { x: 100, y: 250 },
      ],
      darts: [],
      labels: [],
      bbox: { widthMm: 200, heightMm: 300 },
    },
  ],
  sewingOrder: [],
  validation: {
    status: "pass",
    checks: [{ id: "FR-VAL-01", status: "pass", message: { ar: "سليم", en: "OK" } }],
  },
  meta: { category: "skirt", sizeLabel: "M", createdFrom: "x" },
};

/**
 * Deep copy of the pattern so each test can break it freely.
 *
 * @returns A fresh copy.
 */
function fixture() {
  return structuredClone(rectanglePattern);
}

describe("patternResultSchema", () => {
  it("accepts the rectangle fixture", () => {
    expect(patternResultSchema.safeParse(rectanglePattern).success).toBe(true);
  });

  it("rejects a piece without a grain line", () => {
    const p = fixture() as unknown as { pieces: Record<string, unknown>[] };
    delete p.pieces[0]!.grainLine;
    expect(patternResultSchema.safeParse(p).success).toBe(false);
  });

  it("rejects an open stitch path (last end 1 mm off)", () => {
    const p = fixture();
    p.pieces[0]!.stitchPath[3]!.to = { x: 0, y: 1 };
    expect(patternResultSchema.safeParse(p).success).toBe(false);
  });

  it("rejects a gap between segments", () => {
    const p = fixture();
    p.pieces[0]!.stitchPath[1]!.from = { x: 205, y: 0 };
    expect(patternResultSchema.safeParse(p).success).toBe(false);
  });

  it("rejects an unknown check id", () => {
    const p = fixture() as unknown as { validation: { checks: { id: string }[] } };
    p.validation.checks[0]!.id = "FR-VAL-99";
    expect(patternResultSchema.safeParse(p).success).toBe(false);
  });

  it("rejects a negative seam allowance", () => {
    const p = fixture();
    p.pieces[0]!.edges[0]!.seamAllowanceMm = -1;
    expect(patternResultSchema.safeParse(p).success).toBe(false);
  });

  it("rejects an on-fold piece with quantity 0", () => {
    const p = fixture();
    p.pieces[0]!.cut = { ...p.pieces[0]!.cut, onFold: true, quantity: 0 };
    expect(patternResultSchema.safeParse(p).success).toBe(false);
  });
});

describe("markSchema (issue #137)", () => {
  it("accepts a gather line, a pleat arrow and a point", () => {
    const line = {
      id: "g",
      kind: "gather",
      shape: "line",
      edgeId: "waist",
      from: corners[0],
      to: corners[1],
      lengthMm: 100,
    };
    const arrow = {
      id: "p",
      kind: "pleat-direction",
      shape: "arrow",
      from: corners[1],
      to: corners[0],
      text: { ar: "اطوي", en: "Fold" },
    };
    const point = { id: "d", kind: "pleat-fold", shape: "point", at: corners[2] };
    for (const mark of [line, arrow, point]) expect(markSchema.safeParse(mark).success).toBe(true);
  });

  it("rejects an unknown kind, a line without an end and a gather length that is not positive", () => {
    expect(markSchema.safeParse({ id: "x", kind: "zip", shape: "point", at: corners[0] }).success).toBe(
      false,
    );
    expect(markSchema.safeParse({ id: "x", kind: "gather", shape: "line", from: corners[0] }).success).toBe(
      false,
    );
    const zero = { id: "x", kind: "gather", shape: "line", from: corners[0], to: corners[1], lengthMm: 0 };
    expect(markSchema.safeParse(zero).success).toBe(false);
  });

  it("accepts a cuff slit line and a sleeve-end point (issue #142)", () => {
    const slit = { id: "s", kind: "slit", shape: "line", edgeId: "hem", from: corners[0], to: corners[1] };
    const end = { id: "e", kind: "sleeve-end", shape: "point", edgeId: "armhole", at: corners[2] };
    for (const mark of [slit, end]) expect(markSchema.safeParse(mark).success).toBe(true);
  });
});

describe("sleeveCap declared ease (issue #142)", () => {
  it("accepts gathered and excluded lengths and rejects negative ones", () => {
    const withCap = (extra: Record<string, number>) => {
      const p = fixture();
      p.pieces[0]!.sleeveCap = {
        edgeIds: ["cap"],
        armholeRefs: [{ pieceId: "bodice-front", edgeId: "armhole" }],
        ...extra,
      };
      return patternResultSchema.safeParse(p).success;
    };
    expect(withCap({ gatheredMm: 60, armholeExcludedMm: 165 })).toBe(true);
    expect(withCap({ gatheredMm: -1 })).toBe(false);
    expect(withCap({ armholeExcludedMm: -1 })).toBe(false);
  });
});
