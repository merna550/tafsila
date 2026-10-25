/** Unit tests of the tiler (issue #283). */
import type { Point } from "@tafsila/schemas";
import { describe, expect, it } from "vitest";
import { columnLetter } from "./labels";
import { tileSheet } from "./tile-sheet";
import type { TileInput } from "./types";

/**
 * An input whose one outline is a rectangle that spans the whole area, so no tile is empty.
 *
 * @param w - Area width.
 * @param h - Area height.
 * @returns The input.
 */
function full(w: number, h: number): TileInput {
  const outline: Point[] = [
    { x: 0, y: 0 },
    { x: w, y: 0 },
    { x: w, y: h },
    { x: 0, y: h },
  ];
  return { area: { minX: 0, minY: 0, maxX: w, maxY: h }, outlines: [outline] };
}

describe("tileSheet", () => {
  it("puts a small area on one A4 tile", () => {
    const t = tileSheet(full(150, 200), "A4");
    expect([t.cols, t.rows, t.printed]).toEqual([1, 1, ["A1"]]);
  });

  it("A4 1200 x 1500: 7 columns, 6 rows, 180 and 267 mm steps", () => {
    const t = tileSheet(full(1200, 1500), "A4");
    expect([t.cols, t.rows]).toEqual([7, 6]);
    expect(t.printableMm).toEqual({ widthMm: 190, heightMm: 277 });
    expect(t.tiles[1]!.window.minX).toBe(180);
    expect(t.tiles[7]!.window.minY).toBe(267);
    expect(t.tiles.map((x) => x.label).slice(0, 8)).toEqual(["A1", "B1", "C1", "D1", "E1", "F1", "G1", "A2"]);
    expect(t.tiles.at(-1)!.label).toBe("G6");
  });

  it("A0 tie between orientations keeps portrait (2 x 2 both ways)", () => {
    const t = tileSheet(full(1200, 1500), "A0");
    expect([t.orientation, t.cols, t.rows]).toEqual(["portrait", 2, 2]);
  });

  it("A0 chooses landscape when it needs fewer tiles", () => {
    const t = tileSheet(full(1160, 800), "A0");
    expect([t.orientation, t.cols, t.rows]).toEqual(["landscape", 1, 1]);
  });

  it("A0 counts printed tiles, not all tiles, when choosing", () => {
    const input: TileInput = {
      area: { minX: 0, minY: 0, maxX: 1200, maxY: 1500 },
      outlines: [
        [
          { x: 10, y: 10 },
          { x: 100, y: 10 },
          { x: 100, y: 100 },
        ],
      ],
    };
    const t = tileSheet(input, "A0");
    expect(t.printed).toEqual(["A1"]);
    expect(t.skipped).toEqual(["B1", "A2", "B2"]);
  });

  it("names columns like a spreadsheet", () => {
    expect([0, 25, 26, 27, 701, 702].map(columnLetter)).toEqual(["A", "Z", "AA", "AB", "ZZ", "AAA"]);
  });
});
