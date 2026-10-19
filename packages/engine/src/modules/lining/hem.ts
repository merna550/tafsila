/**
 * The lining hem (issue #145, decision 145, 6): the hem line is raised by `LINING_HEM_RISE_MM` so the lining never
 * shows below the shell. The two edges next to the hem are shortened by the rise (along their own direction) and the
 * hem segments move up with them; a circle skirt's arcs move as a whole.
 */
import type { Segment } from "@tafsila/schemas";
import { LINING_HEM_RISE_MM } from "../../constants/lining";
import { DraftingError } from "../../errors/drafting-error";
import { cutPath, lineSeg, mapSegment, pathLength, pt, tangentOnSegment } from "../../geometry";
import type { PieceDraft } from "../../pipeline/draft-context";

/** Edge id of the hem on the shell pieces. */
export const HEM_EDGE_ID = "hem";

/** A neighbour must run at least this steeply (share of its length that is vertical) to be shortened by the rise. */
const MIN_VERTICAL_SHARE = 0.2;

/**
 * Shortens one segment at one end so its far end rises by the hem rise.
 *
 * @param seg - The neighbour of the hem.
 * @param atHemEnd - True when the hem is at the segment's end, false when at its start.
 * @param pieceId - For the error text.
 * @returns The shortened segment.
 * @throws {DraftingError} LINING_TARGET_MISSING when the neighbour is too short or too flat to be shortened.
 */
function shortened(seg: Segment, atHemEnd: boolean, pieceId: string): Segment {
  const tangent = tangentOnSegment(seg, atHemEnd ? 1 : 0);
  const vertical = Math.abs(tangent.y);
  const lengthMm = pathLength([seg]);
  const cutMm = LINING_HEM_RISE_MM / Math.max(vertical, MIN_VERTICAL_SHARE);
  if (vertical < MIN_VERTICAL_SHARE || cutMm >= lengthMm) {
    throw new DraftingError(
      "LINING_TARGET_MISSING",
      `${pieceId}: the edge next to the hem cannot be shortened`,
    );
  }
  const [before, after] = cutPath([seg], atHemEnd ? lengthMm - cutMm : cutMm);
  return (atHemEnd ? before : after)[atHemEnd ? before.length - 1 : 0]!;
}

/**
 * Moves a hem segment up, keeping its ends where the neighbours now stop.
 *
 * @param seg - A hem segment.
 * @returns The segment moved up by the rise.
 */
function raised(seg: Segment): Segment {
  return mapSegment(seg, (p) => pt(p.x, p.y - LINING_HEM_RISE_MM));
}

/**
 * Raises the hem of a lining piece.
 *
 * @param piece - A lining piece with a `hem` edge, or none.
 * @returns The piece with its hem raised, or the piece itself when it has no hem.
 * @throws {DraftingError} LINING_TARGET_MISSING when a neighbour of the hem cannot be shortened.
 */
export function raiseHem(piece: PieceDraft): PieceDraft {
  const hem = piece.edges.find((e) => e.id === HEM_EDGE_ID);
  if (!hem) return piece;
  const path = [...piece.stitchPath];
  const count = path.length;
  const [first, last] = [hem.fromSegment, hem.toSegment];
  const before = (first + count - 1) % count;
  const after = (last + 1) % count;
  path[before] = shortened(path[before]!, true, piece.id);
  path[after] = shortened(path[after]!, false, piece.id);
  for (let i = first; ; i = (i + 1) % count) {
    path[i] = raised(path[i]!);
    if (i === last) break;
  }
  const start = path[before].to;
  const end = path[after].from;
  path[first] = withEnds(path[first]!, start, "from");
  path[last] = withEnds(path[last]!, end, "to");
  return { ...piece, stitchPath: path };
}

/**
 * Replaces one end of a segment (a line is redrawn; a cubic keeps its control points).
 *
 * @param seg - The segment.
 * @param point - The new end point.
 * @param end - Which end.
 * @returns The segment.
 */
function withEnds(seg: Segment, point: { x: number; y: number }, end: "from" | "to"): Segment {
  if (seg.kind === "line")
    return end === "from" ? lineSeg(pt(point.x, point.y), seg.to) : lineSeg(seg.from, pt(point.x, point.y));
  return { ...seg, [end]: pt(point.x, point.y) };
}
