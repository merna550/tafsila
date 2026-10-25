/** Line styles of the PDF (decision 288). Widths are in points; `userUnits` converts them for `drawSvgPath`. */
import { rgb } from "pdf-lib";
import { MM_TO_PT } from "./units";

/**
 * A grey colour.
 *
 * @param level - 0 is black, 1 is white.
 * @returns The colour.
 */
const grey = (level: number): ReturnType<typeof rgb> => rgb(level, level, level);
/** Dark grey level for stitch, grain and darts. */
const DARK_GREY = 0.25;
/** Mid grey level for marks. */
const MID_GREY = 0.45;
/** Light grey level for the hint. */
const LIGHT_GREY = 0.7;

/** Cut line width in points: bold enough to follow with scissors. */
export const CUT_WIDTH_PT = 0.6;
/** Stitch line width in points: thinner than the cut line so the two read apart. */
export const STITCH_WIDTH_PT = 0.35;
/** Stitch dash length in points. */
const STITCH_DASH_LENGTH_PT = 3;
/** Stitch dash gap in points. */
const STITCH_DASH_GAP_PT = 2;
/** Overlap hint dash length in points. */
const HINT_DASH_LENGTH_PT = 4;
/** Overlap hint dash gap in points. */
const HINT_DASH_GAP_PT = 3;
/** Stitch dash in points (dash, gap): the usual sewing-pattern look. */
export const STITCH_DASH_PT: readonly [number, number] = [STITCH_DASH_LENGTH_PT, STITCH_DASH_GAP_PT];
/** Grain, notch, dart and mark width in points. */
export const MARK_WIDTH_PT = 0.3;
/** Dash of the overlap hint in points (dash, gap). */
export const HINT_DASH_PT: readonly [number, number] = [HINT_DASH_LENGTH_PT, HINT_DASH_GAP_PT];
/** Length of an alignment tick at each end of a mark, in mm. */
export const TICK_MM = 8;
/** Size of the tile label in points: large, to find the page in a pile. */
export const TILE_LABEL_PT = 22;
/** Size of the footer in points. */
export const FOOTER_PT = 7;
/** Size of the small "overlap" word in points. */
export const HINT_TEXT_PT = 6;

/** Black for the cut line and text. */
export const INK = rgb(0, 0, 0);
/** Dark grey for stitch, grain and darts. */
export const INK_SOFT = grey(DARK_GREY);
/** Mid grey for alignment marks. */
export const MARK_GREY = grey(MID_GREY);
/** Light grey for the overlap hint, drawn under the pieces. */
export const HINT_GREY = grey(LIGHT_GREY);

/**
 * Converts points to the units a path is drawn in. `drawSvgPath` scales line widths and dashes with the path
 * (the path is in mm and scaled by `MM_TO_PT`), so a width of 0.6 pt must be given as 0.6 / `MM_TO_PT`.
 *
 * @param pt - Length in points.
 * @returns The same length in path units (mm).
 */
export function userUnits(pt: number): number {
  return pt / MM_TO_PT;
}
