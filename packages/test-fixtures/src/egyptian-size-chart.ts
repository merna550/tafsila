/* eslint-disable no-magic-numbers -- this file is a data table of researched and derived measurement values */
/**
 * Default Egyptian size chart S-XXL (issue #158), the values the migration inserts.
 *
 * Sources (see docs/decisions/158-egyptian-size-chart.md):
 * - NRC Cairo / Dr. Azza Serry El-Din national sizing project: sizes 48-54 most common, hips wider than bust.
 * - Moustafa et al., Ergonomics 1987 (4,960 Egyptian women): bust and hip.
 * - Alexandria study: mean height about 159 cm (160 cm used).
 * Bust, hip and height come from those sources. Waist and the other 14 measurements are DERIVED from
 * standard pattern proportions, not measured on Egyptian women.
 *
 * The same numbers live in `supabase/data/egyptian-size-chart.csv` (cm, for the /admin/sizes import).
 */
import type { Measurements, SizeChart } from "@tafsila/schemas";

/** Number of millimetres in a centimetre. */
const MM_PER_CM = 10;

/** One row of the chart in cm: the values for S, M, L, XL, XXL in that order. */
type CmRow = readonly [number, number, number, number, number];

/** Size labels, in the column order of the cm table. */
const SIZE_LABELS = ["S", "M", "L", "XL", "XXL"] as const;

/** The chart in cm, one row per measurement (same as the CSV file). */
const CHART_CM: Readonly<Record<Exclude<keyof Measurements, "unit">, CmRow>> = {
  height: [160, 160, 160, 160, 160],
  bust: [88, 96, 104, 112, 120],
  highBust: [84, 91, 98, 105, 112],
  underBust: [74, 80, 87, 94, 101],
  waist: [70, 78, 86, 94, 102],
  hip: [96, 104, 112, 120, 128],
  hipDepth: [20, 20.5, 21, 21.5, 22],
  neck: [35, 36.5, 38, 39.5, 41],
  shoulderWidth: [37, 38.5, 40, 41.5, 43],
  backLength: [39, 39.5, 40, 40.5, 41],
  frontLength: [42, 43.5, 45, 46.5, 48],
  bustPointDistance: [18, 19, 20, 21, 22],
  bustHeight: [24, 25, 26, 27, 28],
  armLength: [57, 57.5, 58, 58.5, 59],
  upperArm: [27, 29.5, 32, 34.5, 37],
  wrist: [15.5, 16, 16.5, 17, 17.5],
  waistToKnee: [57, 57, 57.5, 57.5, 58],
  waistToFloor: [100, 100, 100.5, 100.5, 101],
};

/**
 * Builds the measurements of one size in whole millimetres.
 *
 * @param column - Index of the size in `SIZE_LABELS`.
 * @returns All 18 measurements of that size.
 */
function sizeAt(column: number): Measurements {
  const row: Record<string, number | string> = { unit: "mm" };
  for (const [key, cells] of Object.entries(CHART_CM)) {
    row[key] = Math.round(cells[column]! * MM_PER_CM);
  }
  return row as unknown as Measurements;
}

/** Name of the default system chart. */
export const EGYPTIAN_SIZE_CHART_NAME = "Egyptian women S-XXL (NRC Cairo / Moustafa 1987, derived)";

/** The default Egyptian size chart with sizes S, M, L, XL and XXL, in mm. */
export const egyptianSizeChart: SizeChart = Object.fromEntries(
  SIZE_LABELS.map((label, column) => [label, sizeAt(column)]),
);
