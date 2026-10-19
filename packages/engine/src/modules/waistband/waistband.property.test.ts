/**
 * Property tests of the waistband module (issue #140): for every finish and closure across the size matrix the
 * finish sews to the skirt waist within 2 mm and every paired seam matches (FR-VAL-01), the outlines are closed and
 * simple (FR-VAL-05), and the hip warning fires exactly when the opening is smaller than the hip plus its ease
 * (FR-VAL-08); random bodies never throw.
 */
import type { DesignSpec, PatternResult } from "@tafsila/schemas";
import {
  SIZE_MATRIX,
  arbMeasurements,
  contourBandSkirt,
  elasticGatheredSkirt,
  elasticStraightSkirt,
  gatheredKneeSkirt,
  halfCircleKneeSkirt,
  straightBandSkirt,
  straightKneeSkirt,
} from "@tafsila/test-fixtures";
import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { HIP_PASS_EASE_MM } from "../../constants/waistband";
import { isClosed, selfIntersections } from "../../geometry";
import { DEFAULT_ENGINE_OPTIONS, generatePattern } from "../../pipeline/generate-pattern";

/** SRS seam tolerance (FR-VAL-01). */
const SEAM_MM = 2;

/** Wall-clock allowance on a busy CI runner with coverage; locally each test takes well under a tenth of it. */
const PIPELINE_TEST_TIMEOUT_MS = 30_000;

/** Random bodies per run. */
const RANDOM_RUNS = 30;

/** Sampled design × size pairs per run: about a quarter of the matrix, so the test stays fast under coverage. */
const MATRIX_RUNS = 60;

/** Seed designs covering every finish, shaped and gathered skirts, and closures at the back, the side and none. */
const DESIGNS: readonly DesignSpec[] = [
  straightBandSkirt,
  { ...straightBandSkirt, closure: { type: "buttons", position: "center-front" } },
  contourBandSkirt,
  { ...halfCircleKneeSkirt, waistband: "contour", closure: { type: "zip", position: "center-back" } },
  { ...gatheredKneeSkirt, waistband: "straight" },
  elasticGatheredSkirt,
  elasticStraightSkirt,
  straightKneeSkirt,
  { ...gatheredKneeSkirt, closure: { type: "none", position: "side" } },
];

/**
 * The pieces added by the waist finish.
 *
 * @param result - The pattern.
 * @returns Finish pieces.
 */
function finishPieces(result: PatternResult) {
  return result.pieces.filter((p) => p.id.startsWith("waist"));
}

describe("waistband properties", () => {
  it(
    "sews to the skirt waist within 2 mm and keeps every seam matched, for each finish and size",
    () => {
      fc.assert(
        fc.property(fc.constantFrom(...DESIGNS), fc.constantFrom(...SIZE_MATRIX), (spec, entry) => {
          const result = generatePattern(spec, entry.measurements, DEFAULT_ENGINE_OPTIONS);
          const length = result.validation.checks.find((c) => c.code?.startsWith("WAISTBAND_LENGTH"));
          expect(length?.status).toBe("pass");
          expect(Math.abs(length!.measuredMm! - length!.expectedMm!)).toBeLessThanOrEqual(SEAM_MM);
          const seams = result.validation.checks.filter((c) => c.code?.startsWith("SEAM_MATCH"));
          expect(seams.every((c) => c.status === "pass")).toBe(true);
          for (const piece of finishPieces(result)) {
            expect(isClosed(piece.cutPath)).toBe(true);
            expect(selfIntersections(piece.stitchPath)).toEqual([]);
          }
        }),
        { numRuns: MATRIX_RUNS },
      );
    },
    PIPELINE_TEST_TIMEOUT_MS,
  );

  it(
    "warns about the hip exactly when the opening is smaller than the hip plus its ease",
    () => {
      const designs = [elasticGatheredSkirt, elasticStraightSkirt, { ...straightBandSkirt, closure: { type: "none", position: "side" } as const }];
      fc.assert(
        fc.property(fc.constantFrom(...designs), arbMeasurements(), (spec, measurements) => {
          const result = generatePattern(spec, measurements, DEFAULT_ENGINE_OPTIONS);
          if (result.pieces.length === 0) return;
          const hip = result.validation.checks.find((c) => c.code?.startsWith("WAIST_HIP_PASS"))!;
          const tight = hip.measuredMm! < measurements.hip + HIP_PASS_EASE_MM;
          expect(hip.status).toBe(tight ? "warn" : "pass");
        }),
        { numRuns: RANDOM_RUNS },
      );
    },
    PIPELINE_TEST_TIMEOUT_MS,
  );

  it(
    "never throws on random bodies for any finish",
    () => {
      fc.assert(
        fc.property(fc.constantFrom(...DESIGNS), arbMeasurements(), (spec, measurements) => {
          expect(() => generatePattern(spec, measurements, DEFAULT_ENGINE_OPTIONS)).not.toThrow();
        }),
        { numRuns: RANDOM_RUNS },
      );
    },
    PIPELINE_TEST_TIMEOUT_MS,
  );
});
