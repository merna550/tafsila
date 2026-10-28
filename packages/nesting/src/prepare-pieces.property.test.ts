import { generatePattern } from "@tafsila/engine";
import { pointInPolygon, samplePath, distancePointToPolyline } from "@tafsila/engine/geometry";
import { type FabricLayout, type PatternResult, fabricOptionsSchema } from "@tafsila/schemas";
import {
  egyptianSizeChart,
  gatheredKneeSkirt,
  linedSidePocketDress,
  seedDress,
  setInSleeveBlouse,
  vNeckHalfCircleDress,
} from "@tafsila/test-fixtures";
import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { nestingOutline } from "./flatten";
import { preparePieces } from "./prepare-pieces";
import { shapeCopies } from "./quantity";
import type { PreparedFabrics, Shape } from "./types";

const DESIGNS = {
  seedDress,
  vNeckHalfCircleDress,
  setInSleeveBlouse,
  gatheredKneeSkirt,
  linedSidePocketDress,
};
const SIZES = ["M", "XXL"] as const;
const LAYOUTS: readonly FabricLayout[] = ["folded", "open"];
const WIDTHS_MM = [1150, 1400] as const;
/** Largest grain angle off the selvedge, in degrees. */
const GRAIN_TOLERANCE_DEG = 0.01;

/** Every fixture pattern, drafted once. */
const PATTERNS: ReadonlyArray<readonly [string, PatternResult]> = Object.entries(DESIGNS).flatMap(
  ([name, spec]) =>
    SIZES.map((size) => [`${name} ${size}`, generatePattern(spec, egyptianSizeChart[size])] as const),
);

const arbCase = fc.record({
  pattern: fc.constantFrom(...PATTERNS),
  layout: fc.constantFrom(...LAYOUTS),
  widthMm: fc.constantFrom(...WIDTHS_MM),
  directionalNap: fc.boolean(),
});

/** One generated case. */
type Case = typeof arbCase extends fc.Arbitrary<infer T> ? T : never;

/**
 * Every shape of a preparation.
 *
 * @param prepared - The preparation.
 * @returns Main, lining and interfacing shapes in one list.
 */
function allShapes(prepared: PreparedFabrics): Shape[] {
  return [...prepared.main, ...prepared.lining, ...prepared.interfacing];
}

/**
 * Prepares one property case.
 *
 * @param c - The case.
 * @returns The pattern and its preparation.
 */
function prepare(c: Case): {
  pattern: PatternResult;
  prepared: PreparedFabrics;
} {
  const pattern = c.pattern[1];
  const options = fabricOptionsSchema.parse({
    widthMm: c.widthMm,
    layout: c.layout,
    directionalNap: c.directionalNap,
  });
  return { pattern, prepared: preparePieces(pattern, options) };
}

describe("preparePieces over the fixture patterns", () => {
  it("gives the layout's sum of quantities for every piece that fits", () => {
    fc.assert(
      fc.property(arbCase, (c) => {
        const { pattern, prepared } = prepare(c);
        const left = new Set(prepared.doesNotFit.map((d) => d.pieceId));
        const expected = pattern.pieces
          .filter((p) => !left.has(p.id))
          .reduce((sum, p) => sum + shapeCopies(p.cut, c.layout).length, 0);
        const quantities = pattern.pieces.filter((p) => !left.has(p.id)).map((p) => p.cut);
        const byRule = quantities.reduce((sum, cut) => {
          if (c.layout === "folded" && cut.mirror) return sum + Math.ceil(cut.quantity / 2);
          return sum + cut.quantity;
        }, 0);
        expect(allShapes(prepared)).toHaveLength(expected);
        expect(expected).toBe(byRule);
      }),
      { numRuns: 40 },
    );
  });

  it("turns every shape's grain parallel to the selvedge", () => {
    fc.assert(
      fc.property(arbCase, (c) => {
        for (const shape of allShapes(prepare(c).prepared)) {
          const [a, b] = shape.grainLine;
          const angleDeg = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
          expect(Math.abs(angleDeg)).toBeLessThan(GRAIN_TOLERANCE_DEG);
        }
      }),
      { numRuns: 40 },
    );
  });

  it("allows the half turn only without directional nap", () => {
    fc.assert(
      fc.property(arbCase, (c) => {
        const expected = c.directionalNap ? [0] : [0, 180];
        for (const shape of allShapes(prepare(c).prepared)) expect(shape.allowedTurns).toEqual(expected);
      }),
      { numRuns: 20 },
    );
  });

  it("puts fold shapes on y = 0 when folded and no shape below y = 0", () => {
    fc.assert(
      fc.property(arbCase, (c) => {
        const { pattern, prepared } = prepare(c);
        for (const shape of allShapes(prepared)) {
          const minY = Math.min(...shape.polygon.map((p) => p.y));
          expect(minY).toBeGreaterThanOrEqual(0);
          const onFold = pattern.pieces.find((p) => p.id === shape.pieceId)!.cut.onFold;
          expect(shape.fold).toBe(onFold && c.layout === "folded");
          if (shape.fold) expect(minY).toBe(0);
        }
      }),
      { numRuns: 40 },
    );
  });

  it("fits every shape inside the usable width or reports its piece", () => {
    fc.assert(
      fc.property(arbCase, (c) => {
        const { prepared } = prepare(c);
        for (const shape of allShapes(prepared))
          expect(shape.bbox.widthMm).toBeLessThanOrEqual(prepared.usableWidthMm);
        for (const d of prepared.doesNotFit) expect(d.widthMm).toBeGreaterThan(prepared.usableWidthMm);
      }),
      { numRuns: 40 },
    );
  });

  it("gives the same result twice and whatever the order of the pieces", () => {
    fc.assert(
      fc.property(arbCase, fc.integer({ min: 0, max: 1000 }), (c, seed) => {
        const { pattern, prepared } = prepare(c);
        const options = fabricOptionsSchema.parse({ widthMm: c.widthMm, layout: c.layout });
        const shuffled = fc.sample(
          fc.shuffledSubarray([...pattern.pieces], { minLength: pattern.pieces.length }),
          {
            numRuns: 1,
            seed,
          },
        )[0]!;
        const again = preparePieces(
          { ...pattern, pieces: shuffled },
          { ...options, directionalNap: c.directionalNap },
        );
        expect(again).toEqual(prepared);
      }),
      { numRuns: 20 },
    );
  });

  it("keeps the real cut line of every fixture piece inside its nesting outline", () => {
    for (const [, pattern] of PATTERNS) {
      for (const piece of pattern.pieces) {
        const outline = nestingOutline(piece.cutPath);
        const ring = [...outline, outline[0]!];
        for (const p of samplePath(piece.cutPath)) {
          expect(pointInPolygon(p, outline) || distancePointToPolyline(p, ring) < 1e-6).toBe(true);
        }
      }
    }
  });
});

describe("preparePieces snapshot", () => {
  it.each(PATTERNS.filter(([name]) => name.endsWith(" M")))("lists the shapes of %s", (_, pattern) => {
    const summary = LAYOUTS.map((layout) => {
      const prepared = preparePieces(pattern, fabricOptionsSchema.parse({ layout }));
      return {
        layout,
        shapes: allShapes(prepared).map(
          (s) => `${s.id} ${s.bbox.lengthMm.toFixed(1)}x${s.bbox.widthMm.toFixed(1)}`,
        ),
        doesNotFit: prepared.doesNotFit.map((d) => d.pieceId),
      };
    });
    expect(summary).toMatchSnapshot();
  });
});
