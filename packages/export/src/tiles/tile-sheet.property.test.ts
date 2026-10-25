/** Property tests of the tiler (issue #283). */
import * as fc from "fast-check";
import { describe, expect, it } from "vitest";
import { tileSheet } from "./tile-sheet";
import { PAPERS } from "./paper";
import type { TileInput } from "./types";

/** Step between sample points when checking coverage, in mm. */
const SAMPLE_MM = 7;

/**
 * An input with one rectangle outline over the whole area.
 *
 * @param w - Width.
 * @param h - Height.
 * @returns The input.
 */
function input(w: number, h: number): TileInput {
  return {
    area: { minX: 0, minY: 0, maxX: w, maxY: h },
    outlines: [
      [
        { x: 0, y: 0 },
        { x: w, y: 0 },
        { x: w, y: h },
      ],
    ],
  };
}

const size = fc.integer({ min: 1, max: 4000 });
const paper = fc.constantFrom("A4" as const, "A0" as const);

describe("tileSheet properties", () => {
  it("the windows cover the area", () => {
    fc.assert(
      fc.property(size, size, paper, (w, h, p) => {
        const t = tileSheet(input(w, h), p);
        // A grid window set covers the area when its column ranges and its row ranges each cover their axis.
        const cols = t.tiles.filter((k) => k.row === 0).map((k) => k.window);
        const rows = t.tiles.filter((k) => k.col === 0).map((k) => k.window);
        for (let x = 0; x <= w; x += SAMPLE_MM)
          expect(cols.some((r) => x >= r.minX && x <= r.maxX)).toBe(true);
        for (let y = 0; y <= h; y += SAMPLE_MM)
          expect(rows.some((r) => y >= r.minY && y <= r.maxY)).toBe(true);
      }),
      { numRuns: 30 },
    );
  });

  it("neighbours overlap by exactly the overlap and no window exceeds the printable area", () => {
    fc.assert(
      fc.property(size, size, paper, (w, h, p) => {
        const t = tileSheet(input(w, h), p);
        for (const k of t.tiles) {
          expect(k.window.maxX - k.window.minX).toBeCloseTo(t.printableMm.widthMm, 9);
          expect(k.window.maxY - k.window.minY).toBeCloseTo(t.printableMm.heightMm, 9);
          const right = t.tiles.find((n) => n.row === k.row && n.col === k.col + 1);
          const below = t.tiles.find((n) => n.col === k.col && n.row === k.row + 1);
          if (right)
            expect(Math.abs(k.window.maxX - right.window.minX - PAPERS[p].overlapMm)).toBeLessThan(1e-9);
          if (below)
            expect(Math.abs(k.window.maxY - below.window.minY - PAPERS[p].overlapMm)).toBeLessThan(1e-9);
        }
      }),
      { numRuns: 100 },
    );
  });

  it("printed and skipped labels are disjoint and cover every tile", () => {
    fc.assert(
      fc.property(size, size, paper, (w, h, p) => {
        const t = tileSheet({ area: input(w, h).area, outlines: [] }, p);
        const all = [...t.printed, ...t.skipped];
        expect(new Set(all).size).toBe(all.length);
        expect(new Set(all)).toEqual(new Set(t.tiles.map((k) => k.label)));
      }),
      { numRuns: 100 },
    );
  });
});
