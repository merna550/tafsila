/** Where each piece sits on the projected sheet. Only the identity placement exists so far; moving and turning pieces is issue #287. */
import type { Point } from "@tafsila/schemas";

/** A piece moved from its place on the sheet. */
export interface Placement {
  /** Move in sheet mm. */
  readonly offsetMm: Point;
  /** Turn about the piece centre, in degrees. */
  readonly rotationDeg: number;
}

/** Placements by piece id; a piece without an entry stays where the layout put it. */
export type Placements = Readonly<Record<string, Placement>>;

/** The piece stays where the layout put it. */
export const IDENTITY_PLACEMENT: Placement = { offsetMm: { x: 0, y: 0 }, rotationDeg: 0 };

/** The part of a scene piece the placement needs: its cut box on the sheet. */
export interface PlacedPiece {
  readonly cell: Point;
  readonly bboxMm: { readonly widthMm: number; readonly heightMm: number };
}

/**
 * The SVG transform of one piece for its placement.
 *
 * @param piece - The piece with its box.
 * @param placement - Where it sits; the identity gives an empty string.
 * @returns The `transform` attribute value.
 */
export function placementTransform(piece: PlacedPiece, placement: Placement): string {
  const cx = piece.cell.x + piece.bboxMm.widthMm / 2;
  const cy = piece.cell.y + piece.bboxMm.heightMm / 2;
  const parts: string[] = [];
  if (placement.offsetMm.x !== 0 || placement.offsetMm.y !== 0) {
    parts.push(`translate(${placement.offsetMm.x} ${placement.offsetMm.y})`);
  }
  if (placement.rotationDeg !== 0) parts.push(`rotate(${placement.rotationDeg} ${cx} ${cy})`);
  return parts.join(" ");
}
