/** Places pieces side by side on a print sheet and reserves the scale square (decision 127). */
import type { Piece, Point } from "@tafsila/schemas";
import { bbox, samplePath } from "../geometry";

/** Widest sheet before pieces wrap to a new row: about the width of a plotter roll. */
export const SHEET_MAX_WIDTH_MM = 1200;
/** Space between two piece cells, in mm. */
export const SHEET_GAP_MM = 50;
/** Empty border around the sheet, in mm. */
export const SHEET_MARGIN_MM = 20;
/** Side of the scale check square: 10 cm. */
export const SCALE_SQUARE_MM = 100;

/** Where one piece sits on the sheet. */
export interface PiecePlacement {
  /** The piece. */
  readonly piece: Piece;
  /** Move to add to every point of the piece to put it on the sheet. */
  readonly offset: Point;
  /** Top-left of the piece cell on the sheet. */
  readonly cell: Point;
  /** Cell size (the cut-path bounding box). */
  readonly size: { readonly widthMm: number; readonly heightMm: number };
}

/** The full sheet: size, piece placements and the scale square. */
export interface SheetLayout {
  /** Sheet width in mm. */
  readonly widthMm: number;
  /** Sheet height in mm. */
  readonly heightMm: number;
  /** One placement per piece, in piece order. */
  readonly placements: readonly PiecePlacement[];
  /** Top-left of the sheet's own scale square; null when a piece carries the square as a label. */
  readonly scaleSquare: Point | null;
}

/** Cut-path bounding box of a piece. */
interface PieceBox {
  readonly minX: number;
  readonly minY: number;
  readonly widthMm: number;
  readonly heightMm: number;
}

/**
 * Bounding box of the cut line of a piece.
 *
 * @param piece - The piece.
 * @returns Its box.
 */
function pieceBox(piece: Piece): PieceBox {
  const box = bbox(samplePath(piece.cutPath));
  return { minX: box.minX, minY: box.minY, widthMm: box.maxX - box.minX, heightMm: box.maxY - box.minY };
}

/** Running state while cells are placed row by row. */
interface RowState {
  readonly x: number;
  readonly y: number;
  readonly rowHeight: number;
  readonly right: number;
}

/**
 * Moves the cursor to the next cell, wrapping to a new row when the cell would pass the sheet width.
 *
 * @param state - Cursor before this cell.
 * @param box - The cell size to place.
 * @returns The top-left of the cell and the cursor after it.
 */
function nextCell(state: RowState, box: PieceBox): { cell: Point; state: RowState } {
  const wraps = state.x > SHEET_MARGIN_MM && state.x + box.widthMm > SHEET_MAX_WIDTH_MM - SHEET_MARGIN_MM;
  const x = wraps ? SHEET_MARGIN_MM : state.x;
  const y = wraps ? state.y + state.rowHeight + SHEET_GAP_MM : state.y;
  const rowHeight = wraps ? box.heightMm : Math.max(state.rowHeight, box.heightMm);
  const end = x + box.widthMm;
  return {
    cell: { x, y },
    state: { x: end + SHEET_GAP_MM, y, rowHeight, right: Math.max(state.right, end) },
  };
}

/**
 * Lays pieces out left to right, wrapping at the maximum sheet width, with the scale square below them.
 *
 * @param pieces - The pieces in order.
 * @returns The sheet layout; pure and stable for the same pieces.
 */
export function layoutSheet(pieces: readonly Piece[]): SheetLayout {
  let state: RowState = { x: SHEET_MARGIN_MM, y: SHEET_MARGIN_MM, rowHeight: 0, right: SHEET_MARGIN_MM };
  const placements = pieces.map((piece) => {
    const box = pieceBox(piece);
    const next = nextCell(state, box);
    state = next.state;
    return {
      piece,
      cell: next.cell,
      size: { widthMm: box.widthMm, heightMm: box.heightMm },
      offset: { x: next.cell.x - box.minX, y: next.cell.y - box.minY },
    };
  });
  const piecesBottom = pieces.length === 0 ? SHEET_MARGIN_MM : state.y + state.rowHeight;
  if (pieces.some((p) => p.labels.some((l) => l.kind === "scale-square"))) {
    return {
      widthMm: state.right + SHEET_MARGIN_MM,
      heightMm: piecesBottom + SHEET_MARGIN_MM,
      placements,
      scaleSquare: null,
    };
  }
  const squareY = pieces.length === 0 ? SHEET_MARGIN_MM : piecesBottom + SHEET_GAP_MM;
  return {
    widthMm: Math.max(state.right, SHEET_MARGIN_MM + SCALE_SQUARE_MM) + SHEET_MARGIN_MM,
    heightMm: squareY + SCALE_SQUARE_MM + SHEET_MARGIN_MM,
    placements,
    scaleSquare: { x: SHEET_MARGIN_MM, y: squareY },
  };
}
