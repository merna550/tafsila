/** Pure matching of the pieces of two drafts by id, and the sheet box that holds the overlay (issue #345). */
import type { LocalizedText } from "@/shared/pattern-preview";
import type { PatternScene } from "@/features/pattern-viewer";

/** One piece of a draft, as the viewer draws it. */
export type ScenePiece = PatternScene["pieces"][number];

/** Size difference, in mm, under which a piece counts as unchanged. */
const SAME_SIZE_MM = 0.5;

/** How a piece compares between the two versions. */
export type PieceStatus = "same" | "changed" | "added" | "removed";

/** One piece in the overlay. */
export interface MatchedPiece {
  /** Piece id, the same in both versions. */
  readonly id: string;
  /** The piece name. */
  readonly name: LocalizedText;
  /** How it compares. */
  readonly status: PieceStatus;
  /** The piece in the first version, if present. */
  readonly a?: ScenePiece;
  /** The piece in the second version, if present. */
  readonly b?: ScenePiece;
  /** Move, in mm, that puts the second version's piece on the first one's corner so a change shows in place. */
  readonly shift: { readonly x: number; readonly y: number };
}

/**
 * Matches pieces by id. Pieces of the first draft keep their place; a piece only in the second keeps its own place.
 *
 * @param a - The first (older) draft.
 * @param b - The second (newer) draft.
 * @returns One entry per id, first draft order then the added ones.
 */
export function matchPieces(a: PatternScene, b: PatternScene): MatchedPiece[] {
  const inB = new Map(b.pieces.map((p) => [p.id, p]));
  const inA = new Set(a.pieces.map((p) => p.id));
  const matched = a.pieces.map((pa): MatchedPiece => {
    const pb = inB.get(pa.id);
    if (pb === undefined)
      return { id: pa.id, name: pa.name, status: "removed", a: pa, shift: { x: 0, y: 0 } };
    const same =
      Math.abs(pa.bboxMm.widthMm - pb.bboxMm.widthMm) < SAME_SIZE_MM &&
      Math.abs(pa.bboxMm.heightMm - pb.bboxMm.heightMm) < SAME_SIZE_MM;
    return {
      id: pa.id,
      name: pa.name,
      status: same ? "same" : "changed",
      a: pa,
      b: pb,
      shift: { x: pa.cell.x - pb.cell.x, y: pa.cell.y - pb.cell.y },
    };
  });
  const added = b.pieces
    .filter((p) => !inA.has(p.id))
    .map((pb): MatchedPiece => ({ id: pb.id, name: pb.name, status: "added", b: pb, shift: { x: 0, y: 0 } }));
  return [...matched, ...added];
}

/** A rectangle in mm. */
export interface OverlayBox {
  /** Left. */
  readonly x: number;
  /** Top. */
  readonly y: number;
  /** Width. */
  readonly width: number;
  /** Height. */
  readonly height: number;
}

/**
 * The box that holds every drawn piece with a margin, used as the SVG view box.
 *
 * @param pieces - The matched pieces.
 * @param marginMm - Space kept around the pieces.
 * @returns The box; a small empty box when there are no pieces.
 */
export function overlayBox(pieces: readonly MatchedPiece[], marginMm: number): OverlayBox {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const m of pieces) {
    for (const [p, dx, dy] of [
      [m.a, 0, 0],
      [m.b, m.shift.x, m.shift.y],
    ] as const) {
      if (p === undefined) continue;
      minX = Math.min(minX, p.cell.x + dx);
      minY = Math.min(minY, p.cell.y + dy);
      maxX = Math.max(maxX, p.cell.x + dx + p.bboxMm.widthMm);
      maxY = Math.max(maxY, p.cell.y + dy + p.bboxMm.heightMm);
    }
  }
  if (minX === Infinity) return { x: 0, y: 0, width: 100, height: 100 };
  return {
    x: minX - marginMm,
    y: minY - marginMm,
    width: maxX - minX + 2 * marginMm,
    height: maxY - minY + 2 * marginMm,
  };
}

/**
 * The names of the pieces with one status, in the page language.
 *
 * @param pieces - The matched pieces.
 * @param status - Which status to list.
 * @param locale - Page language.
 * @returns The names joined by commas; empty when there are none.
 */
export function pieceNames(
  pieces: readonly MatchedPiece[],
  status: PieceStatus,
  locale: keyof LocalizedText,
): string {
  return pieces
    .filter((p) => p.status === status)
    .map((p) => p.name[locale])
    .join(", ");
}
