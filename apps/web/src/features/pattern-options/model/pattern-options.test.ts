import { EASE_TOTAL_MM } from "@tafsila/engine/measurements";
import { DEFAULT_SEAM_ALLOWANCE_MM, type MeasurementSet, type PatternVersion } from "@tafsila/schemas";
import { describe, expect, it } from "vitest";
import {
  autoSelection,
  defaultPatternOptions,
  easeRows,
  fromVersion,
  isDefaultSeamAllowance,
  withClient,
  withSeamAllowance,
} from "./pattern-options";

const set = (id: string) => ({ id }) as MeasurementSet;

describe("pattern options model", () => {
  it("starts with regular ease, default allowances and 140 cm", () => {
    const value = defaultPatternOptions();
    expect(value).toMatchObject({ clientId: null, easeProfile: "regular", fabricWidthMm: 1400 });
    expect(value.seamAllowanceMm).toEqual(DEFAULT_SEAM_ALLOWANCE_MM);
  });

  it("reads the ease rows from the engine table in cm", () => {
    const fitted = easeRows("fitted");
    expect(fitted).toEqual({
      bust: EASE_TOTAL_MM.fitted.bust / 10,
      waist: EASE_TOTAL_MM.fitted.waist / 10,
      hip: EASE_TOTAL_MM.fitted.hip / 10,
    });
  });

  it("chooses the newest set with the client and drops it without sets", () => {
    const base = { ...defaultPatternOptions(), measurementSetId: "old" };
    expect(withClient(base, "c1", [set("new"), set("older")]).measurementSetId).toBe("new");
    expect(withClient(base, "c2", []).measurementSetId).toBeNull();
  });

  it("edits one allowance in mm and detects the defaults", () => {
    const edited = withSeamAllowance(defaultPatternOptions(), "hem", 25);
    expect(edited.seamAllowanceMm.hem).toBe(25);
    expect(isDefaultSeamAllowance(edited)).toBe(false);
    expect(isDefaultSeamAllowance(defaultPatternOptions())).toBe(true);
  });

  it("round-trips the options stored with a version", () => {
    const value = withSeamAllowance(
      { ...defaultPatternOptions(), easeProfile: "loose", measurementSetId: "s1", fabricWidthMm: 1500 },
      "side",
      20,
    );
    const version = {
      easeProfile: value.easeProfile,
      measurementSetId: value.measurementSetId,
      options: {
        seamAllowance: { defaultsMm: value.seamAllowanceMm, perEdgeMm: {} },
        fabricWidthMm: value.fabricWidthMm,
      },
    } as unknown as PatternVersion;
    expect(fromVersion(version)).toEqual(value);
  });

  it("falls back to defaults for missing stored options", () => {
    const version = {
      easeProfile: "regular",
      measurementSetId: null,
      options: {},
    } as unknown as PatternVersion;
    expect(fromVersion(version)).toEqual(defaultPatternOptions());
  });
});

describe("autoSelection", () => {
  const value = defaultPatternOptions();

  it("chooses the URL client while none is chosen, without a set yet", () => {
    expect(autoSelection(value, "c1", [])).toMatchObject({ clientId: "c1", measurementSetId: null });
  });

  it("does nothing without a URL client, or when a client is already chosen and has no sets", () => {
    expect(autoSelection(value, null, [])).toBeNull();
    expect(autoSelection({ ...value, clientId: "c1" }, "c2", [])).toBeNull();
  });

  it("never replaces a client already chosen by the URL one", () => {
    expect(autoSelection({ ...value, clientId: "c1" }, "c2", [set("s1")])?.clientId).toBe("c1");
  });

  it("chooses the newest set once the sets load, and keeps a chosen set", () => {
    const chosen = { ...value, clientId: "c1" };
    expect(autoSelection(chosen, "c1", [set("new"), set("old")])?.measurementSetId).toBe("new");
    expect(autoSelection({ ...chosen, measurementSetId: "old" }, "c1", [set("new"), set("old")])).toBeNull();
  });
});
