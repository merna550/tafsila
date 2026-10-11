import { describe, expect, it } from "vitest";
import type { Measurements } from "./measurements";
import { sizeChartSchema } from "./size-chart";

/** Minimal valid row (schemas cannot import the fixtures package: it depends on schemas). */
const sizeM: Measurements = {
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

describe("sizeChartSchema", () => {
  it("accepts free-string size labels, including sizes beyond XXL", () => {
    expect(sizeChartSchema.safeParse({ M: sizeM, "4XL": sizeM }).success).toBe(true);
  });

  it("rejects an empty chart", () => {
    expect(sizeChartSchema.safeParse({}).success).toBe(false);
  });

  it("rejects a row with invalid measurements", () => {
    expect(sizeChartSchema.safeParse({ M: { ...sizeM, bust: 5 } }).success).toBe(false);
  });
});
