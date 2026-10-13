import { describe, expect, it } from "vitest";
import { MESSAGES } from "@/shared/i18n/testing";
import { ALL_FIELDS } from "./field-groups";
import { hasGuideMark, nextGuideField } from "./guide-index";

describe("guide coverage", () => {
  it.each(ALL_FIELDS)("%s has a drawing", (field) => {
    expect(hasGuideMark(field)).toBe(true);
  });

  it.each(["ar", "en"] as const)("every field has a label, steps and a warning in %s", (locale) => {
    const { measurements } = MESSAGES[locale];
    for (const field of ALL_FIELDS) {
      expect(measurements.labels[field].length, `${locale} label ${field}`).toBeGreaterThan(0);
      const guide = measurements.guide[field];
      expect(guide.steps.length, `${locale} steps ${field}`).toBeGreaterThanOrEqual(3);
      expect(guide.warning.length, `${locale} warning ${field}`).toBeGreaterThan(0);
    }
  });

  it("walks the fields in order and stops at the last one", () => {
    expect(nextGuideField("bust")).toBe("highBust");
    expect(nextGuideField("waistToFloor")).toBeUndefined();
  });
});
