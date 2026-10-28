/* eslint-disable no-magic-numbers -- test helpers: sampling step and the grain line at mid-width */
/** Hand-made shapes and the overlap check of the placement tests. */
import {
  type Point,
  bbox,
  bboxOverlap,
  distancePointToPolyline,
  pointInPolygon,
  pt,
} from "@tafsila/engine/geometry";
import { turnMap } from "../place";
import type { Placement, Shape, Turn } from "../types";

/** What a test rectangle shape needs. */
export interface RectShapeInput {
  /** Shape id, `<pieceId>#<n>`. */
  readonly id: string;
  /** Length along the strip, in mm. */
  readonly lengthMm: number;
  /** Width across the fabric, in mm. */
  readonly widthMm: number;
  /** True for a fold shape. */
  readonly fold?: boolean;
  /** Allowed turns; default 0 and 180. */
  readonly allowedTurns?: readonly Turn[];
}

/**
 * A rectangle shape with its box at the origin.
 *
 * @param input - Id, size, fold and turns.
 * @returns The shape.
 */
export function rectShape(input: RectShapeInput): Shape {
  const { lengthMm: l, widthMm: w } = input;
  return {
    id: input.id,
    pieceId: input.id.split("#")[0]!,
    polygon: [pt(0, 0), pt(l, 0), pt(l, w), pt(0, w)],
    grainLine: [pt(0.1 * l, w / 2), pt(0.9 * l, w / 2)],
    allowedTurns: input.allowedTurns ?? [0, 180],
    fold: input.fold ?? false,
    mirrored: false,
    bbox: { lengthMm: l, widthMm: w },
  };
}

/**
 * A shape's outline where a placement put it on the strip.
 *
 * @param shape - The shape.
 * @param placement - Its placement.
 * @returns The outline on the strip.
 */
export function placedPolygon(shape: Shape, placement: Placement): Point[] {
  const turn = turnMap(shape, placement.rotation);
  return shape.polygon.map((p) => {
    const q = turn(p);
    return pt(q.x + placement.xMm, q.y + placement.yMm);
  });
}

/**
 * Tells whether any point on a's outline lies inside b deeper than the tolerance.
 *
 * @param a - First outline.
 * @param b - Second outline.
 * @param toleranceMm - Allowed depth.
 * @param stepMm - Sampling step along a's edges.
 * @returns True when a pokes into b.
 */
function pokesInto(a: readonly Point[], b: readonly Point[], toleranceMm: number, stepMm: number): boolean {
  const boxB = bbox(b);
  const closedB = [...b, b[0]!];
  return a.some((from, i) => {
    const to = a[(i + 1) % a.length]!;
    const n = Math.max(1, Math.ceil(Math.hypot(to.x - from.x, to.y - from.y) / stepMm));
    for (let k = 0; k <= n; k++) {
      const p = pt(from.x + ((to.x - from.x) * k) / n, from.y + ((to.y - from.y) * k) / n);
      if (p.x <= boxB.minX || p.x >= boxB.maxX || p.y <= boxB.minY || p.y >= boxB.maxY) continue;
      if (pointInPolygon(p, b) && distancePointToPolyline(p, closedB) > toleranceMm) return true;
    }
    return false;
  });
}

/**
 * Tells whether two outlines overlap by more than a tolerance: a sampled point of either outline lies inside the other
 * deeper than the tolerance.
 *
 * @param a - First outline.
 * @param b - Second outline.
 * @param toleranceMm - Allowed overlap depth, in mm.
 * @param stepMm - Sampling step, in mm.
 * @returns True when they overlap.
 */
export function overlaps(a: readonly Point[], b: readonly Point[], toleranceMm: number, stepMm = 1): boolean {
  if (!bboxOverlap(bbox(a), bbox(b))) return false;
  const [first, second] = [a, b];
  return pokesInto(first, second, toleranceMm, stepMm) || pokesInto(second, first, toleranceMm, stepMm);
}
