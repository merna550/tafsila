/**
 * The button extension (issue #143, decision 143, 3): the centre-front line of a piece cut on the fold is moved out by
 * `BUTTON_EXTENSION_MM`, square at both ends, and the piece becomes a mirrored pair. The moved line keeps the edge id,
 * so every reference to it (and its notches, the line being as long as before) still resolves. Body lines that cross it leave the
 * overlap out (FR-VAL-03). Aldrich 6th ed., ch. 3, button extensions.
 */
import type { BodyLine, Edge, PieceEdgeKind, Point } from "@tafsila/schemas";
import { FOLD_EDGE_KIND } from "../../constants/finishing";
import { add, lineSeg, perpendicular, pointInPolygon, samplePath, scale } from "../../geometry";
import type { PieceDraft } from "../../pipeline/draft-context";
import { CENTRE_SEAM_KIND, mirroredCut } from "./seam";
import { downAlong, straightEdge } from "./targets";

/** Segments the extension puts in place of the centre line: out, along, back in. */
const EXTENSION_SEGMENTS = 3;

/** How far past the centre line the inside test probes, in mm. */
const PROBE_MM = 1;

/**
 * Unit vector from a straight edge away from the piece.
 *
 * @param piece - The piece.
 * @param edgeId - The straight edge.
 * @returns The outward normal.
 */
export function outwardNormal(piece: PieceDraft, edgeId: string): Point {
  const edge = straightEdge(piece, edgeId);
  const normal = perpendicular(downAlong(edge));
  const middle = scale(add(edge.top, edge.bottom), 1 / 2);
  const inside = pointInPolygon(add(middle, scale(normal, PROBE_MM)), samplePath(piece.stitchPath));
  return inside ? scale(normal, -1) : normal;
}

/**
 * Moves a segment index past the inserted extension segments.
 *
 * @param index - Old index.
 * @param at - Index of the replaced centre segment.
 * @returns New index.
 */
function shifted(index: number, at: number): number {
  return index > at ? index + EXTENSION_SEGMENTS - 1 : index;
}

/** Suffixes of the two square ends of the extension, named for where they sit. */
export const EXTENSION_END_SUFFIX = { top: "-top", bottom: "-bottom" } as const;

/**
 * Kind of the edge covering a segment, for an extension end that continues it (a fold continues as a seam).
 *
 * @param edges - Old edges.
 * @param index - Segment index, wrapping.
 * @param count - Number of segments.
 * @returns The kind.
 */
function neighbourKind(edges: readonly Edge[], index: number, count: number): PieceEdgeKind {
  const i = (index + count) % count;
  const kind = edges.find((e) => i >= e.fromSegment && i <= e.toSegment)?.kind ?? CENTRE_SEAM_KIND;
  return kind === FOLD_EDGE_KIND ? CENTRE_SEAM_KIND : kind;
}

/**
 * The edges after the insertion: the centre edge keeps its id on the moved line (a seam), each square end is its own
 * edge with the kind of the edge it continues (the neck at the top, the hem or waist at the bottom), so the cut line
 * runs on at the same allowance; the others move along.
 *
 * @param piece - The piece before the insertion.
 * @param edgeId - The centre edge.
 * @param fromIsTop - Whether the centre edge starts at its top end.
 * @returns New edges.
 */
function shiftedEdges(piece: PieceDraft, edgeId: string, fromIsTop: boolean): Edge[] {
  const { edges } = piece;
  const count = piece.stitchPath.length;
  const at = edges.find((e) => e.id === edgeId)!.fromSegment;
  /**
   * One square end of the extension.
   *
   * @param index - Its segment index in the new path.
   * @param top - Whether it is the top end.
   * @param kindAt - Old index of the segment whose edge it continues.
   * @returns The end edge.
   */
  const end = (index: number, top: boolean, kindAt: number): Edge => ({
    id: `${edgeId}${top ? EXTENSION_END_SUFFIX.top : EXTENSION_END_SUFFIX.bottom}`,
    kind: neighbourKind(edges, kindAt, count),
    fromSegment: index,
    toSegment: index,
    seamAllowanceMm: 0,
  });
  return edges.flatMap((e) => {
    if (e.id !== edgeId) {
      return [{ ...e, fromSegment: shifted(e.fromSegment, at), toSegment: shifted(e.toSegment, at) }];
    }
    const line: Edge = {
      id: e.id,
      kind: CENTRE_SEAM_KIND,
      fromSegment: at + 1,
      toSegment: at + 1,
      seamAllowanceMm: 0,
    };
    return [end(at, fromIsTop, at - 1), line, end(at + 2, !fromIsTop, at + 1)];
  });
}

/**
 * A body line with the overlap left out.
 *
 * @param line - The declared line.
 * @param extensionMm - Width of the extension.
 * @returns The line; one measured along an edge does not cross the extension and is kept.
 */
function withOverlap(line: BodyLine, extensionMm: number): BodyLine {
  return line.kind === "edge" ? line : { ...line, overlapMm: (line.overlapMm ?? 0) + extensionMm };
}

/**
 * Adds the button extension along a piece's centre-front edge.
 *
 * @param piece - A piece whose centre edge is one straight segment.
 * @param edgeId - The centre edge.
 * @param extensionMm - Width of the extension.
 * @returns The new piece, cut as a mirrored pair.
 * @throws {DraftingError} CLOSURE_CENTRE_NOT_STRAIGHT when the edge is not one straight segment.
 */
export function withExtension(piece: PieceDraft, edgeId: string, extensionMm: number): PieceDraft {
  const edge = piece.edges.find((e) => e.id === edgeId)!;
  const at = edge.fromSegment;
  const centre = piece.stitchPath[at]!;
  const out = scale(outwardNormal(piece, edgeId), extensionMm);
  const from = add(centre.from, out);
  const to = add(centre.to, out);
  const stitchPath = [
    ...piece.stitchPath.slice(0, at),
    lineSeg(centre.from, from),
    lineSeg(from, to),
    lineSeg(to, centre.to),
    ...piece.stitchPath.slice(at + 1),
  ];
  return {
    ...piece,
    cut: mirroredCut(piece.cut),
    stitchPath,
    edges: shiftedEdges(piece, edgeId, straightEdge(piece, edgeId).startsAtTop),
    bodyLines: piece.bodyLines.map((line) => withOverlap(line, extensionMm)),
  };
}
