import fc from "fast-check";
import { describe, expect, it } from "vitest";
import type { DesignSpec, EaseProfile, Measurements } from "@tafsila/schemas";
import {
  arbMeasurements,
  egyptianSizeChart,
  referenceDrafts,
  vNeckHalfCircleDress,
} from "@tafsila/test-fixtures";
import {
  BLOCK_BUILT_IN_EASE_MM,
  BODICE_FIT_MODIFIER_MM,
  EASE_TOTAL_MM,
  type BodiceFit,
} from "../constants/ease";
import { DraftingError } from "../errors/drafting-error";
import { fromStandardSize } from "../measurements";
import { deepFreeze } from "../test-utils/deep-freeze";
import { resolveDraftInputs } from "./resolve-draft-inputs";

const M = fromStandardSize(egyptianSizeChart, "M");
const PROFILES: EaseProfile[] = ["fitted", "regular", "loose"];
const FITS: BodiceFit[] = ["fitted", "semi-fitted", "loose"];

/**
 * Builds a spec with the given bodice fit and optional skirt.
 *
 * @param fit - Bodice fit.
 * @param skirt - Skirt part, if any.
 * @returns The spec.
 */
function spec(fit: BodiceFit, skirt?: DesignSpec["skirt"]): DesignSpec {
  const base: DesignSpec = { ...vNeckHalfCircleDress, bodice: { shaping: "none", waistSeam: true, fit } };
  delete base.skirt;
  return skirt ? { ...base, skirt } : base;
}

/**
 * Builds a skirt of the given length name.
 *
 * @param length - Named length.
 * @param lengthMm - Optional explicit length.
 * @returns The skirt part.
 */
function skirtOf(length: NonNullable<DesignSpec["skirt"]>["length"], lengthMm?: number): DesignSpec["skirt"] {
  return { type: "straight", length, ...(lengthMm === undefined ? {} : { lengthMm }) };
}

describe("resolveDraftInputs ease", () => {
  it("regular + semi-fitted, size M gives the SRS example widths", () => {
    const r = resolveDraftInputs(spec("semi-fitted"), M, { easeProfile: "regular" });
    expect(r.bustQuarterMm).toBeCloseTo(260, 2);
    expect(r.bodiceWaistQuarterMm).toBeCloseTo(205, 2);
    expect(r.hipQuarterMm).toBeCloseTo(272.5, 2);
    expect(r.skirtWaistQuarterMm).toBeCloseTo(205, 2);
    expect(r.styleEaseMm).toEqual({
      bust: 0,
      bodiceWaist: 0,
      skirtHip: 10,
      skirtWaist: 20,
      sleeveBicep: 0,
      acrossBack: 0,
    });
    expect(r.sleeveBicepHalfMm).toBeCloseTo((M.upperArm + 50) / 2, 2);
    expect(r.sleeveWristHalfMm).toBeCloseTo((M.wrist + 30) / 2, 2);
    expect(r.backLengthMm).toBe(M.backLength);
  });

  it("combines profile and fit: fitted+fitted and loose+loose", () => {
    const tight = resolveDraftInputs(spec("fitted"), M, { easeProfile: "fitted" });
    expect(tight.totalEaseMm).toMatchObject({ bust: 50, waist: 10, hip: 20 });
    const wide = resolveDraftInputs(spec("loose"), M, { easeProfile: "loose" });
    expect(wide.totalEaseMm).toMatchObject({ bust: 150, waist: 100, hip: 110 });
  });

  it("uses semi-fitted when the spec has no bodice", () => {
    const noBodice = spec("loose");
    delete noBodice.bodice;
    const r = resolveDraftInputs(noBodice, M, { easeProfile: "regular" });
    expect(r.bodiceFit).toBe("semi-fitted");
    expect(r.totalEaseMm.bust).toBe(80);
  });

  it("throws FABRIC_NOT_SUPPORTED for non-woven fabric", () => {
    const knit = { ...spec("fitted"), fabricType: "knit" } as unknown as DesignSpec;
    expect(() => resolveDraftInputs(knit, M, { easeProfile: "regular" })).toThrow(
      expect.objectContaining({ code: "FABRIC_NOT_SUPPORTED" }),
    );
  });

  it("has finite, non-negative cells and widens fitted <= regular <= loose", () => {
    for (const line of Object.keys(EASE_TOTAL_MM.regular) as (keyof typeof EASE_TOTAL_MM.regular)[]) {
      const [a, b, c] = PROFILES.map((p) => EASE_TOTAL_MM[p][line]);
      expect(a).toBeGreaterThanOrEqual(0);
      expect(a).toBeLessThanOrEqual(b!);
      expect(b).toBeLessThanOrEqual(c!);
    }
    expect(Object.values(BODICE_FIT_MODIFIER_MM).every(Number.isFinite)).toBe(true);
  });

  it("matches the ease built into the #122 reference drafts", () => {
    const m = egyptianSizeChart.M!;
    const draft = referenceDrafts.M;
    const bust = draft.bodiceBack["bodice.back.underarm"]!.x * 4 - m.bust;
    const hip = draft.skirtBack["skirt.back.hipSide"]!.x * 4 - m.hip;
    expect(bust).toBe(BLOCK_BUILT_IN_EASE_MM.bust);
    expect(hip).toBe(BLOCK_BUILT_IN_EASE_MM.skirtHip);
  });
});

describe("resolveDraftInputs skirt length", () => {
  const length = (s: DesignSpec["skirt"], m: Measurements = M) =>
    resolveDraftInputs(spec("semi-fitted", s), m, { easeProfile: "regular" }).skirtLengthMm;

  it("resolves the five named lengths for size M", () => {
    expect(length(skirtOf("mini"))).toBeCloseTo(390, 2);
    expect(length(skirtOf("knee"))).toBeCloseTo(570, 2);
    expect(length(skirtOf("midi"))).toBeCloseTo(742, 2);
    expect(length(skirtOf("ankle"))).toBeCloseTo(935.5, 2);
    expect(length(skirtOf("floor"))).toBeCloseTo(980, 2);
  });

  it("lets an explicit lengthMm win and leaves no skirt undefined", () => {
    expect(length(skirtOf("floor", 650))).toBe(650);
    expect(resolveDraftInputs(spec("fitted"), M, { easeProfile: "regular" }).skirtLengthMm).toBeUndefined();
  });

  it("throws on lengths outside the body and on a body with no knee-to-floor gap", () => {
    for (const mm of [90, 1100]) {
      expect(() => length(skirtOf("knee", mm))).toThrow(
        expect.objectContaining({ code: "SKIRT_LENGTH_OUT_OF_BODY" }),
      );
    }
    const short: Measurements = { ...M, waistToKnee: 700, waistToFloor: 800 };
    expect(() => length(skirtOf("midi"), short)).toThrow(
      expect.objectContaining({ code: "SKIRT_LENGTH_INVALID_BODY" }),
    );
    expect(() => length(skirtOf("midi"), short)).toThrow(DraftingError);
  });
});

describe("resolveDraftInputs properties", () => {
  const arbFit = fc.constantFrom(...FITS);

  it("widths never shrink from fitted to regular to loose", () => {
    fc.assert(
      fc.property(arbMeasurements(), arbFit, (m, fit) => {
        const a = resolveDraftInputs(spec(fit), m, { easeProfile: "fitted" });
        const b = resolveDraftInputs(spec(fit), m, { easeProfile: "regular" });
        const c = resolveDraftInputs(spec(fit), m, { easeProfile: "loose" });
        for (const key of [
          "bustQuarterMm",
          "bodiceWaistQuarterMm",
          "hipQuarterMm",
          "skirtWaistQuarterMm",
          "sleeveBicepHalfMm",
        ] as const) {
          expect(a[key]).toBeLessThanOrEqual(b[key]);
          expect(b[key]).toBeLessThanOrEqual(c[key]);
        }
      }),
    );
  });

  it("never gives negative ease or a width below the body", () => {
    fc.assert(
      fc.property(arbMeasurements(), arbFit, fc.constantFrom(...PROFILES), (m, fit, p) => {
        const r = resolveDraftInputs(spec(fit), m, { easeProfile: p });
        expect(Object.values(r.totalEaseMm).every((v) => v >= 0)).toBe(true);
        expect(r.bustQuarterMm).toBeGreaterThanOrEqual(m.bust / 4);
        expect(r.hipQuarterMm).toBeGreaterThanOrEqual(m.hip / 4);
        expect(r.skirtWaistQuarterMm).toBeGreaterThanOrEqual(m.waist / 4);
        expect(r.sleeveBicepHalfMm).toBeGreaterThanOrEqual(m.upperArm / 2);
      }),
    );
  });

  it("keeps every named length inside the body and in order", () => {
    fc.assert(
      fc.property(arbMeasurements(), (m) => {
        fc.pre(m.waistToFloor - m.waistToKnee >= 150);
        const [mini, knee, midi, ankle, floor] = (["mini", "knee", "midi", "ankle", "floor"] as const).map(
          (n) => length(skirtOf(n), m)!,
        );
        expect(mini).toBeGreaterThan(0);
        expect(mini!).toBeLessThan(knee!);
        expect(knee!).toBeLessThan(midi!);
        expect(midi!).toBeLessThan(ankle!);
        expect(ankle!).toBeLessThan(floor!);
        expect(floor!).toBeLessThanOrEqual(m.waistToFloor);
      }),
    );
    function length(s: DesignSpec["skirt"], m: Measurements) {
      return resolveDraftInputs(spec("semi-fitted", s), m, { easeProfile: "regular" }).skirtLengthMm;
    }
  });

  it("is pure: same result twice, frozen inputs do not throw", () => {
    fc.assert(
      fc.property(arbMeasurements(), arbFit, fc.constantFrom(...PROFILES), (m, fit, p) => {
        const s = deepFreeze(spec(fit));
        const frozen = deepFreeze({ ...m });
        expect(resolveDraftInputs(s, frozen, { easeProfile: p })).toEqual(
          resolveDraftInputs(s, frozen, { easeProfile: p }),
        );
      }),
    );
  });
});
