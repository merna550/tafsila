import type { Piece } from "@tafsila/schemas";
import { rectanglePattern } from "@tafsila/test-fixtures";
import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { layoutSheet, SCALE_SQUARE_MM, SHEET_MARGIN_MM, SHEET_MAX_WIDTH_MM } from "./sheet-layout";

/**
 * A rectangle piece of the given size with its corner at the origin.
 *
 * @param id - Piece id.
 * @param w - Width in mm.
 * @param h - Height in mm.
 * @returns The piece.
 */
function box(id: string, w: number, h: number): Piece {
  const base = rectanglePattern.pieces[0]!;
  const path = [
    { kind: "line" as const, from: { x: 0, y: 0 }, to: { x: w, y: 0 } },
    { kind: "line" as const, from: { x: w, y: 0 }, to: { x: w, y: h } },
    { kind: "line" as const, from: { x: w, y: h }, to: { x: 0, y: h } },
    { kind: "line" as const, from: { x: 0, y: h }, to: { x: 0, y: 0 } },
  ];
  return { ...base, id, cutPath: path, stitchPath: path };
}

describe("layoutSheet", () => {
  it("puts the first piece at the margin", () => {
    const layout = layoutSheet(rectanglePattern.pieces);
    expect(layout.placements[0]!.cell).toEqual({ x: SHEET_MARGIN_MM, y: SHEET_MARGIN_MM });
    expect(layout.placements[0]!.offset).toEqual({ x: SHEET_MARGIN_MM + 15, y: SHEET_MARGIN_MM + 15 });
  });

  it("wraps three wide pieces to a second row", () => {
    const layout = layoutSheet([box("a", 500, 100), box("b", 500, 100), box("c", 500, 100)]);
    const ys = layout.placements.map((p) => p.cell.y);
    expect(ys[0]).toBe(ys[1]);
    expect(ys[2]).toBeGreaterThan(ys[0]!);
    expect(layout.widthMm).toBeLessThanOrEqual(SHEET_MAX_WIDTH_MM + SHEET_MARGIN_MM);
  });

  it("renders an empty sheet with just room for the scale square", () => {
    const layout = layoutSheet([]);
    expect(layout.placements).toEqual([]);
    expect(layout.heightMm).toBe(SHEET_MARGIN_MM * 2 + SCALE_SQUARE_MM);
  });

  it("never overlaps cells or the scale square, and keeps the order", () => {
    const size = fc.record({ w: fc.integer({ min: 10, max: 900 }), h: fc.integer({ min: 10, max: 900 }) });
    fc.assert(
      fc.property(fc.array(size, { minLength: 1, maxLength: 12 }), (sizes) => {
        const layout = layoutSheet(sizes.map((s, i) => box(`p${i}`, s.w, s.h)));
        const rects = layout.placements.map((p) => ({
          x: p.cell.x,
          y: p.cell.y,
          w: p.size.widthMm,
          h: p.size.heightMm,
        }));
        rects.push({ ...layout.scaleSquare, w: SCALE_SQUARE_MM, h: SCALE_SQUARE_MM });
        const overlap = (a: (typeof rects)[number], b: (typeof rects)[number]): boolean =>
          a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
        const clash = rects.some((a, i) => rects.some((b, j) => i < j && overlap(a, b)));
        expect(clash).toBe(false);
        expect(layout.placements.map((p) => p.piece.id)).toEqual(sizes.map((_, i) => `p${i}`));
      }),
    );
  });
});
