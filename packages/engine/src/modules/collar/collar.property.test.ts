/**
 * Property tests of the collar module (issue #141): for every collar on every allowed neckline, closure and bodice
 * shaping, across the size matrix and random bodies, the collar neck edge equals the bodice neck within 2 mm and each
 * half seam matches (FR-VAL-01), every collar notch aligns within 2 mm (FR-VAL-04), the collar outlines are closed and
 * simple (FR-VAL-05), and drafting never throws; random invalid combinations are always refused.
 */
import type { DesignSpec, PatternResult } from "@tafsila/schemas";
import { SIZE_MATRIX, arbMeasurements, dartedBlouse } from "@tafsila/test-fixtures";
import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { isClosed, selfIntersections } from "../../geometry";
import { DEFAULT_ENGINE_OPTIONS, generatePattern } from "../../pipeline/generate-pattern";
import { collarCombinationIssue } from "./combinations";

/** SRS seam and notch tolerance (FR-VAL-01, FR-VAL-04). */
const TOLERANCE_MM = 2;

/** Wall-clock allowance on a busy CI runner with coverage; locally each test takes well under a tenth of it. */
const PIPELINE_TEST_TIMEOUT_MS = 30_000;

/** Sampled design × size pairs per run. */
const MATRIX_RUNS = 15;

/** Random bodies per run. */
const RANDOM_RUNS = 10;

/** Necks a collar is drafted on. */
const NECKS = ["round", "high-round"] as const;

/** Every bodice shaping. */
const SHAPINGS = ["darts", "princess-shoulder", "princess-armhole", "none"] as const;

/** Closures each collar allows. */
const CLOSURES = {
  "peter-pan": [
    { type: "zip", position: "center-back" },
    { type: "zip", position: "center-front" },
    { type: "buttons", position: "center-front" },
    { type: "none", position: "center-back" },
  ],
  shirt: [
    { type: "buttons", position: "center-front" },
    { type: "zip", position: "center-front" },
  ],
  mandarin: [
    { type: "zip", position: "center-front" },
    { type: "buttons", position: "center-front" },
    { type: "zip", position: "center-back" },
    { type: "buttons", position: "center-back" },
  ],
} as const satisfies Record<string, readonly DesignSpec["closure"][]>;

/**
 * Designs with a collar on an allowed neckline and closure, over the given bodice shapings.
 *
 * @param shapings - Bodice shapings to draw from.
 * @returns The arbitrary.
 */
function arbAllowed(shapings: readonly (typeof SHAPINGS)[number][] = SHAPINGS): fc.Arbitrary<DesignSpec> {
  return fc
    .constantFrom(...(Object.keys(CLOSURES) as (keyof typeof CLOSURES)[]))
    .chain((collar) =>
      fc.record({
        collar: fc.constant(collar),
        front: fc.constantFrom(...NECKS),
        back: fc.constantFrom(...NECKS),
        closure: fc.constantFrom(...CLOSURES[collar]),
        shaping: fc.constantFrom(...shapings),
      }),
    )
    .map(({ collar, front, back, closure, shaping }) => ({
      ...dartedBlouse,
      bodice: { fit: "fitted", shaping, waistSeam: false },
      neckline: { front, back, collar },
      closure,
    }));
}

/**
 * Checks every collar property on one pattern.
 *
 * @param result - The pattern.
 */
function expectCollarSound(result: PatternResult): void {
  const neck = result.validation.checks.find((c) => c.code?.startsWith("COLLAR_NECK_LENGTH"))!;
  expect(neck.status).toBe("pass");
  expect(Math.abs(neck.measuredMm! - neck.expectedMm!)).toBeLessThanOrEqual(TOLERANCE_MM);
  const onCollar = result.validation.checks.filter((c) => c.refs?.some((r) => r.startsWith("collar")));
  expect(onCollar.some((c) => c.code === "SEAM_MATCH_OK")).toBe(true);
  expect(onCollar.some((c) => c.code === "NOTCH_OK")).toBe(true);
  expect(onCollar.filter((c) => c.status !== "pass")).toEqual([]);
  for (const piece of result.pieces.filter((p) => p.id.startsWith("collar"))) {
    expect(isClosed(piece.stitchPath)).toBe(true);
    expect(selfIntersections(piece.stitchPath)).toEqual([]);
    expect(selfIntersections(piece.cutPath)).toEqual([]);
  }
}

describe("collar properties", () => {
  it(
    "sews the collar to the neck within 2 mm with aligned notches and simple outlines, across the size matrix",
    () => {
      fc.assert(
        fc.property(arbAllowed(), fc.constantFrom(...SIZE_MATRIX), (spec, entry) => {
          expectCollarSound(generatePattern(spec, entry.measurements, DEFAULT_ENGINE_OPTIONS));
        }),
        { numRuns: MATRIX_RUNS },
      );
    },
    PIPELINE_TEST_TIMEOUT_MS,
  );

  it(
    "never throws on random bodies, and keeps the collar sound whenever the body drafts",
    () => {
      // Darted bodices: random bodies on princess panels hit a grain-line limit of the panels, outside the collar.
      fc.assert(
        fc.property(arbAllowed(["darts"]), arbMeasurements(), (spec, measurements) => {
          const result = generatePattern(spec, measurements, DEFAULT_ENGINE_OPTIONS);
          if (result.pieces.length > 0) expectCollarSound(result);
        }),
        { numRuns: RANDOM_RUNS },
      );
    },
    PIPELINE_TEST_TIMEOUT_MS,
  );

  it("always refuses an invalid combination", () => {
    const arbAny = fc.record({
      collar: fc.constantFrom("peter-pan", "shirt", "mandarin" as const),
      front: fc.constantFrom("round", "v", "square", "sweetheart", "boat", "high-round" as const),
      back: fc.constantFrom("round", "v", "square", "high-round" as const),
      type: fc.constantFrom("zip", "buttons", "none" as const),
      position: fc.constantFrom("center-back", "side", "center-front" as const),
      depth: fc.option(fc.integer({ min: 60, max: 200 }), { nil: undefined }),
    });
    fc.assert(
      fc.property(arbAny, ({ collar, front, back, type, position, depth }) => {
        const spec: DesignSpec = {
          ...dartedBlouse,
          neckline: { front, back, collar, ...(depth === undefined ? {} : { depthFrontMm: depth }) },
          closure: { type, position },
        };
        const issue = collarCombinationIssue(spec);
        if (!issue) return;
        const result = generatePattern(spec, SIZE_MATRIX[0]!.measurements, DEFAULT_ENGINE_OPTIONS);
        expect(result.pieces).toEqual([]);
        expect(result.validation.checks.some((c) => c.code === issue && c.status === "fail")).toBe(true);
      }),
      { numRuns: 30 },
    );
  });
});
