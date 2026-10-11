import { describe, expect, it } from "vitest";
import { saveMeasurementSetInputSchema, updateMeasurementSetInputSchema } from "./measurement-sets";

const measurements = {
  unit: "mm",
  height: 1650,
  bust: 920,
  highBust: 860,
  waist: 740,
  hip: 1000,
  hipDepth: 200,
  neck: 360,
  shoulderWidth: 380,
  backLength: 400,
  frontLength: 430,
  bustPointDistance: 190,
  bustHeight: 250,
  armLength: 590,
  upperArm: 290,
  wrist: 160,
  waistToKnee: 580,
  waistToFloor: 1050,
};

describe("measurement set schemas", () => {
  it("accepts a valid save body with and without a client", () => {
    expect(saveMeasurementSetInputSchema.safeParse({ label: "L", measurements }).success).toBe(true);
    const clientId = "00000000-0000-4000-8000-0000000000a1";
    expect(saveMeasurementSetInputSchema.safeParse({ clientId, label: "L", measurements }).success).toBe(
      true,
    );
  });

  it("rejects an empty label, a bad client id and a missing measurement", () => {
    expect(saveMeasurementSetInputSchema.safeParse({ label: " ", measurements }).success).toBe(false);
    expect(saveMeasurementSetInputSchema.safeParse({ clientId: "x", label: "L", measurements }).success).toBe(
      false,
    );
    const partial = { ...measurements, bust: undefined };
    expect(saveMeasurementSetInputSchema.safeParse({ label: "L", measurements: partial }).success).toBe(
      false,
    );
  });

  it("does not take a client id on update", () => {
    const parsed = updateMeasurementSetInputSchema.parse({
      clientId: "00000000-0000-4000-8000-0000000000a1",
      label: "L",
      measurements,
    });
    expect("clientId" in parsed).toBe(false);
  });
});
