/** Tests for the category rules. */
import { vNeckHalfCircleDress } from "@tafsila/test-fixtures";
import { describe, expect, it } from "vitest";
import { DraftingError } from "../errors/drafting-error";
import { assertCategory } from "./category-rules";

/**
 * Calls assertCategory and returns the error code it throws.
 *
 * @param spec - Spec to check.
 * @returns The DraftingError code, or undefined when nothing was thrown.
 */
function codeOf(spec: Parameters<typeof assertCategory>[0]): string | undefined {
  try {
    assertCategory(spec);
    return undefined;
  } catch (e) {
    return e instanceof DraftingError ? e.code : "OTHER";
  }
}

describe("assertCategory", () => {
  it("accepts a dress with bodice and skirt", () => {
    expect(assertCategory(vNeckHalfCircleDress)).toEqual(["bodice", "skirt"]);
  });

  it("rejects a skirt with a bodice part", () => {
    expect(codeOf({ ...vNeckHalfCircleDress, category: "skirt" })).toBe("PIPELINE_UNSUPPORTED_COMBINATION");
  });

  it("rejects a dress without a skirt part", () => {
    expect(codeOf({ ...vNeckHalfCircleDress, skirt: undefined })).toBe("PIPELINE_UNSUPPORTED_COMBINATION");
  });

  it("accepts a blouse with only a bodice", () => {
    expect(assertCategory({ ...vNeckHalfCircleDress, category: "blouse", skirt: undefined })).toEqual([
      "bodice",
    ]);
  });
});
