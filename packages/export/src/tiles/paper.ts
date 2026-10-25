/** Paper formats the print tiles are made for (decision 283). Every number is named here so #288/#290 can retune it. */

/** The papers the app prints on: a home printer and a copy-shop plotter. */
export type PaperId = "A4" | "A0";

/** Which way the page is turned. */
export type Orientation = "portrait" | "landscape";

/** Size and print rules of one paper. */
export interface Paper {
  /** Page width in portrait, in mm. */
  readonly widthMm: number;
  /** Page height in portrait, in mm. */
  readonly heightMm: number;
  /** Unprinted border on each side, in mm (printers and plotters do not print to the edge). */
  readonly marginMm: number;
  /** How far a tile overlaps its neighbour, in mm; 0 means the sheets are butted along the alignment marks. */
  readonly overlapMm: number;
  /** Orientations the tiler may try. */
  readonly orientations: readonly Orientation[];
}

/** A4 page width in mm. */
export const A4_WIDTH_MM = 210;
/** A4 page height in mm. */
export const A4_HEIGHT_MM = 297;
/** A0 page width in mm. */
export const A0_WIDTH_MM = 841;
/** A0 page height in mm. */
export const A0_HEIGHT_MM = 1189;
/** Unprinted border of an A4 page, in mm. */
export const A4_MARGIN_MM = 10;
/** Unprinted border of an A0 page, in mm: copy-shop plotters do not print to the edge. */
export const A0_MARGIN_MM = 10;
/** Overlap between two A4 tiles, in mm, so the sheets can be glued along a line. */
export const A4_OVERLAP_MM = 10;
/** Overlap between two A0 tiles, in mm: none, the sheets are butted. */
export const A0_OVERLAP_MM = 0;

/** The supported papers. */
export const PAPERS: Readonly<Record<PaperId, Paper>> = {
  A4: {
    widthMm: A4_WIDTH_MM,
    heightMm: A4_HEIGHT_MM,
    marginMm: A4_MARGIN_MM,
    overlapMm: A4_OVERLAP_MM,
    orientations: ["portrait"],
  },
  A0: {
    widthMm: A0_WIDTH_MM,
    heightMm: A0_HEIGHT_MM,
    marginMm: A0_MARGIN_MM,
    overlapMm: A0_OVERLAP_MM,
    orientations: ["portrait", "landscape"],
  },
};
