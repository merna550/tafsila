/**
 * Occupancy of the fabric strip: the covered y-intervals of each 3 mm column (ADR-313 item 1), and the search for the
 * y offsets where a shape's profile fits without overlapping what is already placed.
 */
import { type Interval, type Profile, mergeIntervals } from "./rasterize";

/** Covered y-intervals per strip column; columns past the end are empty. Mutated as shapes are placed. */
export type Occupancy = Interval[][];

/**
 * Removes the open interval (p, q) from a list of closed ranges. Touching is allowed, so p and q themselves stay.
 *
 * @param ranges - Sorted closed ranges.
 * @param p - Start of the forbidden interval.
 * @param q - End of the forbidden interval.
 * @returns The ranges that remain.
 */
function subtractOpen(ranges: readonly Interval[], p: number, q: number): Interval[] {
  const out: Interval[] = [];
  for (const [r, s] of ranges) {
    if (q <= r || p >= s) {
      out.push([r, s]);
      continue;
    }
    if (r <= p) out.push([r, p]);
    if (q <= s) out.push([q, s]);
  }
  return out;
}

/**
 * Removes every y offset at which one profile column would overlap one strip column.
 *
 * @param ranges - Allowed offsets so far.
 * @param shapeColumn - The shape's intervals in this column.
 * @param stripColumn - The strip's occupied intervals in the same column.
 * @returns Allowed offsets that remain.
 */
function subtractColumn(
  ranges: readonly Interval[],
  shapeColumn: readonly Interval[],
  stripColumn: readonly Interval[],
): Interval[] {
  let out: readonly Interval[] = ranges;
  for (const [a, b] of shapeColumn) {
    for (const [lo, hi] of stripColumn) {
      out = subtractOpen(out, lo - b, hi - a);
      if (out.length === 0) return [];
    }
  }
  return [...out];
}

/**
 * The y offsets at which a shape's profile, its first column on strip column `column`, overlaps nothing.
 *
 * @param occupancy - The strip.
 * @param column - Strip column of the shape's first column.
 * @param profile - The shape's profile.
 * @param maxOffsetMm - Largest offset that keeps the shape inside the usable width.
 * @returns Sorted closed ranges of allowed offsets; empty when the shape does not fit there.
 */
export function freeOffsets(
  occupancy: Occupancy,
  column: number,
  profile: Profile,
  maxOffsetMm: number,
): Interval[] {
  let ranges: Interval[] = maxOffsetMm < 0 ? [] : [[0, maxOffsetMm]];
  for (let k = 0; k < profile.length && ranges.length > 0; k++) {
    const stripColumn = occupancy[column + k];
    if (stripColumn) ranges = subtractColumn(ranges, profile[k]!, stripColumn);
  }
  return ranges;
}

/**
 * Marks a placed shape's profile as occupied.
 *
 * @param occupancy - The strip, changed in place.
 * @param column - Strip column of the shape's first column.
 * @param profile - The shape's profile.
 * @param offsetMm - The shape's y offset.
 */
export function occupy(occupancy: Occupancy, column: number, profile: Profile, offsetMm: number): void {
  profile.forEach((intervals, k) => {
    const moved = intervals.map(([a, b]) => [a + offsetMm, b + offsetMm] as const);
    occupancy[column + k] = mergeIntervals([...(occupancy[column + k] ?? []), ...moved]);
  });
}
