/** Tests for woven-ease and fabric-width plausibility rules (FR-VAL-08). */
import { describe, expect, it } from "vitest";
import { rectanglePath, VALIDATION_TEST_OPTIONS, validationContext, validationPiece } from "../test-support";
import { createNegativeEaseRule, fabricWidthRule } from "./plausibility";

describe("plausibility validation", () => {
  it("warns when a resolved total ease is negative", () => {
    const rule = createNegativeEaseRule(() => ({
      totalEaseMm: { bust: -20, waist: 0, hip: 0, upperArm: 0 },
    }));
    const check = rule.run(validationContext([validationPiece()]));
    expect(check).toMatchObject({
      code: "PLAUS_NEGATIVE_EASE",
      status: "warn",
      measuredMm: -20,
      expectedMm: 0,
    });
  });

  it("warns with measurements and a ref for a piece wider than the fabric", () => {
    const piece = validationPiece({
      stitchPath: rectanglePath(1580, 200),
      cutPath: rectanglePath(1600, 220, -10, -10),
      grainLine: [
        { x: 800, y: 0 },
        { x: 800, y: 200 },
      ],
    });
    const check = fabricWidthRule.run(validationContext([piece]));
    expect(check).toMatchObject({
      code: "PLAUS_WIDER_THAN_FABRIC",
      status: "warn",
      measuredMm: 1600,
      expectedMm: 1400,
      refs: ["front"],
    });
  });

  it("doubles a half-piece width when it is cut on the fold", () => {
    const base = validationPiece();
    const piece = validationPiece({
      cut: { ...base.cut, onFold: true },
      stitchPath: rectanglePath(880, 200),
      cutPath: rectanglePath(900, 220, -10, -10),
    });
    const check = fabricWidthRule.run(validationContext([piece]));
    expect(check).toMatchObject({ status: "warn", measuredMm: 1800, expectedMm: 1400 });
  });

  it("passes a piece that fits the configured fabric", () => {
    const options = { ...VALIDATION_TEST_OPTIONS, fabricWidthMm: 1500 };
    expect(
      fabricWidthRule.run(validationContext([validationPiece(), validationPiece({ id: "back" })], options)),
    ).toMatchObject({ code: "PLAUS_OK", status: "pass" });
  });
});
