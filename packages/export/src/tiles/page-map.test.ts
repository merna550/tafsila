/** Unit tests of the page map (issue #283). */
import { describe, expect, it } from "vitest";
import { pageMap } from "./page-map";
import { tileSheet } from "./tile-sheet";

const INPUT = {
  area: { minX: 0, minY: 0, maxX: 1200, maxY: 1500 },
  outlines: [
    [
      { x: 10, y: 10 },
      { x: 100, y: 10 },
      { x: 100, y: 100 },
    ],
  ],
};

describe("pageMap", () => {
  const tiling = tileSheet(INPUT, "A0");
  const map = pageMap(tiling, { widthMm: 100, heightMm: 100 });

  it("fits the box and keeps the aspect ratio", () => {
    expect(map.widthMm).toBeLessThanOrEqual(100 + 1e-9);
    expect(map.heightMm).toBeLessThanOrEqual(100 + 1e-9);
    const t = tiling.tiles;
    const ratio = (t.at(-1)!.window.maxX - t[0]!.window.minX) / (t.at(-1)!.window.maxY - t[0]!.window.minY);
    expect(map.widthMm / map.heightMm).toBeCloseTo(ratio, 9);
  });

  it("flags skipped tiles and starts at the origin", () => {
    expect(map.tiles.filter((t) => t.empty).map((t) => t.label)).toEqual(tiling.skipped);
    expect(map.tiles[0]!.rect.minX).toBe(0);
  });
});
