/**
 * One-piece dress (`waistSeam: false`, issue #144, decision 144, 4): the bodice pieces keep their rows above the
 * waist, take the skirt rows below the hip, and the zone between is redrawn: side
 * seam, fisheye dart or princess seam. Piece ids do not change; the skirt pieces are removed.
 * Aldrich, Metric Pattern Cutting for Women's Wear, ch. 3 "One-piece dress block".
 */
import type { BodyLine, Edge, Point } from "@tafsila/schemas";
import { ASSEMBLY_ORDER } from "../../constants/assembly";
import { GEOMETRY_EPSILON_MM } from "../../constants/geometry";
import { DraftingError } from "../../errors/drafting-error";
import { distance, intersectSegments, lerp, lineSeg, pt, splitSegmentAt } from "../../geometry";
import { ASSEMBLED_PIECE_NAMES } from "../../i18n/pieces";
import { isOnePieceDress } from "../../pipeline/category-rules";
import { type DraftContext, type PieceDraft, withPieces } from "../../pipeline/draft-context";
import type { FeatureModule } from "../../pipeline/feature-module";
import { bodyLinesBelowWaist, fisheyeDarts, waistBodyLine } from "./fisheye";
import { CENTRE_EDGE, edgeOf, type HalfFrame, halfFrames, WAIST_EDGE } from "./half-frame";
import { type LabeledSegment, SIDE_EDGE_ID, waistToHipSide } from "./lower-half";
import { labelled, rebuildOutline } from "./rebuild";
import { GARMENT_HALVES } from "./waist-seam";

/** Id of the garment hip body line on the assembled pieces. */
const HIP_LINE_ID = "garment-hip";

/** Reach of the vertical probe that splits the lower half at the princess seam, in mm. */
const PROBE_REACH_MM = 10_000;

/** The lower half split at a princess seam. */
interface SplitLower {
  /** Seam point on the hip line. */
  readonly hipPoint: Point;
  /** Seam point on the hem. */
  readonly hemPoint: Point;
  /** Side part: hip side down and along the hem to the seam. */
  readonly side: LabeledSegment[];
  /** Centre part: from the seam along the hem to the centre line. */
  readonly centre: LabeledSegment[];
}

/**
 * Splits the lower half where the vertical through x crosses it (the princess seam runs straight down to the hem).
 *
 * @param path - The lower path.
 * @param x - x of the seam.
 * @returns Side part, centre part and the hem point.
 * @throws {DraftingError} ASSEMBLY_SEAM_OFF_HEM when the vertical misses the hem.
 */
function splitAtX(path: readonly LabeledSegment[], x: number): Omit<SplitLower, "hipPoint"> {
  const probe = lineSeg(pt(x, -PROBE_REACH_MM), pt(x, PROBE_REACH_MM));
  for (let i = 0; i < path.length; i += 1) {
    const { seg, edgeId } = path[i]!;
    if (Math.abs(seg.to.x - x) <= GEOMETRY_EPSILON_MM && i < path.length - 1) {
      return { hemPoint: seg.to, side: path.slice(0, i + 1), centre: path.slice(i + 1) };
    }
    const hit = intersectSegments(seg, probe).find((h) => h.t1 > 0 && h.t1 < 1);
    if (hit) {
      const [a, b] = splitSegmentAt(seg, hit.t1);
      return {
        hemPoint: a.to,
        side: [...path.slice(0, i), { seg: a, edgeId }],
        centre: [{ seg: b, edgeId }, ...path.slice(i + 1)],
      };
    }
  }
  throw new DraftingError("ASSEMBLY_SEAM_OFF_HEM", `The princess seam at x=${x} misses the hem`);
}

/**
 * The style seam edge id of a princess centre panel: its edge sewn to the side panel.
 *
 * @param frame - The half's frame.
 * @returns Edge id.
 */
function styleEdgeId(frame: HalfFrame): string {
  const edge = frame.pieces.centre.edges.find((e) => e.pairsWith?.pieceId === frame.pieces.side.id);
  if (!edge) throw new DraftingError("ASSEMBLY_EDGE_MISSING", `${frame.pieces.centre.id} has no style seam`);
  return edge.id;
}

/** Suffix of the princess seam below the waist: its own edge, so the seam may turn at the waist (decision 144, 4). */
const LOWER_SUFFIX = "-lower";

/**
 * Id of the princess seam below the waist.
 *
 * @param styleId - Id of the princess seam above the waist.
 * @returns The lower seam's id.
 */
function lowerStyleId(styleId: string): string {
  return `${styleId}${LOWER_SUFFIX}`;
}

/**
 * A straight stretch, or nothing when its ends meet (the seam point on the hem may lie on the hip line).
 *
 * @param from - Start.
 * @param to - End.
 * @param edgeId - Edge id.
 * @returns Zero or one stretch.
 */
function stretch(from: Point, to: Point, edgeId: string): LabeledSegment[] {
  return distance(from, to) > GEOMETRY_EPSILON_MM ? [{ seg: lineSeg(from, to), edgeId }] : [];
}

/**
 * The centre line from the hem up to the top of the piece's centre edge, in one straight stretch.
 *
 * @param frame - The half's frame.
 * @param from - Bottom point (hem on the centre line).
 * @returns One stretch.
 */
function centreLine(frame: HalfFrame, from: Point): LabeledSegment {
  const piece = frame.pieces.centre;
  const top = piece.stitchPath[edgeOf(piece, CENTRE_EDGE[frame.half]).toSegment]!.to;
  return { seg: lineSeg(from, top), edgeId: CENTRE_EDGE[frame.half] };
}

/**
 * The part of a bodice piece's outline before its waist edge (everything above the waist, in path order).
 *
 * @param piece - The piece.
 * @returns The labelled stretches.
 */
function aboveWaist(piece: PieceDraft): LabeledSegment[] {
  return labelled(piece, 0, edgeOf(piece, WAIST_EDGE).fromSegment - 1);
}

/**
 * The new outline of each bodice piece of a half.
 *
 * @param frame - The half's frame.
 * @returns Outline per piece id.
 */
function outlines(frame: HalfFrame): Map<string, LabeledSegment[]> {
  const { pieces, lower, sideWaist, sideLeave } = frame;
  const sideSeam: LabeledSegment = { seg: waistToHipSide(sideWaist, lower, sideLeave), edgeId: SIDE_EDGE_ID };
  if (pieces.centre === pieces.side) {
    const end = lower.path.at(-1)!.seg.to;
    return new Map([
      [pieces.centre.id, [...aboveWaist(pieces.centre), sideSeam, ...lower.path, centreLine(frame, end)]],
    ]);
  }
  const split = splitLower(frame);
  const style = lowerStyleId(styleEdgeId(frame));
  const centreWaist = edgeOf(pieces.centre, WAIST_EDGE);
  const sideWaistEdge = edgeOf(pieces.side, WAIST_EDGE);
  const centreLeg = pieces.centre.stitchPath[centreWaist.fromSegment]!.from;
  const sideLeg = pieces.side.stitchPath[sideWaistEdge.toSegment]!.to;
  const centreEnd = split.centre.at(-1)?.seg.to ?? split.hemPoint;
  const sideRest = labelled(pieces.side, sideWaistEdge.toSegment + 1, pieces.side.stitchPath.length - 1);
  return new Map([
    [
      pieces.centre.id,
      [
        ...aboveWaist(pieces.centre),
        ...stretch(centreLeg, split.hipPoint, style),
        ...stretch(split.hipPoint, split.hemPoint, style),
        ...split.centre,
        centreLine(frame, centreEnd),
      ],
    ],
    [
      pieces.side.id,
      [
        ...aboveWaist(pieces.side),
        sideSeam,
        ...split.side,
        ...stretch(split.hemPoint, split.hipPoint, style),
        ...stretch(split.hipPoint, sideLeg, style),
        ...sideRest,
      ],
    ],
  ]);
}

/**
 * The lower half split at the princess seam: the seam meets the hip line under the middle of the two waist legs
 * (the dart axis) and runs straight down to the hem.
 *
 * @param frame - The half's frame.
 * @returns The split.
 */
function splitLower(frame: HalfFrame): SplitLower {
  const { pieces, lower } = frame;
  const centreLeg = pieces.centre.stitchPath[edgeOf(pieces.centre, WAIST_EDGE).fromSegment]!.from;
  const sideLeg = pieces.side.stitchPath[edgeOf(pieces.side, WAIST_EDGE).toSegment]!.to;
  const x = lerp(centreLeg, sideLeg, 1 / 2).x;
  return { hipPoint: pt(x, lower.hipY), ...splitAtX(lower.path, x) };
}

/**
 * The skirt edges, with pairings to a skirt piece moved to the bodice piece of the same role, and for princess
 * panels the template of the seam below the waist (paired like the seam above it).
 *
 * @param frame - The half's frame.
 * @param piece - The piece being rebuilt.
 * @returns The edges.
 */
function lowerEdges(frame: HalfFrame, piece: PieceDraft): Edge[] {
  const role = piece.id.replace(/^bodice-(front|back)/, "");
  const skirt = frame.lower.sourceEdges.map((edge) => {
    if (!edge.pairsWith) return edge;
    const other = edge.pairsWith.pieceId.replace(/^skirt-/, "bodice-") + role;
    return { ...edge, pairsWith: { ...edge.pairsWith, pieceId: other } };
  });
  if (frame.pieces.centre === frame.pieces.side) return skirt;
  const style = piece.edges.find((e) => e.id === styleEdgeId(frame))!;
  const id = lowerStyleId(style.id);
  return [...skirt, { ...style, id, pairsWith: { ...style.pairsWith!, edgeId: id } }];
}

/**
 * The hip body line: the skirt's (moved), else horizontal at the hip line.
 *
 * @param frame - The half's frame.
 * @returns The body line.
 */
function hipLine(frame: HalfFrame): BodyLine {
  const skirtLine = frame.lower.hipLine;
  return skirtLine
    ? { ...skirtLine, id: HIP_LINE_ID }
    : { id: HIP_LINE_ID, measurement: "hip", kind: "horizontal", atMm: frame.lower.hipY };
}

/**
 * One bodice piece rebuilt to run below the waist.
 *
 * @param ctx - Current context.
 * @param frame - The half's frame.
 * @param piece - The piece.
 * @param outline - Its new outline.
 * @returns The new piece.
 */
function rebuiltPiece(
  ctx: DraftContext,
  frame: HalfFrame,
  piece: PieceDraft,
  outline: LabeledSegment[],
): PieceDraft {
  const waist = edgeOf(piece, WAIST_EDGE);
  const ends: [Point, Point] = [
    piece.stitchPath[waist.fromSegment]!.from,
    piece.stitchPath[waist.toSegment]!.to,
  ];
  const bottomY = Math.max(...outline.map((s) => s.seg.to.y));
  const [grainTop, grainEnd] = piece.grainLine;
  return {
    ...piece,
    name: ASSEMBLED_PIECE_NAMES.dress[piece.id] ?? piece.name,
    ...rebuildOutline({ piece, segments: outline, lowerEdges: lowerEdges(frame, piece) }),
    bodyLines: bodyLinesBelowWaist(piece, waistBodyLine(piece, ends), hipLine(frame)),
    grainLine: [grainTop, pt(grainEnd.x, grainEnd.y + bottomY - frame.waistCentre.y)],
    darts: fisheyeDarts(piece, frame.half, frame.lower.hipY),
    marks: [...(piece.marks ?? []), ...(piece.id === frame.pieces.centre.id ? frame.lower.marks : [])],
  };
}

/**
 * Assembles both halves: rebuilds the bodice pieces below the waist and removes the skirt pieces.
 *
 * @param ctx - Context after the bodice, skirt, sleeve and waistband modules.
 * @returns The new context.
 */
function assemble(ctx: DraftContext): DraftContext {
  const frames = halfFrames(ctx);
  const rebuilt = new Map<string, PieceDraft>();
  for (const half of GARMENT_HALVES) {
    const frame = frames[half];
    for (const [id, outline] of outlines(frame)) {
      const piece = ctx.pieces.find((p) => p.id === id)!;
      rebuilt.set(id, rebuiltPiece(ctx, frame, piece, outline));
    }
  }
  const pieces = ctx.pieces
    .filter((p) => p.id !== "skirt-front" && p.id !== "skirt-back")
    .map((p) => rebuilt.get(p.id) ?? p);
  return withPieces(ctx, pieces);
}

/** One-piece dress: the bodice pieces run to the hem (decision 144, 4). */
export const onePieceModule: FeatureModule = {
  id: "assembly-one-piece",
  order: ASSEMBLY_ORDER,
  appliesTo: isOnePieceDress,
  draft: assemble,
};
