import { DEFAULT_FABRIC_OPTIONS } from "@tafsila/schemas";
import { describe, expect, it } from "vitest";
import { CUSTOM_WIDTH, formToOptions, optionsToForm, WIDTH_PRESETS_CM } from "./fabric-form";

describe("fabric form", () => {
  it("offers the five presets in cm", () => {
    expect(WIDTH_PRESETS_CM).toEqual([90, 115, 140, 150, 160]);
  });

  it("round-trips the defaults (cm to mm and back)", () => {
    const values = optionsToForm(DEFAULT_FABRIC_OPTIONS);
    expect(values).toMatchObject({
      widthChoice: "140",
      layout: "folded",
      nap: false,
      shrinkage: "5",
      repeatCm: "0",
    });
    expect(formToOptions(values)).toEqual({ ok: true, options: DEFAULT_FABRIC_OPTIONS });
  });

  it("opens the custom field for a width that is not a preset", () => {
    const values = optionsToForm({ ...DEFAULT_FABRIC_OPTIONS, widthMm: 1280 });
    expect(values).toMatchObject({ widthChoice: CUSTOM_WIDTH, customCm: "128" });
    expect(formToOptions(values)).toMatchObject({ ok: true, options: { widthMm: 1280 } });
  });

  it("reads a comma decimal and empty shrinkage and repeat as zero", () => {
    const base = optionsToForm(DEFAULT_FABRIC_OPTIONS);
    const result = formToOptions({
      ...base,
      widthChoice: CUSTOM_WIDTH,
      customCm: "127,5",
      shrinkage: "",
      repeatCm: " ",
    });
    expect(result).toMatchObject({
      ok: true,
      options: { widthMm: 1275, shrinkagePercent: 0, patternRepeatMm: 0 },
    });
  });

  it("names each wrong field", () => {
    const base = optionsToForm(DEFAULT_FABRIC_OPTIONS);
    const result = formToOptions({
      ...base,
      widthChoice: CUSTOM_WIDTH,
      customCm: "20",
      shrinkage: "40",
      repeatCm: "abc",
    });
    expect(result).toEqual({
      ok: false,
      errors: { customCm: "width", shrinkage: "shrinkage", repeatCm: "repeat" },
    });
  });

  it("rejects a custom width that is empty", () => {
    const base = optionsToForm(DEFAULT_FABRIC_OPTIONS);
    expect(formToOptions({ ...base, widthChoice: CUSTOM_WIDTH, customCm: "" })).toMatchObject({ ok: false });
  });

  it("keeps the layout and nap", () => {
    const base = optionsToForm(DEFAULT_FABRIC_OPTIONS);
    expect(formToOptions({ ...base, layout: "open", nap: true })).toMatchObject({
      ok: true,
      options: { layout: "open", directionalNap: true },
    });
  });
});
