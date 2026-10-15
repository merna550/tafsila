/** Tests of the reference drafts (issue #122): complete, finite, in step with the calculation, and sane. */
import { describe, expect, it } from "vitest";
import { egyptianSizeChart } from "./egyptian-size-chart";
import { allDrafts } from "./gen-reference-drafts";
import { referenceDrafts } from "./reference-drafts";
import { REFERENCE_BLOCKS, REFERENCE_SIZES } from "./reference-drafts-sizes";

const EXPECTED_NAMES = {
  bodiceBack: [
    "nape",
    "neckPoint",
    "shoulderTip",
    "backWidthPoint",
    "scyeLineCB",
    "underarm",
    "waistCB",
    "sideWaist",
    "waistDartLeft",
    "waistDartRight",
    "waistDartApex",
  ].map((n) => `bodice.back.${n}`),
  bodiceFront: [
    "neckPoint",
    "neckCF",
    "shoulderTip",
    "chestWidthPoint",
    "scyeLineCF",
    "underarm",
    "bustPoint",
    "bustDartUpper",
    "bustDartLower",
    "waistCF",
    "sideWaist",
    "waistDartLeft",
    "waistDartRight",
    "waistDartApex",
  ].map((n) => `bodice.front.${n}`),
  skirtBack: [
    "waistCentre",
    "waistSide",
    "dartLeft",
    "dartRight",
    "dartApex",
    "hipCentre",
    "hipSide",
    "hemCentre",
    "hemSide",
  ].map((n) => `skirt.back.${n}`),
  skirtFront: [
    "waistCentre",
    "waistSide",
    "dartLeft",
    "dartRight",
    "dartApex",
    "hipCentre",
    "hipSide",
    "hemCentre",
    "hemSide",
  ].map((n) => `skirt.front.${n}`),
  sleeve: ["capTop", "underarmBack", "underarmFront", "wristBack", "wristFront", "wristCentre"].map(
    (n) => `sleeve.${n}`,
  ),
};

/**
 * Compare function for key point names.
 *
 * @param a - First name.
 * @param b - Second name.
 * @returns Sort order.
 */
function byName(a: string, b: string): number {
  return a.localeCompare(b);
}

/** Tolerance for rounding to 0.1 mm. */
const ROUNDING_MM = 0.05;

describe("referenceDrafts", () => {
  it.each(REFERENCE_SIZES)("size %s has every key point of every block, finite", (size) => {
    for (const block of REFERENCE_BLOCKS) {
      expect(Object.keys(referenceDrafts[size][block]).sort(byName)).toEqual(
        [...EXPECTED_NAMES[block]].sort(byName),
      );
      for (const point of Object.values(referenceDrafts[size][block])) {
        expect(Number.isFinite(point.x) && Number.isFinite(point.y)).toBe(true);
      }
    }
  });

  it("equals the calculation (regenerate with gen-reference-drafts.ts when the method changes)", () => {
    const drafts = allDrafts();
    for (const size of REFERENCE_SIZES) {
      for (const block of REFERENCE_BLOCKS) {
        expect(referenceDrafts[size][block]).toEqual(drafts[size][block]);
      }
    }
  });

  it.each(REFERENCE_SIZES)("size %s: widths are the measurement quarter plus the documented ease", (size) => {
    const m = egyptianSizeChart[size]!;
    const d = referenceDrafts[size];
    expect(Math.abs(d.bodiceBack["bodice.back.underarm"]!.x - (m.bust / 4 + 20))).toBeLessThan(ROUNDING_MM);
    expect(Math.abs(d.bodiceFront["bodice.front.underarm"]!.x - (m.bust / 4 + 20))).toBeLessThan(ROUNDING_MM);
    expect(Math.abs(d.skirtBack["skirt.back.hipSide"]!.x - (m.hip / 4 + 10))).toBeLessThan(ROUNDING_MM);
  });

  it.each(REFERENCE_SIZES)(
    "size %s: skirt hip line is at hipDepth, hem at waistToKnee, sleeve ends at armLength",
    (size) => {
      const m = egyptianSizeChart[size]!;
      const d = referenceDrafts[size];
      expect(d.skirtFront["skirt.front.hipSide"]!.y).toBe(m.hipDepth);
      expect(d.skirtBack["skirt.back.hemCentre"]!.y).toBe(m.waistToKnee);
      expect(d.sleeve["sleeve.wristCentre"]!.y).toBe(m.armLength);
    },
  );

  it.each(REFERENCE_SIZES)(
    "size %s: the bust point is the measured one and darts are ordered left to right",
    (size) => {
      const m = egyptianSizeChart[size]!;
      const front = referenceDrafts[size].bodiceFront;
      expect(front["bodice.front.bustPoint"]).toEqual({ x: m.bustPointDistance / 2, y: m.bustHeight });
      expect(front["bodice.front.waistDartLeft"]!.x).toBeLessThan(front["bodice.front.waistDartRight"]!.x);
      expect(front["bodice.front.bustDartUpper"]!.y).toBeLessThan(front["bodice.front.bustDartLower"]!.y);
    },
  );
});
