import { describe, expect, it } from "vitest";
import type { DesignSpec } from "@tafsila/schemas";
import { SIZE_MATRIX, straightKneeSkirt } from "@tafsila/test-fixtures";
import { DEFAULT_ENGINE_OPTIONS, generatePattern } from "../../pipeline/generate-pattern";
import { defaultRegistry } from "../../pipeline/default-registry";
import { expectSvgSnapshot } from "../../render/expect-svg-snapshot";
import { skirtBlockModule } from "./skirt-module";
import { withoutWaistFinish } from "../../test-utils/piece-ids";

/** Chart sizes, one snapshot each. */
const CHART = SIZE_MATRIX.filter((e) => e.source === "chart");

/** The same skirt with a centre-back zip. */
const centreBackZip: DesignSpec = { ...straightKneeSkirt, closure: { type: "zip", position: "center-back" } };

const sizeM = SIZE_MATRIX.find((e) => e.id === "size-m")!.measurements;

describe("skirtBlockModule", () => {
  it("applies only to designs with a skirt", () => {
    const noSkirt: DesignSpec = { ...straightKneeSkirt, skirt: undefined };
    expect(skirtBlockModule.appliesTo(straightKneeSkirt)).toBe(true);
    expect(skirtBlockModule.appliesTo(noSkirt)).toBe(false);
  });

  it("adds a front and a back cut on the fold with a side zip", () => {
    const result = generatePattern(straightKneeSkirt, sizeM, DEFAULT_ENGINE_OPTIONS, defaultRegistry);
    expect(withoutWaistFinish(result.pieces).map((p) => [p.id, p.cut.onFold, p.cut.quantity])).toEqual([
      ["skirt-front", true, 1],
      ["skirt-back", true, 1],
    ]);
  });

  it("cuts two mirrored backs with a cb seam for a centre-back zip, at the zip allowance (#143)", () => {
    const result = generatePattern(centreBackZip, sizeM, DEFAULT_ENGINE_OPTIONS, defaultRegistry);
    const back = result.pieces.find((p) => p.id === "skirt-back")!;
    expect(back.cut).toEqual({ quantity: 2, onFold: false, mirror: true, fabric: "main" });
    expect(back.edges.find((e) => e.id === "cb")).toMatchObject({ kind: "other", seamAllowanceMm: 20 });
  });

  it("leaves no seam allowance on the fold and the default allowance elsewhere (20 on the side zip seam, #143)", () => {
    const result = generatePattern(straightKneeSkirt, sizeM, DEFAULT_ENGINE_OPTIONS, defaultRegistry);
    const front = result.pieces.find((p) => p.id === "skirt-front")!;
    const allowance = Object.fromEntries(front.edges.map((e) => [e.id, e.seamAllowanceMm]));
    expect(allowance).toEqual({ waist: 15, side: 20, hem: 30, cf: 0 });
  });
});

describe("straight skirt SVG snapshot", () => {
  for (const entry of CHART) {
    it(`straight skirt ${entry.id}`, async () => {
      const result = generatePattern(
        straightKneeSkirt,
        entry.measurements,
        DEFAULT_ENGINE_OPTIONS,
        defaultRegistry,
      );
      expect(result.validation.status).not.toBe("fail");
      await expectSvgSnapshot(result);
    });
  }
});
