/**
 * The part of a one-piece dress or a blouse below the hip line (issue #144, decision 144, 4): the skirt rows of a
 * dress kept as drafted, or the blouse hip row built from the hip quarter, and the side seam that joins the bodice
 * waist to it. Aldrich, Metric Pattern Cutting for Women's Wear, ch. 3 "One-piece dress block" (the waist-to-hip
 * zone is redrawn between the bodice block and the skirt block).
 */
import type { BodyLine, Edge, Mark, Point, Segment } from "@tafsila/schemas";
import { BLOUSE_LENGTH_BELOW_HIP_MM } from "../../constants/assembly";
import { GEOMETRY_EPSILON_MM } from "../../constants/geometry";
import { DraftingError } from "../../errors/drafting-error";
import {
  add,
  curveThroughPoints,
  intersectSegments,
  lineSeg,
  pathLength,
  pt,
  segmentLength,
  splitSegmentAt,
  sub,
  tangentOnSegment,
  translate,
} from "../../geometry";
import type { PieceDraft } from "../../pipeline/draft-context";

/** A stretch of outline with the id of the edge it belongs to. */
export interface LabeledSegment {
  /** The stretch. */
  readonly seg: Segment;
  /** Edge id it belongs to (`side`, `hem`, `cf`, `style`, a slit edge…). */
  readonly edgeId: string;
}

/** The outline of one half below the hip line, in the bodice frame. */
export interface LowerHalf {
  /** y of the hip line. */
  readonly hipY: number;
  /** Side point on the hip line, where the waist-to-hip side seam ends. */
  readonly hipSide: Point;
  /** From the hip side point down the side, along the hem, to the centre line at the hem. */
  readonly path: readonly LabeledSegment[];
  /** Edges of the skirt the path came from, to copy kinds and pairings; empty for a blouse. */
  readonly sourceEdges: readonly Edge[];
  /** The skirt's hip body line moved into the bodice frame (a pivoted A-line bends it, decision 135); none for a blouse. */
  readonly hipLine?: BodyLine;
  /** Marks of the skirt (slit marks), moved into the bodice frame. */
  readonly marks: NonNullable<PieceDraft["marks"]>;
}

/** Edge id of a side seam. */
export const SIDE_EDGE_ID = "side";
/** Edge id of a hem. */
export const HEM_EDGE_ID = "hem";

/** Reach of the probe line used to cut a segment at a given y, in mm (wider than any piece). */
const PROBE_REACH_MM = 10_000;

/**
 * Where a segment crosses the horizontal line y, as its parameter t.
 *
 * @param seg - The segment.
 * @param y - Line height.
 * @returns t in (0, 1), or undefined when it does not cross inside the segment.
 */
function crossingT(seg: Segment, y: number): number | undefined {
  const probe = lineSeg(pt(-PROBE_REACH_MM, y), pt(PROBE_REACH_MM, y));
  const hit = intersectSegments(seg, probe)[0];
  return hit && hit.t1 > 0 && hit.t1 < 1 ? hit.t1 : undefined;
}

/**
 * The part of a run of segments below the line y (y grows downwards), assuming it goes down once.
 *
 * @param run - Segments in path order, top to bottom.
 * @param y - Line height.
 * @returns The segments below the line, the first one cut at the line.
 */
function belowLine(run: readonly Segment[], y: number): Segment[] {
  const out: Segment[] = [];
  for (const seg of run) {
    if (Math.max(seg.from.y, seg.to.y) <= y + GEOMETRY_EPSILON_MM) continue;
    if (Math.min(seg.from.y, seg.to.y) >= y - GEOMETRY_EPSILON_MM) {
      out.push(seg);
      continue;
    }
    const t = crossingT(seg, y);
    const below = t === undefined ? undefined : splitSegmentAt(seg, t)[1];
    if (below && segmentLength(below) > GEOMETRY_EPSILON_MM) out.push(below);
  }
  return out;
}

/**
 * The lower half of a dress: the skirt half moved so its waist centre sits on the bodice waist centre (and `dropMm`
 * lower), cut at the hip line. The side keeps the skirt's run below the hip, then hem and any slit edges; the centre
 * line is left out (the caller joins it to the bodice centre line in one straight edge).
 *
 * @param skirt - The drafted skirt half (`skirt-front` or `skirt-back`, waist centre at the origin).
 * @param waistCentre - The bodice waist point on the centre line.
 * @param hipDepthMm - Waist to hip line.
 * @param dropMm - Extra drop of the whole lower half, used to true the side seams.
 * @returns The lower half.
 * @throws {DraftingError} ASSEMBLY_SKIRT_LAYOUT when the skirt has no side or centre edge, or its hem does not end on the centre line.
 */
export function skirtLowerHalf(
  skirt: PieceDraft,
  waistCentre: Point,
  hipDepthMm: number,
  dropMm: number,
): LowerHalf {
  const offset = pt(waistCentre.x, waistCentre.y + dropMm);
  const path = translate(skirt.stitchPath, offset);
  const side = skirt.edges.find((e) => e.id === SIDE_EDGE_ID);
  const centre = skirt.edges.find((e) => e.kind === "fold" || e.id === "cf" || e.id === "cb");
  if (!side || !centre || centre.fromSegment <= side.toSegment) {
    throw new DraftingError("ASSEMBLY_SKIRT_LAYOUT", `${skirt.id} has no side then centre edge`);
  }
  const hipY = offset.y + hipDepthMm;
  const sideBelow = belowLine(path.slice(side.fromSegment, side.toSegment + 1), hipY);
  const between = path.slice(side.toSegment + 1, centre.fromSegment).map((seg, i) => ({
    seg,
    edgeId: edgeIdAt(skirt.edges, side.toSegment + 1 + i),
  }));
  const bottom = path[centre.fromSegment]!.from;
  if (sideBelow.length === 0 || Math.abs(bottom.x - waistCentre.x) > GEOMETRY_EPSILON_MM) {
    throw new DraftingError("ASSEMBLY_SKIRT_LAYOUT", `${skirt.id} cannot be cut at the hip line`);
  }
  return {
    hipY,
    hipSide: sideBelow[0]!.from,
    path: [...sideBelow.map((seg) => ({ seg, edgeId: SIDE_EDGE_ID })), ...between],
    sourceEdges: skirt.edges,
    ...hipLineOf(skirt, offset),
    marks: (skirt.marks ?? []).map((m) => moveMark(m, offset)),
  };
}

/**
 * The skirt's hip body line, moved by an offset.
 *
 * @param skirt - The skirt half.
 * @param offset - The move.
 * @returns `{ hipLine }`, or nothing when the skirt declares none.
 */
function hipLineOf(skirt: PieceDraft, offset: Point): { hipLine?: BodyLine } {
  const line = skirt.bodyLines.find((l) => l.measurement === "hip");
  if (!line || line.kind === "edge") return {};
  if (line.kind === "horizontal") return { hipLine: { ...line, atMm: line.atMm + offset.y } };
  return { hipLine: { ...line, points: line.points.map((p) => add(p, offset)) } };
}

/**
 * A construction mark moved by an offset.
 *
 * @param mark - The mark.
 * @param offset - The move.
 * @returns The moved mark.
 */
function moveMark(mark: Mark, offset: Point): Mark {
  if (mark.shape === "point") return { ...mark, at: add(mark.at, offset) };
  return { ...mark, from: add(mark.from, offset), to: add(mark.to, offset) };
}

/**
 * Id of the edge a stitch-path segment belongs to.
 *
 * @param edges - The piece's edges.
 * @param index - Segment index.
 * @returns The edge id, or `hem` when no edge covers it.
 */
function edgeIdAt(edges: readonly Edge[], index: number): string {
  return edges.find((e) => e.fromSegment <= index && index <= e.toSegment)?.id ?? HEM_EDGE_ID;
}

/**
 * The lower half of a blouse: a hip row from the centre line to the hip quarter (decision 144, 4), the hem
 * `BLOUSE_LENGTH_BELOW_HIP_MM` below it (0: the hem is the hip row).
 *
 * @param waistCentre - The bodice waist point on the centre line.
 * @param hipDepthMm - Waist to hip line.
 * @param hipQuarterMm - Finished hip quarter, (hip + total ease) / 4.
 * @param dropMm - Extra drop, used to true the side seams.
 * @returns The lower half.
 */
export function blouseLowerHalf(
  waistCentre: Point,
  hipDepthMm: number,
  hipQuarterMm: number,
  dropMm: number,
): LowerHalf {
  const hipY = waistCentre.y + hipDepthMm + dropMm;
  const hemY = hipY + BLOUSE_LENGTH_BELOW_HIP_MM;
  const hipSide = pt(hipQuarterMm, hipY);
  const hemSide = pt(hipQuarterMm, hemY);
  const sideRun: LabeledSegment[] =
    hemY > hipY ? [{ seg: lineSeg(hipSide, hemSide), edgeId: SIDE_EDGE_ID }] : [];
  return {
    hipY,
    hipSide,
    path: [...sideRun, { seg: lineSeg(hemSide, pt(waistCentre.x, hemY)), edgeId: HEM_EDGE_ID }],
    sourceEdges: [],
    marks: [],
  };
}

/**
 * The side seam from the bodice side waist down to the hip side point: one curve leaving the bodice side seam's
 * direction and arriving along the run below the hip, so the seam has no corner at the waist or the hip.
 *
 * @param sideWaist - Bodice side waist point.
 * @param lower - The lower half.
 * @returns One segment.
 */
export function waistToHipSide(sideWaist: Point, lower: LowerHalf): Segment {
  const next = lower.path[0]!;
  const arrive = next.edgeId === SIDE_EDGE_ID ? tangentOnSegment(next.seg, 0) : pt(0, 1);
  const [curve] = curveThroughPoints([sideWaist, lower.hipSide], sub(lower.hipSide, sideWaist), arrive);
  return curve!;
}

/**
 * Length of the side seam below the waist: the waist-to-hip curve and the side run below the hip.
 *
 * @param sideWaist - Bodice side waist point.
 * @param lower - The lower half.
 * @returns Length in mm.
 */
export function lowerSideMm(sideWaist: Point, lower: LowerHalf): number {
  const run = lower.path.filter((s) => s.edgeId === SIDE_EDGE_ID).map((s) => s.seg);
  return segmentLength(waistToHipSide(sideWaist, lower)) + pathLength(run);
}
