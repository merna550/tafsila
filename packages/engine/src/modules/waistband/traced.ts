/**
 * Waist pieces traced from a shaped skirt (issue #140, decision 140, 1): the skirt waist line with its darts closed
 * (each part past a dart turned about the dart apex until the legs meet), then a strip of constant depth above it (a
 * contour band) or below it (a waist facing). Closing by rotation keeps every length, so the traced edge sews to the
 * skirt waist exactly (FR-VAL-01). Aldrich 6th ed., ch. 2 (shaped waistbands, waist facings).
 */
import type { Dart, EngineOptions, Piece } from "@tafsila/schemas";
import { buildEdges, type EdgeSpec } from "../../blocks/shared/edges";
import { dartMouthIndex } from "../../blocks/shared/darts";
import { GEOMETRY_EPSILON_MM } from "../../constants/geometry";
import { TRACED_GRAIN_DEPTH_SHARE } from "../../constants/waistband";
import { DraftingError } from "../../errors/drafting-error";
import {
  add,
  angleRad,
  cubicSeg,
  lerp,
  lineLine,
  type LineLike,
  perpendicular,
  type Point,
  distance,
  distancePointToSegment,
  dot,
  lineSeg,
  normalize,
  pathLength,
  pointAtLength,
  reversePath,
  rotateAbout,
  scale,
  segmentLength,
  sub,
  translate,
  type Segment,
} from "../../geometry";
import { PIECE_NAMES } from "../../i18n/pieces";
import { edgeSegments } from "../../pieces/measure";
import { WAIST_EDGE_ID } from "../../pieces/waist-seam";
import type { PieceDraft } from "../../pipeline/draft-context";

/** The traced edge that sews to the skirt waist. */
export const TRACED_SEAM_EDGE_ID = "seam";
/** The far edge of a traced piece (the band top, or the facing's neatened edge). */
export const TRACED_FREE_EDGE_ID = "free";
/** The end at the side seam. */
export const TRACED_SIDE_EDGE_ID = "side";
/** The end on the centre line (a fold when the skirt piece is cut on the fold). */
export const TRACED_CENTRE_EDGE_ID = "centre";

/** Half, for the midpoint of a degenerate control leg. */
const HALF = 0.5;

/** A dart's mouth points and apex, moved along with the waist as earlier darts close. */
type DartShape = Pick<Dart, "apex" | "legs">;

/**
 * Splits the waist at one dart: the part up to the first leg and the part from the second leg.
 *
 * @param path - Waist segments from the centre.
 * @param dart - The dart, legs on the path.
 * @returns The two parts and the legs in path order.
 * @throws {DraftingError} WAISTBAND_TRACE_FAILED when the legs are neither a mouth segment nor on one line.
 */
function splitAtDart(
  path: readonly Segment[],
  dart: DartShape,
): { before: Segment[]; after: Segment[]; legs: DartShape["legs"] } {
  const mouth = dartMouthIndex(path, dart);
  if (mouth >= 0) {
    const seg = path[mouth]!;
    return { before: path.slice(0, mouth), after: path.slice(mouth + 1), legs: [seg.from, seg.to] };
  }
  const index = path.findIndex(
    (seg) =>
      seg.kind === "line" &&
      dart.legs.every((leg) => distancePointToSegment(leg, seg.from, seg.to) <= GEOMETRY_EPSILON_MM),
  );
  if (index < 0) throw new DraftingError("WAISTBAND_TRACE_FAILED", "A waist dart is not on the waist line");
  const seg = path[index]!;
  /**
   * Distance of a point along the segment, scaled by its length.
   *
   * @param p - A point on the segment.
   * @returns The scaled distance.
   */
  const along = (p: DartShape["apex"]): number => dot(sub(p, seg.from), sub(seg.to, seg.from));
  const [a, b] = along(dart.legs[0]) <= along(dart.legs[1]) ? dart.legs : [dart.legs[1], dart.legs[0]];
  return {
    before: [...path.slice(0, index), lineSeg(seg.from, a)],
    after: [lineSeg(b, seg.to), ...path.slice(index + 1)],
    legs: [a, b],
  };
}

/**
 * Closes the darts of a waist line in order from the centre.
 *
 * @param path - Waist segments from the centre.
 * @param darts - Darts on the waist, in order from the centre.
 * @returns The closed waist line.
 */
function closeDarts(path: readonly Segment[], darts: readonly DartShape[]): Segment[] {
  const [dart, ...rest] = darts;
  if (!dart) return [...path];
  const { before, after, legs } = splitAtDart(path, dart);
  const turnRad = angleRad(sub(legs[0], dart.apex)) - angleRad(sub(legs[1], dart.apex));
  const turned = rotateAbout(after, dart.apex, turnRad);
  const shift = sub(legs[0], turned[0]!.from);
  const moved = translate(turned, shift);
  const movedDarts = rest.map((d) => ({
    apex: add(rotateAbout(d.apex, dart.apex, turnRad), shift),
    legs: d.legs.map((leg) =>
      add(rotateAbout(leg, dart.apex, turnRad), shift),
    ) as unknown as DartShape["legs"],
  }));
  return [...before, ...closeDarts(moved, movedDarts)];
}

/**
 * The skirt waist line with its darts closed, centre to side (method step 1).
 *
 * @param piece - A skirt piece with a waist edge.
 * @returns The closed waist line; its length is the waist the piece sews to.
 */
export function closedWaistTrace(piece: PieceDraft): Segment[] {
  const path = edgeSegments(piece, WAIST_EDGE_ID);
  /**
   * Distance of a dart's first leg from the centre end of the waist.
   *
   * @param d - The dart.
   * @returns Distance in mm.
   */
  const fromCentre = (d: DartShape): number => distance(path[0]!.from, d.legs[0]);
  const darts = piece.darts
    .filter((d) => d.edgeId === WAIST_EDGE_ID)
    .sort((x, y) => fromCentre(x) - fromCentre(y));
  return closeDarts(path, darts).filter((seg) => segmentLength(seg) > GEOMETRY_EPSILON_MM);
}

/** Which side of the waist line a traced piece lies on. */
export type TraceSide = "above" | "below";

/**
 * The shift that moves a leg `distanceMm` along its normal.
 *
 * @param from - Leg start.
 * @param to - Leg end.
 * @param distanceMm - Signed distance along `perpendicular` of the leg direction.
 * @returns The shift vector.
 */
function legShift(from: Point, to: Point, distanceMm: number): Point {
  return scale(perpendicular(normalize(sub(to, from))), distanceMm);
}

/**
 * Where two moved control legs meet (their midpoint gap when parallel).
 *
 * @param first - Earlier leg.
 * @param second - Later leg.
 * @returns The new control point.
 */
function legCorner(first: LineLike, second: LineLike): Point {
  return lineLine(first, second, true)?.point ?? lerp(first.to, second.from, HALF);
}

/**
 * Moves one segment `distanceMm` along its normal: a line by its normal, a cubic by offsetting each leg of its control
 * polygon (Tiller and Hanson, 1984). One segment per segment keeps the outline light; the far edge is free, so the
 * small error of the cubic offset does not touch any seam.
 *
 * @param seg - A waist segment.
 * @param distanceMm - Signed distance along `perpendicular` of the travel direction.
 * @returns The moved segment.
 */
function offsetOne(seg: Segment, distanceMm: number): Segment {
  if (seg.kind === "line") return translate(seg, legShift(seg.from, seg.to, distanceMm));
  const legs: LineLike[] = [
    lineSeg(seg.from, seg.c1),
    lineSeg(seg.c1, seg.c2),
    lineSeg(seg.c2, seg.to),
  ].map((leg) => translate(leg, legShift(leg.from, leg.to, distanceMm)));
  return cubicSeg(legs[0]!.from, legCorner(legs[0]!, legs[1]!), legCorner(legs[1]!, legs[2]!), legs[2]!.to);
}

/**
 * Joins consecutive moved segments: two lines meet at their crossing (a mitre outside a kink, a trim inside it);
 * otherwise the next segment starts where the previous one ends.
 *
 * @param moved - Moved segments in order.
 * @returns A continuous path.
 */
function joinMoved(moved: readonly Segment[]): Segment[] {
  const out: Segment[] = [moved[0]!];
  for (const next of moved.slice(1)) {
    const prev = out.at(-1)!;
    const meet =
      prev.kind === "line" && next.kind === "line" ? (lineLine(prev, next, true)?.point ?? prev.to) : prev.to;
    out[out.length - 1] = { ...prev, to: meet };
    out.push({ ...next, from: meet });
  }
  return out;
}

/**
 * The waist line moved a constant depth away, above (a band) or below (a facing). The skirt hangs toward +y.
 *
 * @param trace - Closed waist line.
 * @param depthMm - Depth of the piece.
 * @param side - Above or below the waist.
 * @returns The far edge, centre to side.
 */
function farEdge(trace: readonly Segment[], depthMm: number, side: TraceSide): Segment[] {
  const probe = offsetOne(trace[0]!, depthMm);
  const below = probe.from.y > trace[0]!.from.y;
  const signed = below === (side === "below") ? depthMm : -depthMm;
  return joinMoved(trace.map((seg) => offsetOne(seg, signed)));
}

/** How a traced piece is cut and paired. */
export interface TracedSpec {
  /** Piece id (its name comes from the piece-name catalogue). */
  readonly id: string;
  /** The skirt piece it is traced from. */
  readonly skirt: PieceDraft;
  /** Depth of the piece from the waist seam, in mm. */
  readonly depthMm: number;
  /** Above the waist (a contour band) or below it (a facing). */
  readonly side: TraceSide;
  /** Fabric it is cut from. */
  readonly fabric: Piece["cut"]["fabric"];
  /** Whether the traced edge pairs with the skirt waist. */
  readonly pairWaist: boolean;
  /** The piece whose free edge this piece's free edge is sewn to (a contour band and its facing). */
  readonly freePartnerId?: string;
}

/**
 * Edge specs in path order: traced seam, side, free edge, centre.
 *
 * @param spec - The traced piece.
 * @param counts - Segments in the seam and in the free edge.
 * @param counts.seam - Segments in the traced seam.
 * @param counts.free - Segments in the free edge.
 * @returns Edge specs.
 */
function tracedEdgeSpecs(spec: TracedSpec, counts: { seam: number; free: number }): EdgeSpec[] {
  const pair = spec.pairWaist
    ? { pairsWith: { pieceId: spec.skirt.id, edgeId: WAIST_EDGE_ID, intendedEaseMm: 0 } }
    : {};
  const freePair = spec.freePartnerId
    ? { pairsWith: { pieceId: spec.freePartnerId, edgeId: TRACED_FREE_EDGE_ID, intendedEaseMm: 0 } }
    : {};
  return [
    { id: TRACED_SEAM_EDGE_ID, kind: "other", segments: counts.seam, ...pair },
    { id: TRACED_SIDE_EDGE_ID, kind: "side", segments: 1 },
    { id: TRACED_FREE_EDGE_ID, kind: "other", segments: counts.free, ...freePair },
    { id: TRACED_CENTRE_EDGE_ID, kind: spec.skirt.cut.onFold ? "fold" : "other", segments: 1 },
  ];
}

/**
 * Builds one traced piece, cut like the skirt piece it follows (on the fold, or as a mirrored pair).
 *
 * @param spec - The traced piece.
 * @param options - Engine options, for the seam allowances.
 * @returns The piece, ready for the finishing step.
 */
export function tracedPiece(spec: TracedSpec, options: Pick<EngineOptions, "seamAllowance">): PieceDraft {
  const trace = closedWaistTrace(spec.skirt);
  const far = farEdge(trace, spec.depthMm, spec.side);
  const stitchPath = [
    ...trace,
    lineSeg(trace.at(-1)!.to, far.at(-1)!.to),
    ...reversePath(far),
    lineSeg(far[0]!.from, trace[0]!.from),
  ];
  const middle = pointAtLength(trace, pathLength(trace) / 2);
  const across = normalize(sub(far[0]!.from, trace[0]!.from));
  return {
    id: spec.id,
    name: PIECE_NAMES[spec.id]!,
    cut: { ...spec.skirt.cut, fabric: spec.fabric },
    stitchPath,
    edges: buildEdges(spec.id, tracedEdgeSpecs(spec, { seam: trace.length, free: far.length }), options),
    notches: [],
    bodyLines: [],
    grainLine: [
      add(middle, scale(across, spec.depthMm * TRACED_GRAIN_DEPTH_SHARE.from)),
      add(middle, scale(across, spec.depthMm * TRACED_GRAIN_DEPTH_SHARE.to)),
    ],
    darts: [],
  };
}
