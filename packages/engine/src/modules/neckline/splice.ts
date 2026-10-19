/**
 * Puts a new neckline into a bodice piece (issue #139): the neck edge is replaced, the shoulder starts at the new
 * neck point and the centre line ends at the new centre neck point. Works on the darted block halves and on the
 * princess centre panels, which share the order neck, shoulder, ..., centre line on the fold.
 */
import type { EngineOptions, Point, Segment } from "@tafsila/schemas";
import type { EdgeSpec } from "../../blocks/shared/edges";
import { buildEdges } from "../../blocks/shared/edges";
import { GRAIN_END_INSET_MM } from "../../constants/bodice";
import { DraftingError } from "../../errors/drafting-error";
import { lineSeg, pt } from "../../geometry";
import { NECK_EDGE_ID, SHOULDER_EDGE_ID } from "../../pieces/neck-seam";
import type { PieceDraft } from "../../pipeline/draft-context";

/** The new neck of one half. */
export interface NewNeck {
  /** Neck segments, centre line to neck point. */
  readonly segments: readonly Segment[];
  /** New centre neck point. */
  readonly centre: Point;
  /** New neck point on the shoulder line. */
  readonly neckPoint: Point;
}

/**
 * Whether the piece starts with the neck and a straight shoulder.
 *
 * @param piece - The bodice piece.
 * @returns True when it does.
 */
function startsWithNeckAndShoulder(piece: PieceDraft): boolean {
  const [neck, shoulder] = piece.edges;
  if (neck?.id !== NECK_EDGE_ID || shoulder?.id !== SHOULDER_EDGE_ID) return false;
  return piece.stitchPath[shoulder.fromSegment]?.kind === "line";
}

/**
 * Whether the piece ends with one straight segment on the fold.
 *
 * @param piece - The bodice piece.
 * @returns True when it does.
 */
function endsOnFold(piece: PieceDraft): boolean {
  const last = piece.edges.at(-1);
  const single = last?.kind === "fold" && last.fromSegment === last.toSegment;
  return single && piece.stitchPath.at(-1)?.kind === "line";
}

/**
 * Index of the shoulder's first segment, after checking the neck, shoulder, ..., fold order this splice expects.
 *
 * @param piece - The bodice piece.
 * @returns The segment index.
 * @throws {DraftingError} NECKLINE_PIECE_SHAPE when the order differs.
 */
function shoulderStart(piece: PieceDraft): number {
  if (!startsWithNeckAndShoulder(piece) || !endsOnFold(piece)) {
    throw new DraftingError(
      "NECKLINE_PIECE_SHAPE",
      `Piece ${piece.id} has no neck, shoulder and fold to reshape`,
    );
  }
  return piece.edges[1]!.fromSegment;
}

/**
 * The piece with the new neck: neck edge replaced, shoulder and centre line moved to the new end points, edges
 * rebuilt (same ids, kinds and pairs), grain line kept below the new centre neck.
 *
 * @param piece - A bodice piece holding the neck.
 * @param neck - The new neck.
 * @param options - Engine options, for the seam allowances.
 * @returns The new piece.
 * @throws {DraftingError} NECKLINE_PIECE_SHAPE when the piece has no neck, shoulder and fold.
 */
export function spliceNeck(
  piece: PieceDraft,
  neck: NewNeck,
  options: Pick<EngineOptions, "seamAllowance">,
): PieceDraft {
  const shoulderFrom = shoulderStart(piece);
  const path = piece.stitchPath;
  const shoulder = path[shoulderFrom]!;
  const fold = path.at(-1)!;
  const stitchPath = [
    ...neck.segments,
    lineSeg(neck.neckPoint, shoulder.to),
    ...path.slice(shoulderFrom + 1, -1),
    lineSeg(fold.from, neck.centre),
  ];
  const specs: EdgeSpec[] = piece.edges.map((e) => ({
    id: e.id,
    kind: e.kind ?? "other",
    segments: e.id === NECK_EDGE_ID ? neck.segments.length : e.toSegment - e.fromSegment + 1,
    ...(e.pairsWith ? { pairsWith: e.pairsWith } : {}),
  }));
  const [top, bottom] = piece.grainLine;
  const topY = Math.max(top.y, neck.centre.y + GRAIN_END_INSET_MM);
  return {
    ...piece,
    stitchPath,
    edges: buildEdges(piece.id, specs, options),
    grainLine: [pt(top.x, Math.min(topY, bottom.y)), bottom],
  };
}
