/** Tests for the engine options contract. */
import { describe, expect, it } from "vitest";
import { DEFAULT_SEAM_ALLOWANCE_MM, engineOptionsSchema } from "./engine-options";

/** A valid options object. */
const base = { easeProfile: "regular", fabricWidthMm: 1500, sizeLabel: "M" };

describe("engineOptionsSchema", () => {
  it("fills the FR-PAT-03 seam allowance defaults", () => {
    const parsed = engineOptionsSchema.parse(base);
    expect(parsed.seamAllowance.defaultsMm).toEqual({
      side: 15,
      neckline: 10,
      armhole: 10,
      hem: 30,
      other: 15,
    });
    expect(parsed.seamAllowance.defaultsMm).toEqual(DEFAULT_SEAM_ALLOWANCE_MM);
  });

  it("accepts a per-edge override", () => {
    const parsed = engineOptionsSchema.parse({
      ...base,
      seamAllowance: { defaultsMm: DEFAULT_SEAM_ALLOWANCE_MM, perEdgeMm: { "front/hem": 40 } },
    });
    expect(parsed.seamAllowance.perEdgeMm["front/hem"]).toBe(40);
  });

  it("rejects a negative fabric width", () => {
    expect(engineOptionsSchema.safeParse({ ...base, fabricWidthMm: -1 }).success).toBe(false);
  });
});
