/** Cuts a sheet into paper-sized tiles on a fixed grid (decision 283). */
import type { Rect } from "@tafsila/engine";
import { alignmentMarks } from "./marks";
import { tileLabel } from "./labels";
import { isTileEmpty } from "./occupancy";
import { PAPERS, type Orientation, type PaperId } from "./paper";
import type { Tile, TileInput, Tiling } from "./types";

/** Printable size of a page and how many pages cover the area. */
interface Grid {
  readonly pw: number;
  readonly ph: number;
  readonly stepX: number;
  readonly stepY: number;
  readonly cols: number;
  readonly rows: number;
}

/**
 * Pages needed along one axis: the first covers `printable`, each next adds `step`.
 *
 * @param extent - Length to cover, in mm.
 * @param printable - Printable length of a page, in mm.
 * @param overlap - Overlap between pages, in mm.
 * @returns At least 1.
 */
function pagesAlong(extent: number, printable: number, overlap: number): number {
  return Math.max(1, Math.ceil((extent - overlap) / (printable - overlap)));
}

/**
 * The grid of one paper in one orientation.
 *
 * @param area - The area to cover.
 * @param paper - Paper id.
 * @param orientation - Page orientation.
 * @returns The grid.
 */
function gridFor(area: Rect, paper: PaperId, orientation: Orientation): Grid {
  const p = PAPERS[paper];
  const [w, h] = orientation === "portrait" ? [p.widthMm, p.heightMm] : [p.heightMm, p.widthMm];
  const pw = w - 2 * p.marginMm;
  const ph = h - 2 * p.marginMm;
  const stepX = pw - p.overlapMm;
  const stepY = ph - p.overlapMm;
  return {
    pw,
    ph,
    stepX,
    stepY,
    cols: pagesAlong(area.maxX - area.minX, pw, p.overlapMm),
    rows: pagesAlong(area.maxY - area.minY, ph, p.overlapMm),
  };
}

/**
 * Builds the tiling for one orientation.
 *
 * @param input - The area and outlines.
 * @param paper - Paper id.
 * @param orientation - Page orientation.
 * @returns The tiling.
 */
function tileOriented(input: TileInput, paper: PaperId, orientation: Orientation): Tiling {
  const g = gridFor(input.area, paper, orientation);
  const overlapMm = PAPERS[paper].overlapMm;
  const bare = Array.from({ length: g.rows * g.cols }, (_, i) => {
    const col = i % g.cols;
    const row = Math.floor(i / g.cols);
    const minX = input.area.minX + col * g.stepX;
    const minY = input.area.minY + row * g.stepY;
    const window = { minX, minY, maxX: minX + g.pw, maxY: minY + g.ph };
    return { col, row, window, empty: isTileEmpty(window, input.outlines) };
  });
  /**
   * True when the tile at a column and row has something to print.
   *
   * @param c - Column.
   * @param r - Row.
   * @returns Whether it is printed.
   */
  const isPrinted = (c: number, r: number): boolean => !bare[r * g.cols + c]!.empty;
  const tiles: Tile[] = bare.map((t) => ({
    ...t,
    label: tileLabel(t.col, t.row),
    marks: alignmentMarks(t, { cols: g.cols, rows: g.rows, overlapMm, isPrinted }),
  }));
  return {
    paper,
    orientation,
    cols: g.cols,
    rows: g.rows,
    printableMm: { widthMm: g.pw, heightMm: g.ph },
    overlapMm,
    tiles,
    printed: tiles.filter((t) => !t.empty).map((t) => t.label),
    skipped: tiles.filter((t) => t.empty).map((t) => t.label),
  };
}

/**
 * Tiles a sheet for a paper. Every window has the full printable size and starts on a fixed grid, so scale and
 * origin are the same on every page; the last column or row may run past the content (blank paper). A0 tries both
 * orientations and keeps the one with fewer printed tiles (portrait on a tie).
 *
 * @param input - The area and outlines to tile.
 * @param paper - The paper.
 * @returns The tiling; plain data.
 */
export function tileSheet(input: TileInput, paper: PaperId): Tiling {
  const [first, ...rest] = PAPERS[paper].orientations.map((o) => tileOriented(input, paper, o));
  return rest.reduce((best, t) => (t.printed.length < best.printed.length ? t : best), first!);
}
