/** The small map of the tiles for the cover page. */
import type { PageMap, Tiling } from "./types";

/**
 * Scales the tiling to fit a box, keeping the aspect ratio, and returns each tile's rectangle.
 *
 * @param tiling - The tiling.
 * @param boxMm - The room on the cover page.
 * @returns The map; empty tiles are flagged.
 */
export function pageMap(tiling: Tiling, boxMm: { widthMm: number; heightMm: number }): PageMap {
  const first = tiling.tiles[0]!.window;
  const last = tiling.tiles[tiling.tiles.length - 1]!.window;
  const w = last.maxX - first.minX;
  const h = last.maxY - first.minY;
  const scale = Math.min(boxMm.widthMm / w, boxMm.heightMm / h);
  return {
    scale,
    widthMm: w * scale,
    heightMm: h * scale,
    tiles: tiling.tiles.map((t) => ({
      label: t.label,
      empty: t.empty,
      rect: {
        minX: (t.window.minX - first.minX) * scale,
        minY: (t.window.minY - first.minY) * scale,
        maxX: (t.window.maxX - first.minX) * scale,
        maxY: (t.window.maxY - first.minY) * scale,
      },
    })),
  };
}
