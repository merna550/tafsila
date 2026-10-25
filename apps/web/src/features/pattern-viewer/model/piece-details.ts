/** Display values of one piece for the details panel: only reads scene fields and converts mm to cm (issue #248). */
import { mmToCmText } from "@/shared/format";
import type { ScenePiece } from "./types";

/** How a piece is cut: on the fold, as a mirrored pair, or as plain copies. */
export type CutKind = "fold" | "pair" | "single";

/** One edge row of the panel. */
export interface EdgeDetail {
  /** Edge id from the engine. */
  readonly id: string;
  /** Length along the stitch line, in cm text. */
  readonly lengthCm: string;
  /** Seam allowance, in cm text. */
  readonly allowanceCm: string;
}

/** Everything the panel shows about a piece. */
export interface PieceDetails {
  /** How the piece is cut. */
  readonly cutKind: CutKind;
  /** How many copies to cut. */
  readonly quantity: number;
  /** Whether the copies are mirrored. */
  readonly mirror: boolean;
  /** Fabric the piece is cut from. */
  readonly fabric: ScenePiece["cut"]["fabric"];
  /** Bounding width in cm text. */
  readonly widthCm: string;
  /** Bounding height in cm text. */
  readonly heightCm: string;
  /** One row per edge. */
  readonly edges: readonly EdgeDetail[];
}

/**
 * Reads the panel values from a scene piece (the engine already measured the edges).
 *
 * @param piece - The scene piece.
 * @returns The values to show.
 */
export function pieceDetails(piece: ScenePiece): PieceDetails {
  const { quantity, onFold, mirror, fabric } = piece.cut;
  let cutKind: CutKind = "single";
  if (onFold) cutKind = "fold";
  else if (quantity === 2 && mirror) cutKind = "pair";
  return {
    cutKind,
    quantity,
    mirror,
    fabric,
    widthCm: mmToCmText(piece.bboxMm.widthMm),
    heightCm: mmToCmText(piece.bboxMm.heightMm),
    edges: piece.edges.map((e) => ({
      id: e.id,
      lengthCm: mmToCmText(e.lengthMm),
      allowanceCm: mmToCmText(e.seamAllowanceMm),
    })),
  };
}
