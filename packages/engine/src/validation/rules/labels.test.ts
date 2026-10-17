/** Tests for the core grain-line and piece-information rules (FR-VAL-06). */
import { describe, expect, it } from "vitest";
import { validationContext, validationPiece } from "../test-support";
import { cutQuantityRule, grainLineRule, pieceNameRule } from "./labels";

describe("piece-information validation", () => {
  it("fails a zero-length grain line with a piece ref", () => {
    const point = { x: 10, y: 10 };
    const check = grainLineRule.run(validationContext([validationPiece({ grainLine: [point, point] })]));
    expect(check).toMatchObject({ code: "LABELS_NO_GRAIN", status: "fail", refs: ["front"] });
  });

  it("fails when either bilingual piece name is empty", () => {
    const check = pieceNameRule.run(validationContext([validationPiece({ name: { ar: " ", en: "Front" } })]));
    expect(check).toMatchObject({ code: "LABELS_NO_NAME", status: "fail", refs: ["front"] });
  });

  it("fails a zero cut quantity", () => {
    const piece = validationPiece();
    const check = cutQuantityRule.run(validationContext([{ ...piece, cut: { ...piece.cut, quantity: 0 } }]));
    expect(check).toMatchObject({ code: "LABELS_NO_CUT_INFO", status: "fail", refs: ["front"] });
  });

  it("passes every piece-information rule for a complete piece", () => {
    const context = validationContext([validationPiece()]);
    expect([grainLineRule, pieceNameRule, cutQuantityRule].map((rule) => rule.run(context).status)).toEqual([
      "pass",
      "pass",
      "pass",
    ]);
  });
});
