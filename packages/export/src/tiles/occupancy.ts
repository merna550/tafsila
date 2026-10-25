/** Decides whether a tile has anything to print. */
import { bbox, bboxOverlap, pointInPolygon, segmentTouchesRect, type Rect } from "@tafsila/engine";
import type { Point } from "@tafsila/schemas";

/**
 * True when an outline has a side that touches the window.
 *
 * @param window - The tile window.
 * @param outline - A closed outline.
 * @returns Whether a side touches the window.
 */
function outlineTouches(window: Rect, outline: readonly Point[]): boolean {
  return outline.some((a, i) => segmentTouchesRect(window, a, outline[(i + 1) % outline.length]!));
}

/**
 * True when nothing is cut inside the window: no outline side touches it and it is not inside a piece
 * (a big piece such as a circle skirt can fill a tile without a line on it).
 *
 * @param window - The tile window.
 * @param outlines - Closed outlines of the pieces and the scale square.
 * @returns Whether the tile can be left out.
 */
export function isTileEmpty(window: Rect, outlines: readonly (readonly Point[])[]): boolean {
  const centre = { x: (window.minX + window.maxX) / 2, y: (window.minY + window.maxY) / 2 };
  return !outlines.some((outline) => {
    if (outline.length < 2 || !bboxOverlap(bbox(outline), window)) return false;
    return outlineTouches(window, outline) || pointInPolygon(centre, outline);
  });
}
