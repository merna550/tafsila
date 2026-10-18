/** Tests for the stable bilingual validation message catalogue. */
import { describe, expect, it } from "vitest";
import { formatMessage, VALIDATION_MESSAGES } from "./messages";

/**
 * Extracts named placeholders from one catalogue message.
 *
 * @param message - Catalogue message template.
 * @returns Placeholder names in locale-aware order.
 */
function placeholders(message: string): string[] {
  return [...message.matchAll(/\{([a-z]+)\}/gi)]
    .map((match) => match[1]!)
    .sort((a, b) => a.localeCompare(b, "en"));
}

describe("VALIDATION_MESSAGES", () => {
  it.each(Object.entries(VALIDATION_MESSAGES))("gives %s matching Arabic and English text", (_code, text) => {
    expect(text.ar).toMatch(/[\u0600-\u06ff]/);
    expect(text.en.trim()).not.toBe("");
    expect(placeholders(text.ar)).toEqual(placeholders(text.en));
  });

  it("formats the same values into both languages", () => {
    expect(formatMessage("STRUCT_MISSING_SA", { piece: "front", edge: "side" })).toEqual({
      ar: "لا يوجد بدل خياطة: front/side",
      en: "Seam allowance is missing: front/side",
    });
  });
});
