/**
 * The length to buy (FR-FAB-03; decision 316): strip length, plus shrinkage, plus one pattern repeat per row of cut
 * pieces, rounded up to 0.1 m.
 */
import type { FabricOptions } from "@tafsila/schemas";
import { LENGTH_EPSILON_MM, LENGTH_STEP_MM, MM_PER_M } from "./constants";
import type { Interval } from "./rasterize";

/** The options the length step reads. */
export type LengthOptions = Pick<FabricOptions, "shrinkagePercent" | "patternRepeatMm">;

/**
 * Counts the rows of cut pieces: the x-bands left once the bands of overlapping pieces are joined. Pieces that share
 * any length of the strip are one row (touching bands are two rows); a repeat is added per row so each row can be matched to the print.
 *
 * @param bands - Each placed shape's `[start, end]` along the strip, in mm.
 * @returns The number of rows (0 for no shapes).
 * @example
 * rowCount([[0, 500], [400, 900], [1000, 1200]]) // 2
 */
export function rowCount(bands: readonly Interval[]): number {
  const strict = bands.filter(([a, b]) => b > a).sort((p, q) => p[0] - q[0]);
  let rows = 0;
  let end = -Infinity;
  for (const [a, b] of strict) {
    if (a >= end) rows++;
    end = Math.max(end, b);
  }
  return rows;
}

/**
 * The fabric length to buy, in metres.
 *
 * @param stripLengthMm - Used strip length from the placement, in mm.
 * @param options - Shrinkage in percent and pattern repeat in mm.
 * @param rows - Rows of cut pieces, from `rowCount`.
 * @returns Metres, rounded up to 0.1 m; a length within 0.01 mm of a step stays on that step.
 * @example
 * fabricLengthM(1230, { shrinkagePercent: 5, patternRepeatMm: 0 }, 1) // 1.3
 */
export function fabricLengthM(stripLengthMm: number, options: LengthOptions, rows: number): number {
  const mm =
    stripLengthMm + (stripLengthMm * options.shrinkagePercent) / 100 + options.patternRepeatMm * rows;
  const steps = Math.max(0, Math.ceil((mm - LENGTH_EPSILON_MM) / LENGTH_STEP_MM));
  return (steps * LENGTH_STEP_MM) / MM_PER_M;
}
