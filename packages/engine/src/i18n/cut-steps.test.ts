import { describe, expect, it } from "vitest";
import { cutSteps } from "../cut";
import { CUT_STEP_KEYS } from "../cut/types";
import { cubicSeg, pt } from "../geometry";
import { rectanglePiece } from "../test-utils/cut-piece";
import { CUT_STEP_TEXTS, DERIVED_PLACEHOLDERS, cutStepText, formatCm } from "./cut-steps";

/** A rectangle whose top edge is a curve, for the curve steps. */
const curved = rectanglePiece();
const curvedPath = [cubicSeg(pt(0, 0), pt(60, -40), pt(140, -40), pt(200, 0)), ...curved.cutPath.slice(1)];

/** Steps of hand-made pieces that use every step key. */
const steps = cutSteps({
  engineVersion: "1.0.0",
  pieces: [
    rectanglePiece({
      notches: [{ id: "n", edgeId: "right", atMm: 10 }],
      darts: [{ id: "d", edgeId: "bottom", apex: pt(100, 200), legs: [pt(110, 300), pt(90, 300)] }],
    }) as never,
    rectanglePiece({ fold: true }) as never,
    { ...curved, stitchPath: curvedPath, cutPath: curvedPath } as never,
  ],
}).pieces.flatMap((piece) => piece.steps);

describe("cut step texts (issue #284)", () => {
  it("has Arabic and English for every key", () => {
    for (const key of CUT_STEP_KEYS) {
      expect(CUT_STEP_TEXTS[key].ar.length).toBeGreaterThan(0);
      expect(CUT_STEP_TEXTS[key].en.length).toBeGreaterThan(0);
    }
  });

  it("only uses placeholders the builder fills", () => {
    for (const step of steps) {
      for (const lang of ["ar", "en"] as const) {
        const names = [...CUT_STEP_TEXTS[step.key][lang].matchAll(/\{(\w+)\}/g)].map((m) => m[1]!);
        for (const name of names)
          expect(name in step.params || DERIVED_PLACEHOLDERS.includes(name)).toBe(true);
        expect(cutStepText(step, lang)).not.toMatch(/[{}]/);
      }
    }
  });

  it("covers every key with the sample steps but none unused", () => {
    expect(new Set(steps.map((s) => s.key))).toEqual(new Set(CUT_STEP_KEYS));
  });

  it("shows mm as cm with one decimal", () => {
    expect(formatCm(125)).toBe("12.5");
    expect(formatCm(30)).toBe("3.0");
    expect(
      cutStepText({ key: "cut.mark.corner", params: { point: "B", alongMm: 125, acrossMm: 30 } }, "ar"),
    ).toBe("انزلي 12.5 سم من الخط العلوي و 3.0 سم من الخط المرجعي، وضعي النقطة B.");
  });

  it("writes Arabic with Western digits only (NFR-06)", () => {
    for (const step of steps) expect(cutStepText(step, "ar")).not.toMatch(/[٠-٩۰-۹]/);
  });

  it("reuses the piece label wording for the cut", () => {
    const cut = steps.find((s) => s.key === "cut.cut")!;
    expect(cutStepText(cut, "en")).toBe("Cut 2 (and mirrored), along the drawn line.");
    expect(cutStepText(cut, "ar")).toBe("على الخط المرسوم: اقصّي 2 (مع مقلوبها).");
  });

  it("leaves an unknown placeholder visible rather than empty", () => {
    expect(cutStepText({ key: "cut.connect.straight", params: { from: "A" } }, "en")).toContain("{to}");
  });
});
