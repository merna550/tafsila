import {
  DEFAULT_FABRIC_WIDTH_MM,
  defaultSeamAllowanceMm,
  engineOptionsSchema,
  type MeasurementSet,
} from "@tafsila/schemas";
import { seedDress, sizeM } from "@tafsila/test-fixtures";
import { describe, expect, it } from "vitest";
import type { PatternOptionsValue } from "@/features/pattern-options";
import { buildPreviewInput } from "./preview-input";

/** Regular ease, default allowances and a 140 cm fabric. */
const defaults: PatternOptionsValue = {
  clientId: null,
  measurementSetId: null,
  easeProfile: "regular",
  seamAllowanceMm: defaultSeamAllowanceMm(),
  fabricWidthMm: DEFAULT_FABRIC_WIDTH_MM,
};

const set = {
  id: "s1",
  clientId: "c1",
  label: "June",
  sizeLabel: "M",
  measurements: sizeM,
  warnings: [],
  createdAt: "2026-10-01T00:00:00.000Z",
} as MeasurementSet;

describe("buildPreviewInput", () => {
  it("is null without a set or a spec", () => {
    const options = defaults;
    expect(buildPreviewInput({ spec: seedDress, options, set: undefined })).toBeNull();
    expect(buildPreviewInput({ spec: null, options, set })).toBeNull();
  });

  it("uses the live measurements, the size label of the set and the client name", () => {
    const input = buildPreviewInput({
      spec: seedDress,
      options: defaults,
      set,
      clientName: "Salma",
    });
    expect(input?.measurements).toBe(sizeM);
    const options = engineOptionsSchema.parse(input?.options);
    expect(options.sizeLabel).toBe("M");
    expect(options.clientLabel).toBe("Salma");
    expect(options.easeProfile).toBe("regular");
  });

  it("falls back to the set name when it has no size label", () => {
    const input = buildPreviewInput({
      spec: seedDress,
      options: defaults,
      set: { ...set, sizeLabel: null },
    });
    expect(engineOptionsSchema.parse(input?.options).sizeLabel).toBe("June");
  });
});
