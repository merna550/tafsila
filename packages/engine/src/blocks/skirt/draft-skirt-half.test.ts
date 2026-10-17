import fc from "fast-check";
import { describe, expect, it } from "vitest";
import type { EaseProfile, Measurements } from "@tafsila/schemas";
import {
  arbMeasurements,
  referenceDrafts,
  REFERENCE_SIZES,
  SIZE_MATRIX,
  straightKneeSkirt,
} from "@tafsila/test-fixtures";
import { DraftingError } from "../../errors/drafting-error";
import { distance, pathLength, selfIntersections } from "../../geometry";
import { resolveDraftInputs } from "../../resolve/resolve-draft-inputs";
import type { ResolvedDraftInputs } from "../../resolve/types";
import { deepFreeze } from "../../test-utils/deep-freeze";
import { SKIRT_SEGMENT } from "./edges";
import { draftSkirtHalf, type SkirtDraftInputs, type SkirtHalfDraft } from "./draft-skirt-half";

/** Tolerances from the issue and SRS §4.5, in mm. */
const KEY_POINT_TOL_MM = 1;
const CIRCUMFERENCE_TOL_MM = 5;
const SEAM_TOL_MM = 2;
const DART_LEG_TOL_MM = 1;

/**
 * Resolved inputs of the straight knee skirt for a body and ease profile.
 *
 * @param m - Measurements.
 * @param profile - Ease profile.
 * @returns The inputs.
 */
function inputsFor(m: Measurements, profile: EaseProfile = "regular"): ResolvedDraftInputs {
  return resolveDraftInputs(straightKneeSkirt, m, { easeProfile: profile });
}

/**
 * Both halves for a body.
 *
 * @param m - Measurements.
 * @param inputs - Resolved inputs.
 * @returns Front and back.
 */
function both(m: Measurements, inputs: SkirtDraftInputs): { front: SkirtHalfDraft; back: SkirtHalfDraft } {
  return {
    front: draftSkirtHalf({ half: "front", measurements: m, inputs }),
    back: draftSkirtHalf({ half: "back", measurements: m, inputs }),
  };
}

/**
 * Finished waist of a half: the waist line minus the dart.
 *
 * @param d - The half.
 * @returns Width in mm.
 */
function waistMm(d: SkirtHalfDraft): number {
  const dart = d.darts[0] ? distance(d.darts[0].legs[0], d.darts[0].legs[1]) : 0;
  return pathLength([d.stitchPath[SKIRT_SEGMENT.waist]!]) - dart;
}

/**
 * Side seam length of a half.
 *
 * @param d - The half.
 * @returns Length in mm.
 */
function sideMm(d: SkirtHalfDraft): number {
  return pathLength(d.stitchPath.slice(SKIRT_SEGMENT.sideCurve, SKIRT_SEGMENT.sideLine + 1));
}

/**
 * Hip width of a half, at the end of the side curve.
 *
 * @param d - The half.
 * @returns Width in mm.
 */
function hipMm(d: SkirtHalfDraft): number {
  return d.stitchPath[SKIRT_SEGMENT.sideCurve]!.to.x;
}

describe("draftSkirtHalf reference points (issue #129 AC 1)", () => {
  for (const size of REFERENCE_SIZES) {
    it(`matches every key point of size ${size} within 1 mm`, () => {
      const ref = { ...referenceDrafts[size].skirtFront, ...referenceDrafts[size].skirtBack };
      const m = SIZE_MATRIX.find((e) => e.id === `size-${size.toLowerCase()}`)!.measurements;
      const inputs: SkirtDraftInputs = {
        hipDepthMm: m.hipDepth,
        skirtLengthMm: m.waistToKnee,
        styleEaseMm: { skirtHip: 0, skirtWaist: 0 },
      };
      const { front, back } = both(m, inputs);
      const drafted = { ...front.keyPoints, ...back.keyPoints };
      const byName = (a: string, b: string): number => a.localeCompare(b);
      expect(Object.keys(drafted).sort(byName)).toEqual(Object.keys(ref).sort(byName));
      for (const [name, p] of Object.entries(ref)) {
        expect(Math.abs(drafted[name]!.x - p.x), name).toBeLessThanOrEqual(KEY_POINT_TOL_MM);
        expect(Math.abs(drafted[name]!.y - p.y), name).toBeLessThanOrEqual(KEY_POINT_TOL_MM);
      }
    });
  }
});

describe("draftSkirtHalf properties over the size matrix (AC 2–4)", () => {
  for (const entry of SIZE_MATRIX) {
    it(`${entry.id}: circumferences, side seams, dart legs and a clean outline`, () => {
      const m = entry.measurements;
      const inputs = resolveDraftInputs(straightKneeSkirt, m, { easeProfile: "regular" });
      const { front, back } = both(m, inputs);
      const waist = 2 * (waistMm(front) + waistMm(back));
      const hip = 2 * (hipMm(front) + hipMm(back));
      expect(Math.abs(waist - (m.waist + inputs.totalEaseMm.waist))).toBeLessThanOrEqual(
        CIRCUMFERENCE_TOL_MM,
      );
      expect(Math.abs(hip - (m.hip + inputs.totalEaseMm.hip))).toBeLessThanOrEqual(CIRCUMFERENCE_TOL_MM);
      expect(Math.abs(sideMm(front) - sideMm(back))).toBeLessThanOrEqual(SEAM_TOL_MM);
      for (const d of [front, back]) {
        expect(selfIntersections(d.stitchPath)).toEqual([]);
        for (const dart of d.darts) {
          const [l, r] = dart.legs;
          expect(Math.abs(distance(l, dart.apex) - distance(r, dart.apex))).toBeLessThanOrEqual(
            DART_LEG_TOL_MM,
          );
        }
      }
    });
  }

  it("holds for random bodies and every ease profile", () => {
    fc.assert(
      fc.property(
        arbMeasurements(),
        fc.constantFrom<EaseProfile>("fitted", "regular", "loose"),
        (m, profile) => {
          const atKnee = {
            ...straightKneeSkirt,
            skirt: { type: "straight" as const, length: "knee" as const, lengthMm: m.waistToKnee },
          };
          const inputs = resolveDraftInputs(atKnee, m, { easeProfile: profile });
          const { front, back } = both(m, inputs);
          const hip = 2 * (hipMm(front) + hipMm(back));
          const waist = 2 * (waistMm(front) + waistMm(back));
          expect(Math.abs(hip - (m.hip + inputs.totalEaseMm.hip))).toBeLessThanOrEqual(CIRCUMFERENCE_TOL_MM);
          expect(Math.abs(waist - (m.waist + inputs.totalEaseMm.waist))).toBeLessThanOrEqual(
            CIRCUMFERENCE_TOL_MM,
          );
          expect(Math.abs(sideMm(front) - sideMm(back))).toBeLessThanOrEqual(SEAM_TOL_MM);
          expect(selfIntersections(front.stitchPath)).toEqual([]);
          expect(selfIntersections(back.stitchPath)).toEqual([]);
        },
      ),
      { numRuns: 60 },
    );
  });
});

describe("draftSkirtHalf style ease", () => {
  const m = SIZE_MATRIX.find((e) => e.id === "size-m")!.measurements;

  it("widens the hip by exactly the style ease with `loose`", () => {
    const loose = inputsFor(m, "loose");
    const none: SkirtDraftInputs = { ...loose, styleEaseMm: { skirtHip: 0, skirtWaist: 0 } };
    const wide = both(m, loose);
    const base = both(m, none);
    const added = 2 * (hipMm(wide.front) + hipMm(wide.back) - hipMm(base.front) - hipMm(base.back));
    expect(added).toBeCloseTo(loose.styleEaseMm.skirtHip, 6);
  });

  it("can be narrower than the block with `fitted`, never below the body", () => {
    const fitted = inputsFor(m, "fitted");
    const { front, back } = both(m, fitted);
    const hip = 2 * (hipMm(front) + hipMm(back));
    expect(fitted.styleEaseMm.skirtHip).toBeLessThan(0);
    expect(hip).toBeGreaterThanOrEqual(m.hip);
  });
});

describe("draftSkirtHalf edge cases", () => {
  const m = SIZE_MATRIX.find((e) => e.id === "size-m")!.measurements;
  const inputs = inputsFor(m);

  it("omits the dart, never a negative one, when the waist is as wide as the hip", () => {
    const apple: Measurements = { ...m, waist: m.hip + 40 };
    const { front, back } = both(apple, inputsFor(apple));
    expect(front.darts).toEqual([]);
    expect(back.darts).toEqual([]);
    expect(front.keyPoints["skirt.front.dartApex"]).toBeUndefined();
    expect(selfIntersections(front.stitchPath)).toEqual([]);
  });

  it("names the cf and cb edges by half, with a fold or a seam", () => {
    const front = draftSkirtHalf({ half: "front", measurements: m, inputs, centreSeam: true });
    const backFold = draftSkirtHalf({ half: "back", measurements: m, inputs });
    const backSeam = draftSkirtHalf({ half: "back", measurements: m, inputs, centreSeam: true });
    expect(front.edges.find((e) => e.id === "cf")?.kind).toBe("fold");
    expect(backFold.edges.find((e) => e.id === "cb")?.kind).toBe("fold");
    expect(backSeam.edges.find((e) => e.id === "cb")).toMatchObject({ kind: "other" });
    expect(front.edges.find((e) => e.id === "side")?.pairsWith).toEqual({
      pieceId: "skirt-back",
      edgeId: "side",
      intendedEaseMm: 0,
    });
  });

  it("throws a coded error without a length or with a hem above the hip line", () => {
    const run = (skirtLengthMm: number | undefined): unknown => {
      try {
        draftSkirtHalf({ half: "front", measurements: m, inputs: { ...inputs, skirtLengthMm } });
      } catch (e) {
        return e;
      }
      return undefined;
    };
    expect(run(undefined)).toMatchObject({ code: "SKIRT_LENGTH_MISSING" });
    expect(run(m.hipDepth)).toBeInstanceOf(DraftingError);
    expect(run(m.hipDepth)).toMatchObject({ code: "SKIRT_SHORTER_THAN_HIP_DEPTH" });
  });

  it("is pure: same output for frozen input", () => {
    const frozen = deepFreeze(structuredClone({ m, inputs }));
    const a = draftSkirtHalf({ half: "back", measurements: frozen.m, inputs: frozen.inputs });
    expect(a).toEqual(draftSkirtHalf({ half: "back", measurements: m, inputs }));
  });
});
