/** Alignment lines drawn on a tile where its printed neighbours are laid. */
import type { Rect } from "@tafsila/engine";
import { tileLabel } from "./labels";
import type { AlignMark } from "./types";

/** Where a tile sits in the grid and which neighbours are printed. */
export interface MarkGrid {
  /** Number of columns. */
  readonly cols: number;
  /** Number of rows. */
  readonly rows: number;
  /** Overlap between neighbours, in mm. */
  readonly overlapMm: number;
  /** True when the tile at this column and row is printed. */
  readonly isPrinted: (col: number, row: number) => boolean;
}

/** One tile's position and window. */
export interface MarkTile {
  /** Column from 0. */
  readonly col: number;
  /** Row from 0. */
  readonly row: number;
  /** The tile window, in sheet mm. */
  readonly window: Rect;
}

/**
 * The alignment lines of a tile: for each printed neighbour, the line where its overlap starts
 * (the window edge itself when there is no overlap).
 *
 * @param tile - The tile.
 * @param grid - The grid it belongs to.
 * @returns The marks, in left, right, top, bottom order.
 */
export function alignmentMarks(tile: MarkTile, grid: MarkGrid): AlignMark[] {
  const { col, row, window: w } = tile;
  const o = grid.overlapMm;
  const name = tileLabel;
  const marks: AlignMark[] = [];
  if (col > 0 && grid.isPrinted(col - 1, row)) {
    marks.push({
      side: "left",
      from: { x: w.minX + o, y: w.minY },
      to: { x: w.minX + o, y: w.maxY },
      neighbour: name(col - 1, row),
    });
  }
  if (col < grid.cols - 1 && grid.isPrinted(col + 1, row)) {
    marks.push({
      side: "right",
      from: { x: w.maxX - o, y: w.minY },
      to: { x: w.maxX - o, y: w.maxY },
      neighbour: name(col + 1, row),
    });
  }
  if (row > 0 && grid.isPrinted(col, row - 1)) {
    marks.push({
      side: "top",
      from: { x: w.minX, y: w.minY + o },
      to: { x: w.maxX, y: w.minY + o },
      neighbour: name(col, row - 1),
    });
  }
  if (row < grid.rows - 1 && grid.isPrinted(col, row + 1)) {
    marks.push({
      side: "bottom",
      from: { x: w.minX, y: w.maxY - o },
      to: { x: w.maxX, y: w.maxY - o },
      neighbour: name(col, row + 1),
    });
  }
  return marks;
}
