import type { DesignSpec } from "./design-spec";
import { describe, expect, it } from "vitest";
import { listPatternVersionsQuerySchema, savePatternVersionInputSchema } from "./pattern-versions";

const SET_ID = "00000000-0000-4000-8000-0000000000c1";
const seedDress: DesignSpec = {
  schemaVersion: 1,
  category: "dress",
  fabricType: "woven",
  bodice: { fit: "fitted", shaping: "darts", waistSeam: true },
  neckline: { front: "round", back: "round", collar: "none" },
  sleeve: { type: "set-in", length: "short", cuff: "none" },
  skirt: { type: "straight", length: "knee" },
  waistband: "none",
  closure: { type: "zip", position: "center-back" },
  pockets: [],
  lining: false,
  belt: "none",
};
const valid = {
  spec: seedDress,
  measurementSetId: SET_ID,
  easeProfile: "regular",
  options: { fabricWidthMm: 1400 },
};

describe("pattern version schemas", () => {
  it("accepts a save body and fills the default seam allowance", () => {
    const parsed = savePatternVersionInputSchema.parse(valid);
    expect(parsed.options.seamAllowance.defaultsMm.hem).toBe(30);
  });

  it("rejects a missing set, an unknown ease profile and a zero fabric width", () => {
    expect(savePatternVersionInputSchema.safeParse({ ...valid, measurementSetId: undefined }).success).toBe(
      false,
    );
    expect(savePatternVersionInputSchema.safeParse({ ...valid, easeProfile: "tight" }).success).toBe(false);
    expect(savePatternVersionInputSchema.safeParse({ ...valid, options: { fabricWidthMm: 0 } }).success).toBe(
      false,
    );
  });

  it("applies paging defaults", () => {
    expect(listPatternVersionsQuerySchema.parse({})).toEqual({ limit: 20, offset: 0 });
  });
});
