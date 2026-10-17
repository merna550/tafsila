/**
 * The mirrored hem corner of a cutting line (issue #130, decision 130). Where a hem meets a seam, the seam's cut line
 * is continued past the hem stitch line as its mirror image across that line, until it meets the hem's cut line.
 * Folded up along the hem stitch line, the hem allowance then lies exactly on the seam allowance, so the side seam
 * can be sewn through the turned-up hem (the standard folded-hem corner of flat pattern cutting).
 */
import { lineLine, type LineLike } from "./intersect";
import { tangentOnSegment } from "./path";
import { type Point, add, samePoint } from "./point";
import { type Segment, lineSeg } from "./segment";
import { mirrorAcross } from "./transform";

/** Which side of the corner the hem lies on, in the direction of travel. */
export type HemSide = "after" | "before";

/** Two offset pieces after their shared corner has been closed. */
export interface JoinedPieces {
  /** The piece before the corner, possibly trimmed or extended. */
  readonly end: Segment[];
  /** Segments added to close the corner. */
  readonly bridge: Segment[];
  /** The piece after the corner, possibly trimmed or extended. */
  readonly start: Segment[];
}

/** The two stitch segments that meet at the corner. */
export interface CornerStitch {
  /** The stitch segment that ends at the corner. */
  readonly before: Segment;
  /** The stitch segment that starts at the corner. */
  readonly after: Segment;
}

/**
 * The tangent line of a segment at one of its ends.
 *
 * @param seg - The segment.
 * @param atEnd - True for the end point, false for the start point.
 * @returns A line through that end along the tangent.
 */
function tangentLine(seg: Segment, atEnd: boolean): LineLike {
  const from = atEnd ? seg.to : seg.from;
  return { from, to: add(from, tangentOnSegment(seg, atEnd ? 1 : 0)) };
}

/**
 * Moves the end of a piece to a point on its end tangent: a line is re-aimed, a curve gets a short straight run.
 *
 * @param piece - Offset segments in order.
 * @param point - The new end point.
 * @returns The changed piece.
 */
function withEnd(piece: readonly Segment[], point: Point): Segment[] {
  const last = piece.at(-1)!;
  if (samePoint(last.to, point)) return [...piece];
  if (last.kind === "line" && !samePoint(last.from, point))
    return [...piece.slice(0, -1), lineSeg(last.from, point)];
  return [...piece, lineSeg(last.to, point)];
}

/**
 * Moves the start of a piece to a point on its start tangent: a line is re-aimed, a curve gets a short straight run.
 *
 * @param piece - Offset segments in order.
 * @param point - The new start point.
 * @returns The changed piece.
 */
function withStart(piece: readonly Segment[], point: Point): Segment[] {
  const first = piece[0]!;
  if (samePoint(first.from, point)) return [...piece];
  if (first.kind === "line" && !samePoint(first.to, point))
    return [lineSeg(point, first.to), ...piece.slice(1)];
  return [lineSeg(point, first.from), ...piece];
}

/**
 * Where the seam cut line meets the hem stitch line (P) and where its mirror image meets the hem cut line (Q).
 *
 * @param seamCut - The seam's cut line near the corner.
 * @param hemStitch - The hem's stitch line (the fold-up line) at the corner.
 * @param hemCut - The hem's cut line near the corner.
 * @returns P and Q, or null when two of the lines are parallel.
 */
function mirroredPoints(
  seamCut: LineLike,
  hemStitch: LineLike,
  hemCut: LineLike,
): { p: Point; q: Point } | null {
  const p = lineLine(seamCut, hemStitch, true)?.point;
  if (!p) return null;
  const mirrored = mirrorAcross(lineSeg(seamCut.from, seamCut.to), hemStitch.from, hemStitch.to);
  const q = lineLine(mirrored, hemCut, true)?.point;
  return q ? { p, q } : null;
}

/**
 * Closes a seam-to-hem corner of an offset path with the mirrored hem corner. On a straight side meeting a square hem
 * this is the mitre point; on a flared (A-line) side the hem allowance narrows so it folds up onto the seam allowance.
 * Curved edges use their tangent at the corner, which is exact for a hem folded on a straight line.
 *
 * @param end - Offset piece before the corner.
 * @param start - Offset piece after the corner.
 * @param stitch - The stitch segments that meet at the corner.
 * @param hem - Whether the hem is the segment after or before the corner.
 * @returns The joined pieces, or null when the lines are parallel (the caller then mitres).
 * @example
 * // side x = 200 → 215 cut, hem y = 300 → 330 cut: the corner is (215, 330), as a mitre
 * mirrorHemCorner(sideCut, hemCut, { before: side, after: hem }, "after")
 */
export function mirrorHemCorner(
  end: readonly Segment[],
  start: readonly Segment[],
  stitch: CornerStitch,
  hem: HemSide,
): JoinedPieces | null {
  const hemAfter = hem === "after";
  const hemStitch = hemAfter ? tangentLine(stitch.after, false) : tangentLine(stitch.before, true);
  const endCut = tangentLine(end.at(-1)!, true);
  const startCut = tangentLine(start[0]!, false);
  const found = mirroredPoints(hemAfter ? endCut : startCut, hemStitch, hemAfter ? startCut : endCut);
  if (!found) return null;
  const { p, q } = found;
  const [endPoint, startPoint] = hemAfter ? [p, q] : [q, p];
  const bridge = samePoint(endPoint, startPoint) ? [] : [lineSeg(endPoint, startPoint)];
  return { end: withEnd(end, endPoint), bridge, start: withStart(start, startPoint) };
}
