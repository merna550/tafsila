/**
 * A-line skirt from the straight block (issue #135). Method: `docs/engine/drafting-method.md`, "Straight and A-line
 * skirts, slits" (Aldrich, Metric Pattern Cutting for Women's Wear, Chapter 3, "A-line skirt"): the waist dart is
 * closed and its intake swung into the hem (slash and spread), decision 135-straight-a-line-skirt.
 *
 * The slash runs square down from a pivot on the hip line, on the dart's axis, to the hem. The side panel turns about
 * that pivot until the dart legs meet: the waist keeps its length (waist + ease), the hip line keeps its length (it
 * bends at the pivot) and only the hem opens, by the chord the turn sweeps at the hem.
 */
import type { BodyLine, Point, Segment } from "@tafsila/schemas";
import { type SkirtEdgeRuns, type SkirtHalf, SKIRT_SEGMENT, skirtEdges } from "../../blocks/skirt/edges";
import { DraftingError } from "../../errors/drafting-error";
import {
  add,
  cross,
  curveThroughPoints,
  distance,
  dot,
  lerp,
  lineSeg,
  normalize,
  pt,
  rotateAbout,
  scale,
  sub,
} from "../../geometry";
import type { PieceDraft } from "../../pipeline/draft-context";

/** Direction of the hem at the centre line: square to the fold, towards the centre. */
const HEM_AT_CENTRE: Point = pt(-1, 0);

/** Index of each segment in the A-line stitch path (see {@link aLinePath}). */
export const A_LINE_SEGMENT = {
  waistCentre: 0,
  waistSide: 1,
  sideCurve: 2,
  sideLine: 3,
  hemSide: 4,
  hemBridge: 5,
  hemCentre: 6,
  centre: 7,
} as const;

/** Edge runs of the A-line stitch path. */
const A_LINE_RUNS: SkirtEdgeRuns = {
  waist: [A_LINE_SEGMENT.waistCentre, A_LINE_SEGMENT.waistSide],
  side: [A_LINE_SEGMENT.sideCurve, A_LINE_SEGMENT.sideLine],
  hem: [A_LINE_SEGMENT.hemSide, A_LINE_SEGMENT.hemCentre],
  centre: [A_LINE_SEGMENT.centre, A_LINE_SEGMENT.centre],
};

/** The A-line version of one block piece. */
export interface ALineDraft {
  /** The piece with the dart closed into the hem. */
  readonly piece: PieceDraft;
  /** How much wider this piece's hem is than the block's, in mm (the chord the turn sweeps at the hem). */
  readonly hemGainMm: number;
}

/** Where the side panel turns and by how much. */
interface Pivot {
  /** The pivot on the hip line, on the dart axis. */
  readonly point: Point;
  /** Turn that brings the side dart leg onto the centre one, in radians. */
  readonly angleRad: number;
  /** The centre dart leg (the side leg lands on it). */
  readonly centreLeg: Point;
}

/**
 * Finds the pivot: the dart axis (leg midpoint to apex) extended to the hip line, and the turn that closes the dart.
 *
 * @param piece - Block piece with one waist dart.
 * @param hipDepthMm - Waist to hip line.
 * @returns The pivot, or undefined when the block has no dart (no waist shaping to transfer).
 */
function findPivot(piece: PieceDraft, hipDepthMm: number): Pivot | undefined {
  const dart = piece.darts[0];
  if (dart === undefined) return undefined;
  const [centreLeg, sideLeg] = dart.legs;
  const mouth = lerp(centreLeg, sideLeg, 1 / 2);
  const axis = normalize(sub(dart.apex, mouth));
  const point = add(mouth, scale(axis, (hipDepthMm - mouth.y) / axis.y));
  const fromSide = sub(sideLeg, point);
  const toCentre = sub(centreLeg, point);
  return { point, angleRad: Math.atan2(cross(fromSide, toCentre), dot(fromSide, toCentre)), centreLeg };
}

/**
 * Builds the A-line stitch path: waist (one smooth curve through the closed dart, keeping the block's angle at the
 * centre and at the side seam), turned side curve and side line,
 * hem (turned side part, a smooth bridge over the opened slash, centre part) and the centre line.
 *
 * @param path - The block's stitch path (`SKIRT_SEGMENT` order).
 * @param pivot - Pivot and turn.
 * @returns The new path and the slash's hem ends, before and after the turn.
 */
function aLinePath(path: readonly Segment[], pivot: Pivot): { path: Segment[]; hemSlash: [Point, Point] } {
  /**
   * Turns a point of the side panel about the pivot.
   *
   * @param p - Point.
   * @returns The turned point.
   */
  const turn = (p: Point): Point => rotateAbout(p, pivot.point, pivot.angleRad);
  const waist = path[SKIRT_SEGMENT.waist]!;
  const hem = path[SKIRT_SEGMENT.hem]!;
  const hemSlash = pt(pivot.point.x, hem.from.y);
  const turnedWaistSide = turn(waist.to);
  const turnedHemSide = turn(hem.from);
  const turnedSlash = turn(hemSlash);
  const sideHemDirection = sub(turnedSlash, turnedHemSide);
  const [bridge] = curveThroughPoints([turnedSlash, hemSlash], sideHemDirection, HEM_AT_CENTRE);
  return {
    path: [
      ...curveThroughPoints(
        [waist.from, pivot.centreLeg, turnedWaistSide],
        sub(pivot.centreLeg, waist.from),
        sub(turnedWaistSide, pivot.centreLeg),
      ),
      rotateAbout(path[SKIRT_SEGMENT.sideCurve]!, pivot.point, pivot.angleRad),
      rotateAbout(path[SKIRT_SEGMENT.sideLine]!, pivot.point, pivot.angleRad),
      lineSeg(turnedHemSide, turnedSlash),
      bridge!,
      lineSeg(hemSlash, hem.to),
      path[SKIRT_SEGMENT.centre]!,
    ],
    hemSlash: [hemSlash, turnedSlash],
  };
}

/**
 * The hip line of the A-line piece: it bends at the pivot, so it is declared as a polyline from the centre line
 * through the pivot to the turned hip side point (FR-VAL-03 measures it along those points).
 *
 * @param path - The block's stitch path.
 * @param pivot - Pivot and turn.
 * @returns The hip body line.
 */
function hipLine(path: readonly Segment[], pivot: Pivot): BodyLine {
  const hipSide = path[SKIRT_SEGMENT.sideCurve]!.to;
  return {
    id: "skirt-hip",
    measurement: "hip",
    kind: "polyline",
    points: [pt(0, pivot.point.y), pivot.point, rotateAbout(hipSide, pivot.point, pivot.angleRad)],
  };
}

/**
 * Turns one straight-block piece into its A-line version: the whole waist dart closes and opens at the hem.
 * A block without a dart (hip not wider than the waist) has nothing to transfer and is returned as it is, gain 0.
 *
 * @param piece - Straight block piece (`skirt-front` or `skirt-back`).
 * @param half - Front or back.
 * @param hipDepthMm - Waist to hip line.
 * @returns The A-line piece and its hem gain.
 * @throws {DraftingError} `SKIRT_A_LINE_PIVOT_OUTSIDE` when the pivot is not inside the piece on the hip line.
 */
export function aLinePiece(piece: PieceDraft, half: SkirtHalf, hipDepthMm: number): ALineDraft {
  const pivot = findPivot(piece, hipDepthMm);
  if (pivot === undefined) return { piece, hemGainMm: 0 };
  const hipSideXMm = piece.stitchPath[SKIRT_SEGMENT.sideCurve]!.to.x;
  if (!(pivot.point.x > 0 && pivot.point.x < hipSideXMm)) {
    throw new DraftingError(
      "SKIRT_A_LINE_PIVOT_OUTSIDE",
      `The A-line pivot x ${pivot.point.x} mm is not between the centre and the hip side ${hipSideXMm} mm`,
    );
  }
  const drawn = aLinePath(piece.stitchPath, pivot);
  const centre = piece.edges.find((e) => e.id === (half === "front" ? "cf" : "cb"));
  return {
    piece: {
      ...piece,
      stitchPath: drawn.path,
      edges: skirtEdges(half, centre?.kind !== "fold", A_LINE_RUNS),
      bodyLines: piece.bodyLines.map((line) =>
        line.id === "skirt-hip" ? hipLine(piece.stitchPath, pivot) : line,
      ),
      darts: [],
    },
    hemGainMm: distance(...drawn.hemSlash),
  };
}
