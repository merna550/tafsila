import { demoSizeChart } from "@tafsila/test-fixtures";
import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { fromStandardSize, UnknownSizeError } from "./from-standard-size";

describe("fromStandardSize", () => {
  it("returns the chart row when there are no overrides", () => {
    expect(fromStandardSize(demoSizeChart, "M")).toEqual(demoSizeChart.M);
  });

  it("puts overrides on top of the size", () => {
    expect(fromStandardSize(demoSizeChart, "M", { waist: 800 }).waist).toBe(800);
  });

  it("does not erase values with undefined overrides", () => {
    expect(fromStandardSize(demoSizeChart, "M", { waist: undefined }).waist).toBe(demoSizeChart.M?.waist);
  });

  it("throws UnknownSizeError for a missing label, including inherited object keys", () => {
    expect(() => fromStandardSize(demoSizeChart, "XS")).toThrow(UnknownSizeError);
    expect(() => fromStandardSize(demoSizeChart, "toString")).toThrow(UnknownSizeError);
  });

  it("changes only the overridden keys and never mutates the chart (property test)", () => {
    const labels = Object.keys(demoSizeChart);
    fc.assert(
      fc.property(
        fc.constantFrom(...labels),
        fc.record(
          { waist: fc.integer({ min: 500, max: 1400 }), hip: fc.integer({ min: 800, max: 1700 }) },
          { requiredKeys: [] },
        ),
        (label, overrides) => {
          const base = demoSizeChart[label];
          const before = structuredClone(demoSizeChart);
          const result = fromStandardSize(demoSizeChart, label, overrides);
          expect(demoSizeChart).toEqual(before);
          for (const key of Object.keys(result) as (keyof typeof result)[]) {
            const overridden = key in overrides;
            expect(result[key]).toEqual(overridden ? overrides[key as keyof typeof overrides] : base?.[key]);
          }
        },
      ),
    );
  });
});
