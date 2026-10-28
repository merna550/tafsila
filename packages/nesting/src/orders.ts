/**
 * The three piece orders the placement tries (ADR-313 item 1): by area, by height across the fabric and by length along
 * the grain, largest first, ties by shape id. The shortest strip wins; equal strips keep the earlier order.
 */
import { signedArea } from "@tafsila/engine/geometry";
import type { PieceOrder, Shape } from "./types";

/** The sort key of each order, in mm or mm². */
const KEYS: Readonly<Record<PieceOrder, (s: Shape) => number>> = {
  area: (s) => Math.abs(signedArea(s.polygon)),
  width: (s) => s.bbox.widthMm,
  length: (s) => s.bbox.lengthMm,
};

/**
 * Compares two ids in code-unit order, the same in every locale (NFR-08).
 *
 * @param a - First id.
 * @param b - Second id.
 * @returns Negative, zero or positive.
 */
function byId(a: string, b: string): number {
  if (a === b) return 0;
  return a < b ? -1 : 1;
}

/**
 * Sorts shapes for one piece order: largest first, ties by shape id, so the input order never matters.
 *
 * @param shapes - The shapes of one fabric kind.
 * @param order - The piece order.
 * @returns A new sorted list.
 * @example
 * sortShapes(prepared.main, "area")[0] // the largest shape
 */
export function sortShapes(shapes: readonly Shape[], order: PieceOrder): Shape[] {
  const key = KEYS[order];
  return [...shapes].sort((a, b) => key(b) - key(a) || byId(a.id, b.id));
}
