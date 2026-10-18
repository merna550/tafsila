/** Property tests of the set-in sleeve (issue #134): FR-VAL-01, -02, -04 and geometry across the size matrix. */
import type { EaseProfile, Measurements, PatternResult, ValidationCheck } from "@tafsila/schemas";
import { SIZE_MATRIX, arbMeasurements, setInSleeveBlouse } from "@tafsila/test-fixtures";
import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { SLEEVE_CAP_EASE_MAX_MM, SLEEVE_CAP_EASE_MIN_MM } from "../../constants/validation";
import { isClosed, selfIntersections } from "../../geometry";
import { DEFAULT_ENGINE_OPTIONS, generatePattern } from "../../pipeline/generate-pattern";
import { deepFreeze } from "../../test-utils/deep-freeze";
import type { SleeveLength } from "./types";

const LENGTHS: readonly SleeveLength[] = ["cap", "short", "elbow", "three-quarter", "long"];
const PROFILES: readonly EaseProfile[] = ["fitted", "regular", "loose"];
const CASES = SIZE_MATRIX.flatMap((e) =>
  LENGTHS.flatMap((length) => PROFILES.map((profile) => ({ id: e.id, m: e.measurements, length, profile }))),
);
/** Two runs per body; fast-check picks the length and profile per run (about 2 s locally, a third of the 375 cases). */
const SAMPLED = { numRuns: SIZE_MATRIX.length * 2 };
/** Wall-clock allowance on a busy CI runner; locally the slowest test takes well under a third of it. */
const PIPELINE_TEST_TIMEOUT_MS = 30_000;

/** SRS tolerances. */
const SEAM_MM = 2;
const NOTCH_MM = 2;

/**
 * Generates the seed blouse with a set-in sleeve of the given length.
 *
 * @param m - Measurements.
 * @param length - Sleeve length.
 * @param profile - Ease profile.
 * @returns The pattern.
 */
function blouse(m: Measurements, length: SleeveLength, profile: EaseProfile = "regular"): PatternResult {
  const spec = { ...setInSleeveBlouse, sleeve: { ...setInSleeveBlouse.sleeve!, length } };
  return generatePattern(spec, m, { ...DEFAULT_ENGINE_OPTIONS, easeProfile: profile });
}

/**
 * The checks of one rule that name the sleeve.
 *
 * @param r - Pattern.
 * @param id - Rule id.
 * @returns Matching checks.
 */
function sleeveChecks(r: PatternResult, id: ValidationCheck["id"]): ValidationCheck[] {
  return r.validation.checks.filter((c) => c.id === id && c.refs?.some((ref) => ref.startsWith("sleeve/")));
}

describe("set-in sleeve over the size matrix, every length and ease profile", () => {
  it(
    "keeps the cap ease in 10-40 mm, the seams within 2 mm, the notches within 2 mm and the outline clean",
    () => {
      fc.assert(
        fc.property(fc.constantFrom(...CASES), ({ m, length, profile }) => {
          const r = blouse(m, length, profile);
          const [cap] = sleeveChecks(r, "FR-VAL-02");
          expect(cap).toMatchObject({ code: "SLEEVE_CAP_OK", status: "pass" });
          expect(cap!.measuredMm!).toBeGreaterThanOrEqual(SLEEVE_CAP_EASE_MIN_MM);
          expect(cap!.measuredMm!).toBeLessThanOrEqual(SLEEVE_CAP_EASE_MAX_MM);
          const seams = sleeveChecks(r, "FR-VAL-01");
          expect(seams).toHaveLength(3);
          for (const seam of seams) {
            expect(Math.abs(seam.measuredMm! - seam.expectedMm!), seam.refs!.join(" ")).toBeLessThanOrEqual(
              SEAM_MM,
            );
          }
          const notches = sleeveChecks(r, "FR-VAL-04");
          expect(notches).toHaveLength(4);
          for (const notch of notches) {
            expect(notch.measuredMm!, notch.refs!.join(" ")).toBeLessThanOrEqual(NOTCH_MM);
          }
          const sleeve = r.pieces.find((p) => p.id === "sleeve")!;
          expect(isClosed(sleeve.stitchPath)).toBe(true);
          expect(selfIntersections(sleeve.stitchPath)).toEqual([]);
          expect(selfIntersections(sleeve.cutPath)).toEqual([]);
        }),
        SAMPLED,
      );
    },
    PIPELINE_TEST_TIMEOUT_MS,
  );
});

describe("set-in sleeve over random bodies", () => {
  it(
    "drafts a passing sleeve or reports a coded input failure, never throws",
    () => {
      fc.assert(
        fc.property(arbMeasurements(), fc.constantFrom(...LENGTHS), (m, length) => {
          const r = blouse(m, length);
          if (r.pieces.length === 0) {
            expect(r.validation.status).toBe("fail");
            expect(r.validation.checks.some((c) => /^(BODICE_|SLEEVE_|MEAS_)/.test(c.code ?? ""))).toBe(true);
            return;
          }
          for (const id of ["FR-VAL-01", "FR-VAL-02", "FR-VAL-04"] as const) {
            expect(
              sleeveChecks(r, id).every((c) => c.status === "pass"),
              id,
            ).toBe(true);
          }
        }),
        { numRuns: 50 },
      );
    },
    PIPELINE_TEST_TIMEOUT_MS,
  );

  it("is deterministic and never mutates its input", () => {
    fc.assert(
      fc.property(fc.constantFrom(...SIZE_MATRIX), fc.constantFrom(...LENGTHS), (entry, length) => {
        const m = deepFreeze(structuredClone(entry.measurements));
        expect(blouse(m, length)).toEqual(blouse(m, length));
      }),
      { numRuns: 20 },
    );
  });
});
