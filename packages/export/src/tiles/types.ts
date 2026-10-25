/** Plain-data types of the print tile layout (decision 283); JSON-safe, so the PDF code only draws them. */
import type { Point } from "@tafsila/schemas";
import type { Rect } from "@tafsila/engine";
import type { Orientation, PaperId } from "./paper";

/** What is tiled: the sheet's content box and every cut outline on it, in sheet mm. */
export interface TileInput {
  /** The sheet without its empty border. */
  readonly area: Rect;
  /** Closed outlines of the pieces and of the scale square. */
  readonly outlines: readonly (readonly Point[])[];
}

/** The side of a tile that touches a neighbour. */
export type TileSide = "left" | "right" | "top" | "bottom";

/** A line where the neighbour sheet is laid. */
export interface AlignMark {
  /** Which side of the tile. */
  readonly side: TileSide;
  /** Line start, in sheet mm. */
  readonly from: Point;
  /** Line end, in sheet mm. */
  readonly to: Point;
  /** Label of the neighbour tile. */
  readonly neighbour: string;
}

/** One printed page of the tiling. */
export interface Tile {
  /** Column letter plus row number; `A1` is top-left. */
  readonly label: string;
  /** Column, from 0 at the left. */
  readonly col: number;
  /** Row, from 0 at the top. */
  readonly row: number;
  /** The part of the sheet this page shows, in sheet mm. */
  readonly window: Rect;
  /** True when nothing is cut on this page, so it is not printed. */
  readonly empty: boolean;
  /** Alignment lines toward printed neighbours. */
  readonly marks: readonly AlignMark[];
}

/** The whole tiling of one sheet on one paper. */
export interface Tiling {
  /** Paper used. */
  readonly paper: PaperId;
  /** Orientation chosen. */
  readonly orientation: Orientation;
  /** Number of columns. */
  readonly cols: number;
  /** Number of rows. */
  readonly rows: number;
  /** Printable size of one page, in mm. */
  readonly printableMm: { readonly widthMm: number; readonly heightMm: number };
  /** Overlap between neighbours, in mm. */
  readonly overlapMm: number;
  /** All tiles, row by row. */
  readonly tiles: readonly Tile[];
  /** Labels of the tiles to print, in print order. */
  readonly printed: readonly string[];
  /** Labels of the empty tiles that are not printed. */
  readonly skipped: readonly string[];
}

/** The small map of the tiling for the cover page. */
export interface PageMap {
  /** Scale from sheet mm to map mm. */
  readonly scale: number;
  /** Map width in mm. */
  readonly widthMm: number;
  /** Map height in mm. */
  readonly heightMm: number;
  /** One rectangle per tile, relative to the map's top-left. */
  readonly tiles: readonly { readonly label: string; readonly rect: Rect; readonly empty: boolean }[];
}
