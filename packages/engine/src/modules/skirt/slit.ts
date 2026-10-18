/**
 * Skirt slit (issue #135). Method: `docs/engine/drafting-method.md`, "Straight and A-line skirts, slits" (Aldrich,
 * Metric Pattern Cutting for Women's Wear, Chapter 2, "Skirt vents and slits"); decision 135-straight-a-line-skirt.
 *
 * The seam stays sewn from the waist to the slit top; below it the seam line becomes the fold line of a self facing
 * (the extension, `SLIT_EXTENSION_MM` wide), whose top is cut at 45° back to the seam. A notch marks the slit top.
 */
import type { Edge, Piece, Point, Segment } from "@tafsila/schemas";
import { type SkirtHalf, SKIRT_PIECE_ID } from "../../blocks/skirt/edges";
import { SLIT_EXTENSION_MM, SLIT_HIP_CLEARANCE_MM, SLIT_TOP_NOTCH_ID } from "../../constants/skirt-style";
import { add, distance, lineSeg, normalize, perpendicular, scale, sub } from "../../geometry";
import { edgeLengthMm } from "../../pieces/measure";
import type { PieceDraft } from "../../pipeline/draft-context";

/** Where the slit is on the piece: in the side seam, or in the centre seam (front or back slit). */
export type SlitSeam = "side" | "centre";

/** Id of the edge that holds the slit extension (the self facing). */
export const SLIT_EDGE_ID = "slit";

/** Segments that replace the slit seam's straight segment: one seam part, two extension parts, one hem part. */
const ADDED_SEGMENTS = 3;

/**
 * The outward normal of a segment travelled in path order. Skirt outlines run waist, side, hem, centre (clockwise on
 * the y-down sheet), so the outside is to the left of travel: the reverse of `perpendicular`.
 *
 * @param direction - Unit direction of travel.
 * @returns Unit normal pointing out of the piece.
 */
function outward(direction: Point): Point {
  return scale(perpendicular(direction), -1);
}

/**
 * The centre-line edge id of a half.
 *
 * @param half - Front or back.
 * @returns `cf` or `cb`.
 */
function centreId(half: SkirtHalf): string {
  return half === "front" ? "cf" : "cb";
}

/**
 * The straight segment the slit is cut into, and how much of it lies below the hip line.
 *
 * @param piece - Skirt piece.
 * @param seam - Side or centre.
 * @param half - Front or back.
 * @param hipDepthMm - Waist to hip line.
 * @returns Segment index and the length available below the hip line, in mm (0 when the seam has no straight part).
 */
export function slitSeat(
  piece: PieceDraft,
  seam: SlitSeam,
  half: SkirtHalf,
  hipDepthMm: number,
): { index: number; belowHipMm: number } {
  const edge = piece.edges.find((e) => e.id === (seam === "side" ? "side" : centreId(half)))!;
  const index = seam === "side" ? edge.toSegment : edge.fromSegment;
  const segment = piece.stitchPath[index]!;
  if (segment.kind !== "line") return { index, belowHipMm: 0 };
  const lengthMm = distance(segment.from, segment.to);
  return { index, belowHipMm: seam === "side" ? lengthMm : lengthMm - hipDepthMm };
}

/**
 * Longest slit a seam can take, in mm: its straight part below the hip line less `SLIT_HIP_CLEARANCE_MM`.
 *
 * @param piece - Skirt piece.
 * @param seam - Side or centre.
 * @param half - Front or back.
 * @param hipDepthMm - Waist to hip line.
 * @returns The longest slit in mm.
 */
export function maxSlitLengthMm(
  piece: PieceDraft,
  seam: SlitSeam,
  half: SkirtHalf,
  hipDepthMm: number,
): number {
  return slitSeat(piece, seam, half, hipDepthMm).belowHipMm - SLIT_HIP_CLEARANCE_MM;
}

/**
 * The four segments of a side slit: seam to the slit top, 45° extension top, extension edge, extension hem.
 *
 * @param segment - The side line, hip to hem.
 * @param slitMm - Slit length from the hem.
 * @returns The segments.
 */
function sideSlitSegments(segment: Segment, slitMm: number): Segment[] {
  const along = normalize(sub(segment.to, segment.from));
  const out = scale(outward(along), SLIT_EXTENSION_MM);
  const top = sub(segment.to, scale(along, slitMm));
  const extensionTop = add(add(top, out), scale(along, SLIT_EXTENSION_MM));
  const extensionHem = add(segment.to, out);
  return [
    lineSeg(segment.from, top),
    lineSeg(top, extensionTop),
    lineSeg(extensionTop, extensionHem),
    lineSeg(extensionHem, segment.to),
  ];
}

/**
 * The four segments of a centre slit: extension hem, extension edge, 45° extension top, seam from the slit top.
 *
 * @param segment - The centre line, hem to waist.
 * @param slitMm - Slit length from the hem.
 * @returns The segments.
 */
function centreSlitSegments(segment: Segment, slitMm: number): Segment[] {
  const along = normalize(sub(segment.to, segment.from));
  const out = scale(outward(along), SLIT_EXTENSION_MM);
  const top = add(segment.from, scale(along, slitMm));
  const extensionHem = add(segment.from, out);
  const extensionTop = sub(add(top, out), scale(along, SLIT_EXTENSION_MM));
  return [
    lineSeg(segment.from, extensionHem),
    lineSeg(extensionHem, extensionTop),
    lineSeg(extensionTop, top),
    lineSeg(top, segment.to),
  ];
}

/**
 * Shifts the edges after the slit and gives the slit seam, the extension and the hem their new ranges.
 *
 * @param edges - The piece's edges.
 * @param seam - Side or centre.
 * @param seamId - Id of the slit seam edge.
 * @param index - Index of the replaced segment.
 * @returns The new edges, the extension edge in path order.
 */
function slitEdges(edges: readonly Edge[], seam: SlitSeam, seamId: string, index: number): Edge[] {
  const extension: Edge = {
    id: SLIT_EDGE_ID,
    fromSegment: index + 1,
    toSegment: index + 2,
    kind: "other",
    seamAllowanceMm: 0,
  };
  return edges.flatMap((edge): Edge[] => {
    if (edge.id === seamId && seam === "side") return [{ ...edge, toSegment: index }, extension];
    if (edge.id === seamId)
      return [
        extension,
        { ...edge, fromSegment: index + ADDED_SEGMENTS, toSegment: edge.toSegment + ADDED_SEGMENTS },
      ];
    if (edge.id === "hem" && seam === "side")
      return [{ ...edge, fromSegment: index + ADDED_SEGMENTS, toSegment: edge.toSegment + ADDED_SEGMENTS }];
    if (edge.id === "hem") return [{ ...edge, toSegment: index }];
    if (edge.fromSegment > index)
      return [
        {
          ...edge,
          fromSegment: edge.fromSegment + ADDED_SEGMENTS,
          toSegment: edge.toSegment + ADDED_SEGMENTS,
        },
      ];
    return [edge];
  });
}

/**
 * A centre slit needs a centre seam: the fold becomes a seam sewn to the mirrored copy, cut as a pair.
 *
 * @param edge - The centre edge.
 * @param half - Front or back.
 * @returns The centre edge as a seam.
 */
function asCentreSeam(edge: Edge, half: SkirtHalf): Edge {
  if (edge.kind !== "fold") return edge;
  return {
    ...edge,
    kind: "other",
    pairsWith: { pieceId: SKIRT_PIECE_ID[half], edgeId: edge.id, intendedEaseMm: 0 },
  };
}

/** Cut instructions of a piece with a centre seam: a mirrored pair. */
const MIRRORED_PAIR: Piece["cut"] = { quantity: 2, onFold: false, mirror: true, fabric: "main" };

/**
 * Cuts a slit into one skirt piece. The caller checks the length first ({@link maxSlitLengthMm}).
 *
 * @param piece - Skirt piece (straight block or A-line), seam ending at the hem in a straight segment.
 * @param seam - Side or centre.
 * @param half - Front or back.
 * @param slitMm - Slit length from the hem along the seam, in mm.
 * @returns The piece with the extension, the slit-top notch and, for a centre slit, a centre seam.
 */
export function withSlit(piece: PieceDraft, seam: SlitSeam, half: SkirtHalf, slitMm: number): PieceDraft {
  const seamId = seam === "side" ? "side" : centreId(half);
  const edge = piece.edges.find((e) => e.id === seamId)!;
  const index = seam === "side" ? edge.toSegment : edge.fromSegment;
  const segment = piece.stitchPath[index]!;
  const added = seam === "side" ? sideSlitSegments(segment, slitMm) : centreSlitSegments(segment, slitMm);
  const stitchPath = [...piece.stitchPath.slice(0, index), ...added, ...piece.stitchPath.slice(index + 1)];
  const edges = slitEdges(piece.edges, seam, seamId, index).map((e) =>
    e.id === seamId && seam === "centre" ? asCentreSeam(e, half) : e,
  );
  const cut = seam === "centre" ? MIRRORED_PAIR : piece.cut;
  const slit = { ...piece, cut, stitchPath, edges };
  const notch = {
    id: SLIT_TOP_NOTCH_ID,
    edgeId: seamId,
    atMm: seam === "side" ? edgeLengthMm(slit, seamId) : 0,
  };
  return { ...slit, notches: [...piece.notches, notch] };
}
