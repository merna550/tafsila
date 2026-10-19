/** Tests of the set-in sleeve module (issue #134): registration, pipeline output, validation, sleeveless armholes. */
import { patternResultSchema, type DesignSpec } from "@tafsila/schemas";
import { dartedBlouse, setInSleeveBlouse, sizeM, straightKneeSkirt } from "@tafsila/test-fixtures";
import { describe, expect, it } from "vitest";
import { createContext } from "../../pipeline/draft-context";
import { defaultRegistry } from "../../pipeline/default-registry";
import { DEFAULT_ENGINE_OPTIONS, generatePattern } from "../../pipeline/generate-pattern";
import { setInSleeveModule } from "./module";
import { sortedIds, withFacings } from "../../test-utils/piece-ids";

/**
 * The sleeve seed blouse with another sleeve type.
 *
 * @param type - Sleeve type.
 * @returns The design.
 */
const withSleeveType = (type: NonNullable<DesignSpec["sleeve"]>["type"]): DesignSpec => ({
  ...setInSleeveBlouse,
  sleeve: { ...setInSleeveBlouse.sleeve!, type },
});

describe("setInSleeveModule", () => {
  it("is registered and applies only to set-in sleeves", () => {
    expect(defaultRegistry.modules.map((m) => m.id)).toContain("sleeve/set-in");
    expect(setInSleeveModule.appliesTo(setInSleeveBlouse)).toBe(true);
    for (const type of ["none", "cap", "puff", "bishop", "flutter"] as const) {
      expect(setInSleeveModule.appliesTo(withSleeveType(type)), type).toBe(false);
    }
    expect(setInSleeveModule.appliesTo(straightKneeSkirt)).toBe(false);
  });

  it("adds a schema-valid sleeve and passes the seam, cap and notch checks", () => {
    const result = generatePattern(setInSleeveBlouse, sizeM);
    expect(patternResultSchema.safeParse(result).success).toBe(true);
    expect(sortedIds(result.pieces)).toEqual(withFacings(["bodice-back", "bodice-front", "sleeve"]));
    const checks = result.validation.checks;
    for (const id of ["FR-VAL-01", "FR-VAL-02", "FR-VAL-04"]) {
      const rows = checks.filter((c) => c.id === id);
      expect(rows.length, id).toBeGreaterThan(0);
      expect(
        rows.every((c) => c.status === "pass"),
        id,
      ).toBe(true);
    }
    expect(checks.filter((c) => c.id === "FR-VAL-04")).toHaveLength(4);
    expect(result.validation.status).not.toBe("fail");
  });

  it("leaves a sleeveless armhole finished: no sleeve, no armhole notches", () => {
    const result = generatePattern(dartedBlouse, sizeM);
    expect(sortedIds(result.pieces)).toEqual(withFacings(["bodice-back", "bodice-front"]));
    expect(result.pieces.every((p) => p.notches.length === 0)).toBe(true);
    expect(result.pieces[0]!.edges.find((e) => e.id === "armhole")!.seamAllowanceMm).toBeGreaterThan(0);
  });

  it("needs the bodice block first", () => {
    const ctx = createContext(setInSleeveBlouse, sizeM, DEFAULT_ENGINE_OPTIONS);
    expect(() => setInSleeveModule.draft(ctx)).toThrow(
      expect.objectContaining({ code: "PIPELINE_STEP_ORDER" }),
    );
  });

  it("reports a body no cap can fit as a failed input check", () => {
    const result = generatePattern(setInSleeveBlouse, { ...sizeM, upperArm: 500 });
    expect(result.validation.status).toBe("fail");
    expect(result.validation.checks).toContainEqual(
      expect.objectContaining({ id: "FR-MEAS-01", code: "SLEEVE_CAP_UNSOLVABLE", status: "fail" }),
    );
  });
});
