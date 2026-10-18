import { describe, expect, it } from "vitest";
import { ENGINE_STAMP, PIECE_NAMES, cutInfoText, pieceNameText, sizeLabelText } from "./pieces";
import { marksRegistry } from "../pipeline/test-support/marks-module";
import { rectangleRegistry } from "../pipeline/test-support/rectangle-module";
import { generatePattern } from "../pipeline/generate-pattern";
import { sizeM, vNeckHalfCircleDress } from "@tafsila/test-fixtures";

const ARABIC_LETTER = /\p{Script=Arabic}/u;

describe("piece catalogue", () => {
  it("has both languages for every entry, and Arabic holds Arabic letters", () => {
    for (const [id, name] of Object.entries(PIECE_NAMES)) {
      expect(name.en.length, id).toBeGreaterThan(0);
      expect(name.ar, id).toMatch(ARABIC_LETTER);
    }
  });

  it("names every piece the pipeline test modules produce", () => {
    for (const registry of [rectangleRegistry, marksRegistry]) {
      const result = generatePattern(vNeckHalfCircleDress, sizeM, undefined, registry);
      for (const piece of result.pieces) expect(PIECE_NAMES[piece.id], piece.id).toBeDefined();
    }
  });

  it("falls back to the name the piece carries", () => {
    expect(pieceNameText({ id: "unknown", name: { ar: "س", en: "x" } })).toEqual({ ar: "س", en: "x" });
    expect(pieceNameText({ id: "sleeve", name: { ar: "س", en: "x" } }).en).toBe("Sleeve");
  });
});

describe("cutInfoText", () => {
  const base = { quantity: 2, onFold: false, mirror: false, fabric: "main" } as const;

  it("says how many to cut", () => {
    expect(cutInfoText(base)).toEqual({ ar: "اقصّي 2", en: "Cut 2" });
  });

  it("adds the fold, the mirror and the fabric", () => {
    expect(cutInfoText({ ...base, quantity: 1, onFold: true })).toEqual({
      ar: "اقصّي 1 على الثنية",
      en: "Cut 1 on fold",
    });
    expect(cutInfoText({ ...base, mirror: true }).en).toBe("Cut 2 (and mirrored)");
    expect(cutInfoText({ ...base, fabric: "lining" }).en).toBe("Cut 2 - lining");
    expect(cutInfoText({ ...base, fabric: "interfacing" }).ar).toMatch(ARABIC_LETTER);
  });

  it("uses Western digits", () => {
    expect(cutInfoText({ ...base, quantity: 12 }).ar).toContain("12");
  });
});

describe("sizeLabelText", () => {
  it("holds the size, the optional client and the engine version", () => {
    expect(sizeLabelText("M").en).toBe(`Size M - ${ENGINE_STAMP}`);
    expect(sizeLabelText("M", "Mona").ar).toBe(`المقاس M - Mona - ${ENGINE_STAMP}`);
  });
});
