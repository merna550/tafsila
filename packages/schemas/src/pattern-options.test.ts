import { describe, expect, it } from "vitest";
import { engineOptionsSchema } from "./engine-options";
import {
  buildEngineOptions,
  DEFAULT_FABRIC_WIDTH_MM,
  defaultSeamAllowanceMm,
  type PatternOptionsInput,
} from "./pattern-options";

const defaults: PatternOptionsInput = {
  seamAllowanceMm: defaultSeamAllowanceMm(),
  fabricWidthMm: DEFAULT_FABRIC_WIDTH_MM,
};

describe("buildEngineOptions", () => {
  it("uses the set name as size label and the client name as label", () => {
    const options = buildEngineOptions("regular", defaults, { label: "صيف", sizeLabel: null }, "منى");
    expect(engineOptionsSchema.parse(options)).toEqual(options);
    expect(options.sizeLabel).toBe("صيف");
    expect(options.clientLabel).toBe("منى");
  });

  it("prefers the size label and leaves out an empty client name", () => {
    const options = buildEngineOptions("loose", defaults, { label: "صيف", sizeLabel: "M" }, "  ");
    expect(options.sizeLabel).toBe("M");
    expect(options).not.toHaveProperty("clientLabel");
  });

  it("does not share the defaults object", () => {
    expect(
      buildEngineOptions("regular", defaults, { label: "a", sizeLabel: null }).seamAllowance.defaultsMm,
    ).not.toBe(defaults.seamAllowanceMm);
  });

  it("is refused by the engine schema for a zero fabric width", () => {
    const options = buildEngineOptions(
      "regular",
      { ...defaults, fabricWidthMm: 0 },
      { label: "a", sizeLabel: null },
    );
    expect(engineOptionsSchema.safeParse(options).success).toBe(false);
  });
});
