/** Tests for the version comparison (issue #345). */
import type { DesignSpec, Measurements } from "@tafsila/schemas";
import { describe, expect, it } from "vitest";
import { diffVersions, flattenSpec, type ComparableVersion } from "./diff-versions";

const SPEC: DesignSpec = {
  schemaVersion: 1,
  category: "blouse",
  fabricType: "woven",
  bodice: { fit: "fitted", shaping: "darts", waistSeam: false },
  sleeve: { type: "set-in", length: "short", cuff: "none" },
  closure: { type: "zip", position: "center-back" },
  pockets: [],
  lining: false,
};
const MEASUREMENTS = { unit: "mm", bust: 920, waist: 700, hip: 980 } as unknown as Measurements;
const BASE: ComparableVersion = { spec: SPEC, measurements: MEASUREMENTS, easeProfile: "regular" };

describe("diffVersions", () => {
  it("returns nothing for the same inputs", () => {
    expect(diffVersions(BASE, { ...BASE })).toEqual([]);
  });

  it("returns one line with both values for a sleeve length change", () => {
    const b = {
      ...BASE,
      spec: { ...SPEC, sleeve: { type: "set-in", length: "long", cuff: "none" } },
    } as ComparableVersion;
    expect(diffVersions(BASE, b)).toEqual([
      { group: "feature", key: "sleeve_length", from: "short", to: "long" },
    ]);
  });

  it("lists an added pocket as a change of the pockets line", () => {
    const b = { ...BASE, spec: { ...SPEC, pockets: ["patch"] } } as ComparableVersion;
    expect(diffVersions(BASE, b)).toEqual([{ group: "feature", key: "pockets", from: "", to: "patch" }]);
  });

  it("lists changed measurements and ease after the features, in a stable order", () => {
    const b: ComparableVersion = {
      spec: { ...SPEC, lining: true },
      measurements: { ...MEASUREMENTS, waist: 720 },
      easeProfile: "loose",
    };
    expect(diffVersions(BASE, b).map((d) => `${d.group}:${d.key}`)).toEqual([
      "feature:lining",
      "measurement:waist",
      "ease:ease",
    ]);
  });

  it("shows a missing part as undefined", () => {
    const b = { ...BASE, spec: { ...SPEC, sleeve: undefined } } as ComparableVersion;
    const keys = diffVersions(BASE, b).map((d) => [d.key, d.to]);
    expect(keys).toContainEqual(["sleeve_length", undefined]);
  });
});

describe("flattenSpec", () => {
  it("reads a slit as its position and no slit as none", () => {
    const skirt = { type: "straight", length: "knee" } as const;
    expect(flattenSpec({ ...SPEC, skirt }).skirt_slit).toBe("none");
    expect(
      flattenSpec({ ...SPEC, skirt: { ...skirt, slit: { position: "back", lengthMm: 200 } } }).skirt_slit,
    ).toBe("back");
  });
});
