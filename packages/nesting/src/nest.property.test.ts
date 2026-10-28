import { type FabricLayout, fabricOptionsSchema } from "@tafsila/schemas";
import { signedArea } from "@tafsila/engine/geometry";
import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { SLICE_MM } from "./constants";
import { nest, nestShapes } from "./nest";
import { preparePieces } from "./prepare-pieces";
import { NESTING_DESIGNS, NESTING_SIZES, fixturePattern } from "./test-support/fixtures";
import { overlaps, placedPolygon, rectShape } from "./test-support/shapes";
import type { NestKindResult, Shape } from "./types";

/** Overlap depth the property allows, in mm. */
const OVERLAP_TOLERANCE_MM = 0.5;
/** Slack for "inside the width", in mm. */
const EDGE_TOLERANCE_MM = 1e-6;

/**
 * Checks the placement invariants of one fabric kind.
 *
 * @param shapes - The kind's shapes.
 * @param result - Its placement.
 * @param usableWidthMm - The usable width.
 */
function expectValidPlacement(shapes: readonly Shape[], result: NestKindResult, usableWidthMm: number): void {
  const byId = new Map(shapes.map((s) => [s.id, s]));
  const placedIds = result.placements.map((p) => p.shapeId);
  expect(new Set(placedIds).size).toBe(placedIds.length);
  const leftOut = new Set(result.doesNotFit.map((d) => d.pieceId));
  for (const s of shapes) expect(placedIds.includes(s.id) || leftOut.has(s.pieceId)).toBe(true);
  const outlines = result.placements.map((p) => {
    const shape = byId.get(p.shapeId)!;
    const outline = placedPolygon(shape, p);
    for (const q of outline) {
      expect(q.x).toBeGreaterThanOrEqual(-EDGE_TOLERANCE_MM);
      expect(q.y).toBeGreaterThanOrEqual(-EDGE_TOLERANCE_MM);
      expect(q.y).toBeLessThanOrEqual(usableWidthMm + EDGE_TOLERANCE_MM);
    }
    expect(shape.allowedTurns).toContain(p.rotation);
    if (shape.fold) {
      expect(p.yMm).toBe(0);
      expect(Math.min(...outline.map((q) => q.y))).toBeCloseTo(0, 9);
    }
    return outline;
  });
  for (let i = 0; i < outlines.length; i++) {
    for (let j = i + 1; j < outlines.length; j++) {
      expect(
        overlaps(outlines[i]!, outlines[j]!, OVERLAP_TOLERANCE_MM),
        `${placedIds[i]} / ${placedIds[j]}`,
      ).toBe(false);
    }
  }
  const placed = result.placements.map((p) => byId.get(p.shapeId)!);
  const areaBound = placed.reduce((sum, s) => sum + Math.abs(signedArea(s.polygon)), 0) / usableWidthMm;
  const upper = placed.reduce((sum, s) => sum + Math.ceil(s.bbox.lengthMm / SLICE_MM) * SLICE_MM, 0);
  expect(result.stripLengthMm).toBeGreaterThanOrEqual(areaBound - EDGE_TOLERANCE_MM);
  expect(result.stripLengthMm).toBeLessThanOrEqual(upper + EDGE_TOLERANCE_MM);
}

const arbFixtureCase = fc.record({
  name: fc.constantFrom(...(Object.keys(NESTING_DESIGNS) as (keyof typeof NESTING_DESIGNS)[])),
  size: fc.constantFrom(...NESTING_SIZES),
  layout: fc.constantFrom<FabricLayout>("folded", "open"),
  widthMm: fc.constantFrom(1150, 1400),
  directionalNap: fc.boolean(),
});

describe("nest over the fixture patterns", () => {
  it("places without overlaps, inside the width, with allowed turns and fold pieces on the fold", () => {
    fc.assert(
      fc.property(arbFixtureCase, (c) => {
        const options = fabricOptionsSchema.parse(c);
        const prepared = preparePieces(fixturePattern(c.name, c.size), options);
        const result = nest(prepared);
        for (const kind of ["main", "lining", "interfacing"] as const) {
          expectValidPlacement(prepared[kind], result[kind], prepared.usableWidthMm);
          if (c.directionalNap) expect(result[kind].placements.every((p) => p.rotation === 0)).toBe(true);
        }
      }),
      { numRuns: 12 },
    );
  });
});

const arbRect = fc.record({
  lengthMm: fc.integer({ min: 10, max: 600 }),
  widthMm: fc.integer({ min: 10, max: 700 }),
  fold: fc.boolean(),
});

describe("the overlap check", () => {
  it("sees a 1 mm overlap and ignores touching", () => {
    const a = rectShape({ id: "a#1", lengthMm: 100, widthMm: 100 }).polygon;
    const shifted = (dx: number) => a.map((q) => ({ x: q.x + dx, y: q.y + 10 }));
    expect(overlaps(a, shifted(99), OVERLAP_TOLERANCE_MM)).toBe(true);
    expect(overlaps(a, shifted(100), OVERLAP_TOLERANCE_MM)).toBe(false);
    expect(overlaps(a, shifted(300), OVERLAP_TOLERANCE_MM)).toBe(false);
  });
});

describe("nest over random rectangles", () => {
  it("keeps every invariant and does not depend on the input order", () => {
    fc.assert(
      fc.property(
        fc.array(arbRect, { minLength: 1, maxLength: 10 }),
        fc.integer({ min: 500, max: 1500 }),
        fc.boolean(),
        fc.boolean(),
        (rects, usableWidthMm, folded, nap) => {
          const shapes = rects.map((r, i) =>
            rectShape({
              id: `p${i}#1`,
              ...r,
              fold: folded && r.fold,
              allowedTurns: nap ? [0] : [0, 180],
            }),
          );
          const strip = { usableWidthMm, folded };
          const result = nestShapes(shapes, "main", strip);
          expectValidPlacement(shapes, result, usableWidthMm);
          expect(nestShapes([...shapes].reverse(), "main", strip)).toEqual(result);
        },
      ),
      { numRuns: 60 },
    );
  });
});
