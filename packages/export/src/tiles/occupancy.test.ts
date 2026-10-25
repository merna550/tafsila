/** Unit tests of tile occupancy (issue #283). */
import type { Point } from "@tafsila/schemas";
import { describe, expect, it } from "vitest";
import { isTileEmpty } from "./occupancy";

const WINDOW = { minX: 0, minY: 0, maxX: 100, maxY: 100 };

/**
 * A closed circle outline.
 *
 * @param r - Radius.
 * @returns 72 points around the origin.
 */
function circle(r: number): Point[] {
  return Array.from({ length: 72 }, (_, i) => ({
    x: r * Math.cos((i * Math.PI) / 36),
    y: r * Math.sin((i * Math.PI) / 36),
  }));
}

describe("isTileEmpty", () => {
  it("is not empty when a line crosses the window", () => {
    expect(
      isTileEmpty(WINDOW, [
        [
          { x: -50, y: 50 },
          { x: 150, y: 50 },
          { x: 150, y: 400 },
        ],
      ]),
    ).toBe(false);
  });

  it("is not empty when the window sits inside a big piece", () => {
    expect(isTileEmpty({ minX: 100, minY: 100, maxX: 300, maxY: 300 }, [circle(2000)])).toBe(false);
  });

  it("is empty away from every outline", () => {
    expect(isTileEmpty(WINDOW, [circle(50).map((p) => ({ x: p.x + 1000, y: p.y + 1000 })), []])).toBe(true);
  });

  it("is not empty when a curve only clips a corner", () => {
    expect(isTileEmpty(WINDOW, [circle(150)])).toBe(false);
    expect(isTileEmpty({ minX: 110, minY: 110, maxX: 210, maxY: 210 }, [circle(170)])).toBe(false);
  });
});
