/** Tests for the category rules (issues #125, #144). */
import { sizeM, straightKneeSkirt, vNeckHalfCircleDress, dartedBlouse } from "@tafsila/test-fixtures";
import { describe, expect, it } from "vitest";
import { DraftingError } from "../errors/drafting-error";
import { checkCategory, isOnePieceDress } from "./category-rules";
import { generatePattern } from "./generate-pattern";

/**
 * Calls checkCategory and returns the error code it throws.
 *
 * @param spec - Spec to check.
 * @returns The DraftingError code, or undefined when nothing was thrown.
 */
function codeOf(spec: Parameters<typeof checkCategory>[0]): string | undefined {
  try {
    checkCategory(spec);
    return undefined;
  } catch (e) {
    return e instanceof DraftingError ? e.code : "OTHER";
  }
}

describe("checkCategory", () => {
  it("keeps a dress with bodice and skirt as it is", () => {
    const out = checkCategory(vNeckHalfCircleDress);
    expect(out.spec).toBe(vNeckHalfCircleDress);
    expect(out.checks).toEqual([]);
  });

  it("refuses a dress without a skirt part", () => {
    expect(codeOf({ ...vNeckHalfCircleDress, skirt: undefined })).toBe("SPEC_PART_MISSING");
  });

  it("refuses a one-piece dress with a circle skirt", () => {
    const spec = { ...vNeckHalfCircleDress, bodice: { ...vNeckHalfCircleDress.bodice!, waistSeam: false } };
    expect(isOnePieceDress(spec)).toBe(true);
    expect(codeOf(spec)).toBe("DRESS_ONE_PIECE_SKIRT_UNSUPPORTED");
  });

  it("drops the bodice parts of a skirt with one warning that names them", () => {
    const out = checkCategory({ ...vNeckHalfCircleDress, category: "skirt" });
    expect(out.spec.bodice).toBeUndefined();
    expect(out.spec.sleeve).toBeUndefined();
    expect(out.checks).toHaveLength(1);
    expect(out.checks[0]).toMatchObject({ id: "FR-VAL-08", code: "SPEC_PART_IGNORED", status: "warn" });
    expect(out.checks[0]!.refs).toEqual(["bodice", "neckline", "sleeve"]);
  });

  it("does not warn about a waistband set to none", () => {
    expect(checkCategory({ ...vNeckHalfCircleDress, waistband: "none" }).checks).toEqual([]);
  });
});

describe("generatePattern category rules", () => {
  it("drafts a skirt with a sleeve part, warns and adds no sleeve", () => {
    const out = generatePattern(
      { ...straightKneeSkirt, sleeve: { type: "set-in", length: "short", cuff: "none" } },
      sizeM,
    );
    expect(out.validation.checks.find((c) => c.code === "SPEC_PART_IGNORED")?.refs).toEqual(["sleeve"]);
    expect(out.pieces.some((p) => p.id === "sleeve")).toBe(false);
  });

  it("drafts a blouse with a skirt part without skirt pieces", () => {
    const out = generatePattern({ ...dartedBlouse, skirt: { type: "straight", length: "knee" } }, sizeM);
    expect(out.validation.checks.some((c) => c.code === "SPEC_PART_IGNORED")).toBe(true);
    expect(out.pieces.some((p) => p.id.startsWith("skirt-"))).toBe(false);
  });

  it("warns about a dress with a straight waistband", () => {
    const out = generatePattern({ ...vNeckHalfCircleDress, waistband: "straight" }, sizeM);
    expect(out.validation.checks.find((c) => c.code === "SPEC_PART_IGNORED")?.refs).toEqual(["waistband"]);
    expect(out.pieces.some((p) => p.id.startsWith("waistband"))).toBe(false);
  });

  it("returns a bilingual fail with no pieces for a dress without a skirt", () => {
    const out = generatePattern({ ...vNeckHalfCircleDress, skirt: undefined }, sizeM);
    expect(out.pieces).toEqual([]);
    const check = out.validation.checks.find((c) => c.code === "SPEC_PART_MISSING");
    expect(check?.status).toBe("fail");
    expect(check?.message.ar.length).toBeGreaterThan(0);
  });

  it("returns a fail for a one-piece dress with a gathered skirt", () => {
    const spec = {
      ...vNeckHalfCircleDress,
      bodice: { ...vNeckHalfCircleDress.bodice!, waistSeam: false },
      skirt: { type: "gathered" as const, length: "knee" as const },
    };
    const out = generatePattern(spec, sizeM);
    expect(out.validation.status).toBe("fail");
    expect(out.validation.checks.some((c) => c.code === "DRESS_ONE_PIECE_SKIRT_UNSUPPORTED")).toBe(true);
  });
});
