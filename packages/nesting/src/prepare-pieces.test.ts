import { fabricOptionsSchema } from "@tafsila/schemas";
import { describe, expect, it } from "vitest";
import { SIMPLIFY_TOLERANCE_MM } from "./constants";
import { preparePieces } from "./prepare-pieces";
import { patternOf, rectPiece } from "./test-support/pieces";

const folded140 = fabricOptionsSchema.parse({ widthMm: 1400, layout: "folded" });
const open140 = fabricOptionsSchema.parse({ widthMm: 1400, layout: "open" });
/** Twice the outward offset: what the tolerance adds to a box size. */
const GROWTH_MM = 2 * SIMPLIFY_TOLERANCE_MM;

describe("preparePieces: usable width", () => {
  it("uses half the fabric when folded and all of it when open", () => {
    expect(preparePieces(patternOf(rectPiece()), folded140).usableWidthMm).toBe(700);
    expect(preparePieces(patternOf(rectPiece()), open140).usableWidthMm).toBe(1400);
  });
});

describe("preparePieces: plain pieces", () => {
  it("gives one shape per quantity in both layouts", () => {
    const pattern = patternOf(rectPiece({ cut: { quantity: 2 } }));
    expect(preparePieces(pattern, folded140).main).toHaveLength(2);
    expect(preparePieces(pattern, open140).main).toHaveLength(2);
  });
  it("numbers the copies p#1 to p#3", () => {
    const pattern = patternOf(rectPiece({ id: "p", cut: { quantity: 3 } }));
    expect(preparePieces(pattern, folded140).main.map((s) => s.id)).toEqual(["p#1", "p#2", "p#3"]);
  });
  it("turns a 200 x 300 piece with a downward grain so its 300 mm run along the selvedge", () => {
    const [shape] = preparePieces(patternOf(rectPiece()), open140).main;
    expect(shape!.bbox.lengthMm).toBeCloseTo(300 + GROWTH_MM, 6);
    expect(shape!.bbox.widthMm).toBeCloseTo(200 + GROWTH_MM, 6);
  });
});

describe("preparePieces: fold pieces", () => {
  const front = patternOf(rectPiece({ id: "front", cut: { onFold: true } }));

  it("gives a half shape on the fold when folded", () => {
    const [shape] = preparePieces(front, folded140).main;
    expect(shape!.fold).toBe(true);
    expect(Math.min(...shape!.polygon.map((p) => p.y))).toBe(0);
    expect(shape!.bbox.widthMm).toBeCloseTo(200 + SIMPLIFY_TOLERANCE_MM, 6);
  });
  it("unfolds into the whole piece, twice as wide and without the fold flag, when open", () => {
    const [shape] = preparePieces(front, open140).main;
    expect(shape!.fold).toBe(false);
    expect(shape!.bbox.widthMm).toBeCloseTo(2 * (200 + SIMPLIFY_TOLERANCE_MM), 6);
  });
  it("cuts a piece that crosses the fold by 9 mm back to the fold line", () => {
    const crossing = rectPiece({ id: "facing", cut: { onFold: true } });
    const cutPath = crossing.cutPath.map((s) => ({
      ...s,
      from: s.from.x === 0 && s.from.y === 0 ? { x: -9, y: 0 } : s.from,
      to: s.to.x === 0 && s.to.y === 0 ? { x: -9, y: 0 } : s.to,
    }));
    const [shape] = preparePieces(patternOf({ ...crossing, cutPath }), folded140).main;
    expect(Math.min(...shape!.polygon.map((p) => p.y))).toBe(0);
  });
});

describe("preparePieces: mirrored pairs", () => {
  const sleeves = patternOf(rectPiece({ id: "sleeve", cut: { quantity: 2, mirror: true } }));

  it("cuts the pair once through both layers when folded", () => {
    expect(preparePieces(sleeves, folded140).main.map((s) => s.mirrored)).toEqual([false]);
  });
  it("gives a piece and its mirror image when open", () => {
    const shapes = preparePieces(sleeves, open140).main;
    expect(shapes.map((s) => s.mirrored)).toEqual([false, true]);
    const ys = (i: number): number[] => shapes[i]!.polygon.map((p) => p.y).sort((a, b) => a - b);
    expect(ys(1)).toEqual(
      ys(0)
        .map((y) => shapes[0]!.bbox.widthMm - y)
        .sort((a, b) => a - b),
    );
  });
});

describe("preparePieces: grain and nap", () => {
  const grains = {
    up: [
      { x: 100, y: 250 },
      { x: 100, y: 50 },
    ],
    left: [
      { x: 150, y: 150 },
      { x: 50, y: 150 },
    ],
    right: [
      { x: 50, y: 150 },
      { x: 150, y: 150 },
    ],
  } as const;
  it.each(Object.entries(grains))(
    "turns a grain line pointing %s to run along the selvedge",
    (_, grainLine) => {
      const [shape] = preparePieces(
        patternOf(rectPiece({ grainLine: [grainLine[0], grainLine[1]] })),
        open140,
      ).main;
      const [a, b] = shape!.grainLine;
      expect(b.y - a.y).toBeCloseTo(0, 9);
      expect(b.x - a.x).toBeGreaterThan(0);
    },
  );
  it("allows 0 and 180 degrees without nap", () => {
    expect(preparePieces(patternOf(rectPiece()), open140).main[0]!.allowedTurns).toEqual([0, 180]);
  });
  it("allows only 0 degrees with directional nap", () => {
    const options = { ...open140, directionalNap: true };
    expect(preparePieces(patternOf(rectPiece()), options).main[0]!.allowedTurns).toEqual([0]);
  });
});

describe("preparePieces: fabric kinds", () => {
  it("puts lining and interfacing pieces in their own lists", () => {
    const pattern = patternOf(
      rectPiece({ id: "a" }),
      rectPiece({ id: "b", cut: { fabric: "lining" } }),
      rectPiece({ id: "c", cut: { fabric: "interfacing" } }),
    );
    const prepared = preparePieces(pattern, folded140);
    expect(
      [prepared.main, prepared.lining, prepared.interfacing].map((l) => l.map((s) => s.pieceId)),
    ).toEqual([["a"], ["b"], ["c"]]);
  });
});

describe("preparePieces: pieces that do not fit", () => {
  const wide = patternOf(rectPiece({ id: "skirt", widthMm: 800, heightMm: 600 }));
  const folded115 = fabricOptionsSchema.parse({ widthMm: 1150, layout: "folded" });

  it("reports an 800 mm piece on 115 cm folded and suggests the open layout", () => {
    const prepared = preparePieces(wide, folded115);
    expect(prepared.main).toEqual([]);
    expect(prepared.doesNotFit.map((d) => [d.pieceId, d.usableWidthMm, d.fitsOpen])).toEqual([
      ["skirt", 575, true],
    ]);
    expect(prepared.doesNotFit[0]!.widthMm).toBeCloseTo(800 + GROWTH_MM, 6);
    expect(prepared.suggestOpen).toBe(true);
  });
  it("fits the same piece on 115 cm open", () => {
    const prepared = preparePieces(wide, { ...folded115, layout: "open" });
    expect(prepared.main).toHaveLength(1);
    expect(prepared.suggestOpen).toBe(false);
  });
  it("does not suggest open when the piece is too wide even opened out", () => {
    const huge = patternOf(rectPiece({ widthMm: 1300, heightMm: 600 }));
    expect(preparePieces(huge, folded115).suggestOpen).toBe(false);
  });
});
