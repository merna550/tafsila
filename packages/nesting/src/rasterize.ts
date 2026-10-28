/**
 * Column profile of a shape: for each strip column (ADR-313 item 1), the y-intervals the polygon covers anywhere inside
 * that column. The profile always contains the polygon, so two profiles that do not overlap mean two shapes that do not
 * overlap (decision 316).
 */
import type { Point } from "@tafsila/engine/geometry";

/** A closed range of y, in mm: `[low, high]`. */
export type Interval = readonly [number, number];

/** Covered y-intervals per column, column 0 first; each column's list is sorted and does not overlap itself. */
export type Profile = readonly (readonly Interval[])[];

/** A polygon edge that is not vertical, with x0 < x1. */
interface SlopedEdge {
  /** Smaller x. */
  readonly x0: number;
  /** y at x0. */
  readonly y0: number;
  /** Larger x. */
  readonly x1: number;
  /** y at x1. */
  readonly y1: number;
}

/** Slack used when counting how many columns a length needs, in mm (absorbs floating point noise). */
const COLUMN_EPSILON_MM = 1e-9;

/**
 * The edges of a polygon that are not vertical, each oriented left to right.
 *
 * @param polygon - Corners in order, no repeated closing point.
 * @returns The sloped edges.
 */
function slopedEdges(polygon: readonly Point[]): SlopedEdge[] {
  const edges: SlopedEdge[] = [];
  polygon.forEach((a, i) => {
    const b = polygon[(i + 1) % polygon.length]!;
    if (a.x === b.x) return;
    edges.push(a.x < b.x ? { x0: a.x, y0: a.y, x1: b.x, y1: b.y } : { x0: b.x, y0: b.y, x1: a.x, y1: a.y });
  });
  return edges;
}

/**
 * y of an edge at a given x inside its range.
 *
 * @param e - The edge.
 * @param x - The x, between e.x0 and e.x1.
 * @returns The y.
 */
function yAt(e: SlopedEdge, x: number): number {
  return e.y0 + ((e.y1 - e.y0) * (x - e.x0)) / (e.x1 - e.x0);
}

/**
 * Merges overlapping or touching intervals.
 *
 * @param intervals - Intervals in any order.
 * @returns Sorted intervals that do not overlap.
 */
export function mergeIntervals(intervals: readonly Interval[]): Interval[] {
  const sorted = [...intervals].sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const merged: [number, number][] = [];
  for (const [lo, hi] of sorted) {
    const last = merged[merged.length - 1];
    if (last && lo <= last[1]) last[1] = Math.max(last[1], hi);
    else merged.push([lo, hi]);
  }
  return merged;
}

/**
 * The y-intervals a polygon covers between two x with no corner strictly between them. The crossing edges, sorted by
 * their middle y, pair up into trapezoids (even-odd rule); each trapezoid covers its lowest to highest end.
 *
 * @param edges - The polygon's sloped edges.
 * @param a - Left x.
 * @param b - Right x, greater than a.
 * @returns The covered intervals, unmerged.
 */
function stripIntervals(edges: readonly SlopedEdge[], a: number, b: number): Interval[] {
  const crossing = edges
    .filter((e) => e.x0 <= a && e.x1 >= b)
    .map((e) => [yAt(e, a), yAt(e, b)] as const)
    .sort((p, q) => p[0] + p[1] - (q[0] + q[1]));
  const out: Interval[] = [];
  for (let i = 0; i + 1 < crossing.length; i += 2) {
    const ends = [...crossing[i]!, ...crossing[i + 1]!];
    out.push([Math.min(...ends), Math.max(...ends)]);
  }
  return out;
}

/**
 * The x where the covered intervals may change inside a column: its two sides and every corner strictly between.
 *
 * @param xs - Corner x values, sorted and unique.
 * @param lo - Left side of the column.
 * @param hi - Right side of the column.
 * @returns Sorted break points from lo to hi.
 */
function breakPoints(xs: readonly number[], lo: number, hi: number): number[] {
  return [lo, ...xs.filter((x) => x > lo && x < hi), hi];
}

/**
 * Number of columns a length needs.
 *
 * @param lengthMm - Length along x, in mm.
 * @param sliceMm - Column width, in mm.
 * @returns At least one column.
 */
export function columnsFor(lengthMm: number, sliceMm: number): number {
  return Math.max(1, Math.ceil(lengthMm / sliceMm - COLUMN_EPSILON_MM));
}

/**
 * The column profile of a polygon whose box starts at x = 0.
 *
 * @param polygon - Corners in order, in mm.
 * @param sliceMm - Column width, in mm.
 * @returns Covered y-intervals per column.
 * @example
 * columnProfile([pt(0, 0), pt(6, 0), pt(6, 2), pt(0, 2)], 3) // [[[0, 2]], [[0, 2]]]
 */
export function columnProfile(polygon: readonly Point[], sliceMm: number): Profile {
  const edges = slopedEdges(polygon);
  const xs = [...new Set(polygon.map((p) => p.x))].sort((a, b) => a - b);
  const lengthMm = xs[xs.length - 1]!;
  return Array.from({ length: columnsFor(lengthMm, sliceMm) }, (_, k) => {
    const points = breakPoints(xs, k * sliceMm, Math.min((k + 1) * sliceMm, lengthMm));
    const intervals: Interval[] = [];
    for (let i = 0; i + 1 < points.length; i++) {
      intervals.push(...stripIntervals(edges, points[i]!, points[i + 1]!));
    }
    return mergeIntervals(intervals);
  });
}
