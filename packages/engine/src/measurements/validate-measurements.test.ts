import { sizeM, demoSizeChart } from "@tafsila/test-fixtures";
import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { MEASUREMENT_RANGES_MM, type MeasurementKey } from "../constants/measurement-ranges";
import { CROSS_CHECK_MESSAGES } from "./codes";
import { validateMeasurements } from "./validate-measurements";

const KEYS = Object.keys(MEASUREMENT_RANGES_MM) as MeasurementKey[];

/**
 * Codes of the errors found in size M with `patch` applied.
 *
 * @param patch - Values to change in size M.
 * @returns Codes in report order.
 */
function errorCodes(patch: Partial<typeof sizeM>): string[] {
  return validateMeasurements({ ...sizeM, ...patch }).errors.map((e) => e.code);
}

/**
 * Codes of the warnings found in size M with `patch` applied.
 *
 * @param patch - Values to change in size M.
 * @returns Codes in report order.
 */
function warningCodes(patch: Partial<typeof sizeM>): string[] {
  return validateMeasurements({ ...sizeM, ...patch }).warnings.map((w) => w.code);
}

describe("validateMeasurements ranges", () => {
  it("accepts size M with no errors and no warnings", () => {
    expect(validateMeasurements(sizeM)).toEqual({ errors: [], warnings: [] });
  });

  it.each(KEYS)("%s: edges pass, one mm outside fails", (key) => {
    const { minMm, maxMm } = MEASUREMENT_RANGES_MM[key];
    const outOfRange = (value: number) =>
      validateMeasurements({ ...sizeM, [key]: value }).errors.some(
        (e) => e.code === "MEAS_OUT_OF_RANGE" && e.fields[0] === key,
      );
    expect(outOfRange(minMm)).toBe(false);
    expect(outOfRange(maxMm)).toBe(false);
    expect(outOfRange(minMm - 1)).toBe(true);
    expect(outOfRange(maxMm + 1)).toBe(true);
  });

  it("skips the optional underBust when absent", () => {
    const withoutUnderBust: Partial<typeof sizeM> = { ...sizeM };
    delete withoutUnderBust.underBust;
    expect(validateMeasurements(withoutUnderBust as typeof sizeM).errors).toEqual([]);
  });

  it("gives out-of-range messages in both languages with the value and range", () => {
    const issue = validateMeasurements({ ...sizeM, height: 100 }).errors[0];
    expect(issue?.message_en).toContain("100");
    expect(issue?.message_ar).toContain("1400");
  });
});

describe("validateMeasurements cross-checks", () => {
  it("errors when high bust is above bust, not when equal", () => {
    expect(errorCodes({ highBust: 921 })).toContain("MEAS_HIGH_BUST_EXCEEDS_BUST");
    expect(errorCodes({ highBust: 920 })).not.toContain("MEAS_HIGH_BUST_EXCEEDS_BUST");
  });

  it("errors when under bust is at or above bust", () => {
    expect(errorCodes({ underBust: 920 })).toContain("MEAS_UNDER_BUST_NOT_BELOW_BUST");
    expect(errorCodes({ underBust: 919 })).not.toContain("MEAS_UNDER_BUST_NOT_BELOW_BUST");
  });

  it("errors when waist to knee reaches waist to floor", () => {
    expect(errorCodes({ waistToKnee: 1050 })).toContain("MEAS_KNEE_BELOW_FLOOR_LENGTH");
    expect(errorCodes({ waistToKnee: 1049 })).not.toContain("MEAS_KNEE_BELOW_FLOOR_LENGTH");
  });

  it("only warns when waist is at or above hip (never an error)", () => {
    expect(warningCodes({ waist: 1000 })).toContain("MEAS_WAIST_NOT_BELOW_HIP");
    expect(errorCodes({ waist: 1000 })).toEqual([]);
    expect(warningCodes({ waist: 999 })).not.toContain("MEAS_WAIST_NOT_BELOW_HIP");
  });

  it("warns when bust points are more than half the bust", () => {
    expect(warningCodes({ bustPointDistance: 461 })).toContain("MEAS_BUST_POINTS_TOO_WIDE");
    expect(warningCodes({ bustPointDistance: 300 })).not.toContain("MEAS_BUST_POINTS_TOO_WIDE");
  });

  it("warns when front length is shorter than back length", () => {
    expect(warningCodes({ frontLength: 399 })).toContain("MEAS_FRONT_SHORTER_THAN_BACK");
    expect(warningCodes({ frontLength: 400 })).not.toContain("MEAS_FRONT_SHORTER_THAN_BACK");
  });

  it("warns when waist to floor is outside 50% to 70% of height", () => {
    expect(warningCodes({ waistToFloor: 824 })).toContain("MEAS_WAIST_TO_FLOOR_UNUSUAL");
    expect(warningCodes({ waistToFloor: 1156 })).toContain("MEAS_WAIST_TO_FLOOR_UNUSUAL");
    expect(warningCodes({ waistToFloor: 825 })).not.toContain("MEAS_WAIST_TO_FLOOR_UNUSUAL");
    expect(warningCodes({ waistToFloor: 1155 })).not.toContain("MEAS_WAIST_TO_FLOOR_UNUSUAL");
  });

  it("has a unique code and both languages for every cross-check message", () => {
    const codes = Object.keys(CROSS_CHECK_MESSAGES);
    expect(new Set(codes).size).toBe(codes.length);
    for (const text of Object.values(CROSS_CHECK_MESSAGES)) {
      expect(text.ar.length).toBeGreaterThan(0);
      expect(text.en.length).toBeGreaterThan(0);
    }
  });
});

describe("validateMeasurements properties", () => {
  it("passes every demo chart size with no errors and no warnings", () => {
    for (const row of Object.values(demoSizeChart)) {
      expect(validateMeasurements(row)).toEqual({ errors: [], warnings: [] });
    }
  });

  it("is deterministic and does not mutate its input", () => {
    fc.assert(
      fc.property(fc.constantFrom(...KEYS), fc.integer({ min: 0, max: 3000 }), (key, value) => {
        const input = { ...sizeM, [key]: value };
        const snapshot = structuredClone(input);
        expect(validateMeasurements(input)).toEqual(validateMeasurements(input));
        expect(input).toEqual(snapshot);
      }),
    );
  });

  it("reports an out-of-range error exactly for values outside the range", () => {
    fc.assert(
      fc.property(fc.constantFrom(...KEYS), fc.integer({ min: 0, max: 3000 }), (key, value) => {
        const { minMm, maxMm } = MEASUREMENT_RANGES_MM[key];
        const flagged = validateMeasurements({ ...sizeM, [key]: value }).errors.some(
          (e) => e.code === "MEAS_OUT_OF_RANGE" && e.fields[0] === key,
        );
        expect(flagged).toBe(value < minMm || value > maxMm);
      }),
    );
  });
});
