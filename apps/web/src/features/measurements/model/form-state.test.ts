import { demoSizeChart, sizeM } from "@tafsila/test-fixtures";
import { describe, expect, it } from "vitest";
import { fieldsForSize, judgeForm, resetFieldText } from "./form-state";
import { EMPTY_FIELD_TEXTS, toFieldTexts } from "./measurement-form.schema";

const MEDIUM = toFieldTexts(sizeM);

describe("fieldsForSize", () => {
  it("fills every box for a known size and nothing for an unknown one", () => {
    expect(fieldsForSize(demoSizeChart, "M")).toEqual(MEDIUM);
    expect(fieldsForSize(demoSizeChart, "XXXL")).toBeUndefined();
  });
});

describe("resetFieldText", () => {
  it("gives the size's text back", () => {
    expect(resetFieldText(demoSizeChart, "M", { ...MEDIUM, waist: "75" }, "waist")).toBe("74");
  });

  it("keeps the text for an unknown size", () => {
    expect(resetFieldText(demoSizeChart, "nope", { ...MEDIUM, waist: "75" }, "waist")).toBe("75");
  });
});

describe("judgeForm", () => {
  it("allows saving a valid size with a label", () => {
    expect(judgeForm({ label: "Summer", sizeLabel: "M", fields: MEDIUM }, "en").canSave).toBe(true);
  });

  it("blocks without a label, with empty boxes, and on an engine error", () => {
    expect(judgeForm({ label: " ", sizeLabel: "M", fields: MEDIUM }, "en").canSave).toBe(false);
    expect(judgeForm({ label: "x", sizeLabel: "", fields: EMPTY_FIELD_TEXTS }, "en").canSave).toBe(false);
    const broken = judgeForm({ label: "x", sizeLabel: "M", fields: { ...MEDIUM, highBust: "100" } }, "en");
    expect(broken.issues.errorCount).toBeGreaterThan(0);
    expect(broken.canSave).toBe(false);
  });
});
