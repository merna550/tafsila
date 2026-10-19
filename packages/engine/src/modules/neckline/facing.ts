/**
 * Neck facings (issue #139, FR-PAT-07, decision 139, 4): one facing per half, traced from the drafted neckline,
 * `FACING_WIDTH_MM` wide, cut on the fold, plus a matching interfacing piece. The facing's neck edge is the
 * bodice neck itself, so the seam-match rule (FR-VAL-01) checks them within 2 mm. Aldrich 6th ed., ch. 4, facings.
 */
import type { EngineOptions, Piece, Point, Segment } from "@tafsila/schemas";
import { buildEdges, type EdgeSpec } from "../../blocks/shared/edges";
import {
  FACING_GRAIN_FROM_FOLD_MM,
  FACING_GRAIN_INSET_MM,
  FACING_GRAIN_MAX_INSET_SHARE,
  FACING_ON_FOLD_EPSILON_MM,
} from "../../constants/neckline";
import { DraftingError } from "../../errors/drafting-error";
import {
  add,
  intersectSegments,
  lineSeg,
  normalize,
  perpendicular,
  angleRad,
  arcToCubics,
  cross,
  cubicSeg,
  distance,
  tangentOnSegment,
  pt,
  reversePath,
  scale,
  sub,
} from "../../geometry";
import { PIECE_NAMES } from "../../i18n/pieces";
import type { PieceDraft } from "../../pipeline/draft-context";
import type { NeckHalf } from "./resolve";
import { NECK_EDGE_ID, SHOULDER_EDGE_ID } from "./splice";

/** Degree of a cubic: its first derivative at an end is 3 × the handle. */
const CUBIC_DEGREE = 3;
/** Its second derivative at an end is 6 × the second difference of the control points. */
const CUBIC_SECOND_FACTOR = 6;
/** Curvature divides by the speed cubed. */
const CUBE = 3;

/** Id of the facing's outer (finished) edge. */
export const FACING_OUTER_EDGE_ID = "outer";

/** Id of the facing's centre line on the fold. */
export const FACING_FOLD_EDGE_ID = "fold";

/** Facing piece ids per half. */
export const FACING_PIECE_IDS: Readonly<Record<NeckHalf, string>> = {
  front: "neck-facing-front",
  back: "neck-facing-back",
};

/** Interfacing piece ids per half. */
export const INTERFACING_PIECE_IDS: Readonly<Record<NeckHalf, string>> = {
  front: "neck-facing-front-interfacing",
  back: "neck-facing-back-interfacing",
};

/** Every piece the neckline adds (both facings and both interfacings), sorted by id. */
export const NECKLINE_PIECE_IDS: readonly string[] = [
  ...Object.values(FACING_PIECE_IDS),
  ...Object.values(INTERFACING_PIECE_IDS),
].sort((a, b) => a.localeCompare(b, "en"));

/** What one facing is traced from. */
export interface FacingSource {
  /** Front or back. */
  readonly half: NeckHalf;
  /** The drafted neck, centre line to neck point. */
  readonly neck: readonly Segment[];
  /** Id of the bodice piece holding this neck. */
  readonly bodicePieceId: string;
  /** Facing width in mm. */
  readonly widthMm: number;
}

/**
 * Signed curvature of a cubic at one end (positive when it turns toward the left normal).
 *
 * @param velocity - First derivative there.
 * @param accel - Second derivative there.
 * @returns Curvature in 1/mm, 0 for a degenerate handle.
 */
function endCurvature(velocity: Point, accel: Point): number {
  const speed = Math.hypot(velocity.x, velocity.y);
  return speed < FACING_ON_FOLD_EPSILON_MM ? 0 : cross(velocity, accel) / speed ** CUBE;
}

/**
 * One neck segment moved `widthMm` toward the body. A line moves exactly; a cubic moves its ends along their normals
 * and scales each handle by the change of radius there (1 − d·κ), which is exact for the circular arcs of the
 * sweetheart and well inside 1 mm for the other necks (Tiller & Hanson 1984, one step).
 *
 * @param seg - Neck segment.
 * @param widthMm - Facing width.
 * @returns The moved segment.
 */
function offsetOnce(seg: Segment, widthMm: number): Segment {
  const n0 = scale(perpendicular(tangentOnSegment(seg, 0)), widthMm);
  const n1 = scale(perpendicular(tangentOnSegment(seg, 1)), widthMm);
  if (seg.kind === "line") return lineSeg(add(seg.from, n0), add(seg.to, n1));
  const { from, c1, c2, to } = seg;
  const k0 = endCurvature(
    scale(sub(c1, from), CUBIC_DEGREE),
    scale(add(sub(c2, scale(c1, 2)), from), CUBIC_SECOND_FACTOR),
  );
  const k1 = endCurvature(
    scale(sub(to, c2), CUBIC_DEGREE),
    scale(add(sub(to, scale(c2, 2)), c1), CUBIC_SECOND_FACTOR),
  );
  const start = add(from, n0);
  const end = add(to, n1);
  return cubicSeg(
    start,
    add(start, scale(sub(c1, from), 1 - widthMm * k0)),
    add(end, scale(sub(c2, to), 1 - widthMm * k1)),
    end,
  );
}

/**
 * The facing's outer edge: each neck segment moved `widthMm` toward the body; where the neck has a corner (the square
 * neck), the gap is closed by a circular arc about the corner. It is a finished edge, not a seam.
 *
 * @param neck - The neck, centre first.
 * @param widthMm - Facing width.
 * @returns The outer edge, centre side first.
 */
function facingEdge(neck: readonly Segment[], widthMm: number): Segment[] {
  const moved = neck.map((seg) => offsetOnce(seg, widthMm));
  return moved.flatMap((seg, i) => {
    const next = moved[i + 1];
    if (!next || distance(seg.to, next.from) <= FACING_ON_FOLD_EPSILON_MM) return [seg];
    const corner = neck[i]!.to;
    const fromRad = angleRad(sub(seg.to, corner));
    const turnRad = angleRad(sub(next.from, corner)) - fromRad;
    const sweepRad = Math.atan2(Math.sin(turnRad), Math.cos(turnRad));
    return [seg, ...arcToCubics({ center: corner, radiusMm: widthMm, fromRad, toRad: fromRad + sweepRad })];
  });
}

/**
 * Where the outer edge meets the fold: the outer edge's first point, or, when the neck leaves the centre line at an
 * angle (V, sweetheart), its first tangent extended back to the fold.
 *
 * @param outer - The offset neck, centre side first.
 * @returns The extra line to the fold, if any.
 */
function toFold(outer: readonly Segment[]): Segment[] {
  const first = outer[0]!;
  const start = first.from;
  if (Math.abs(start.x) <= FACING_ON_FOLD_EPSILON_MM) return [];
  const next = first.kind === "cubic" ? first.c1 : first.to;
  const dir = normalize(sub(next, start));
  return [lineSeg(add(start, scale(dir, -start.x / dir.x)), start)];
}

/**
 * Grain line of a facing: parallel to the fold, `FACING_GRAIN_FROM_FOLD_MM` from it, inset inside the band.
 *
 * @param outline - The facing outline.
 * @returns The two grain line ends.
 * @throws {DraftingError} NECKLINE_FACING_INVALID when the band does not reach the grain line.
 */
function facingGrain(outline: readonly Segment[]): [Point, Point] {
  const x = FACING_GRAIN_FROM_FOLD_MM;
  const probe = lineSeg(pt(x, -Number.MAX_SAFE_INTEGER), pt(x, Number.MAX_SAFE_INTEGER));
  const ys = outline.flatMap((seg) => intersectSegments(seg, probe).map((c) => c.point.y));
  if (ys.length < 2)
    throw new DraftingError("NECKLINE_FACING_INVALID", "The facing does not reach its grain line");
  const top = Math.min(...ys);
  const bottom = Math.max(...ys);
  const inset = Math.min(FACING_GRAIN_INSET_MM, (bottom - top) * FACING_GRAIN_MAX_INSET_SHARE);
  return [pt(x, top + inset), pt(x, bottom - inset)];
}

/**
 * The facing outline: the neck, the shoulder for the facing width, the outer edge (the neck offset by the width,
 * which lands on the shoulder because the neck meets it square) and the centre line on the fold.
 *
 * @param source - What the facing is traced from.
 * @returns The outline and its edge specs.
 */
export function facingOutline(source: FacingSource): {
  outline: Segment[];
  segments: Record<string, number>;
} {
  const outer = facingEdge(source.neck, source.widthMm);
  const neckPoint = source.neck.at(-1)!.to;
  const centre = source.neck[0]!.from;
  const extension = toFold(outer);
  const foldOuter = extension[0]?.from ?? outer[0]!.from;
  const outline = [
    ...source.neck,
    lineSeg(neckPoint, outer.at(-1)!.to),
    ...reversePath(outer),
    ...extension.map((seg) => lineSeg(seg.to, seg.from)),
    lineSeg(foldOuter, centre),
  ];
  return { outline, segments: { neck: source.neck.length, outer: outer.length + extension.length } };
}

/**
 * Cut info of a facing or its interfacing: one on the fold.
 *
 * @param fabric - Main fabric or interfacing.
 * @returns The cut info.
 */
function facingCut(fabric: Piece["cut"]["fabric"]): Piece["cut"] {
  return { quantity: 1, onFold: true, mirror: false, fabric };
}

/**
 * Edge specs of a facing: neck, shoulder, outer edge, fold. When paired, the neck pairs with the bodice neck and
 * the shoulder with the other facing's shoulder.
 *
 * @param source - What the facing is traced from.
 * @param segments - Segment counts of the neck and the outer edge.
 * @param paired - Whether to declare the pairs (the facing) or not (the interfacing).
 * @returns The edge specs in path order.
 */
function facingEdgeSpecs(
  source: FacingSource,
  segments: Readonly<Record<string, number>>,
  paired: boolean,
): EdgeSpec[] {
  const other: NeckHalf = source.half === "front" ? "back" : "front";
  return [
    {
      id: NECK_EDGE_ID,
      kind: "neckline",
      segments: segments.neck!,
      ...(paired ? { pairsWith: { pieceId: source.bodicePieceId, edgeId: NECK_EDGE_ID } } : {}),
    },
    {
      id: SHOULDER_EDGE_ID,
      kind: "other",
      segments: 1,
      ...(paired ? { pairsWith: { pieceId: FACING_PIECE_IDS[other], edgeId: SHOULDER_EDGE_ID } } : {}),
    },
    { id: FACING_OUTER_EDGE_ID, kind: "other", segments: segments.outer! },
    { id: FACING_FOLD_EDGE_ID, kind: "fold", segments: 1 },
  ];
}

/**
 * Builds the facing of one half and its interfacing. The interfacing has the same outline and no pairs.
 *
 * @param source - What the facing is traced from.
 * @param options - Engine options, for the seam allowances.
 * @returns The facing and the interfacing.
 * @throws {DraftingError} NECKLINE_FACING_INVALID when the band misses its grain line.
 */
export function facingPieces(
  source: FacingSource,
  options: Pick<EngineOptions, "seamAllowance">,
): [PieceDraft, PieceDraft] {
  const { outline, segments } = facingOutline(source);
  const grainLine = facingGrain(outline);
  /**
   * One facing piece over the shared outline.
   *
   * @param id - Piece id.
   * @param fabric - Main fabric or interfacing.
   * @param paired - Whether its edges declare their pairs.
   * @returns The piece.
   */
  const piece = (id: string, fabric: Piece["cut"]["fabric"], paired: boolean): PieceDraft => ({
    id,
    name: PIECE_NAMES[id]!,
    cut: facingCut(fabric),
    stitchPath: outline,
    edges: buildEdges(id, facingEdgeSpecs(source, segments, paired), options),
    notches: [],
    bodyLines: [],
    grainLine,
    darts: [],
  });
  return [
    piece(FACING_PIECE_IDS[source.half], "main", true),
    piece(INTERFACING_PIECE_IDS[source.half], "interfacing", false),
  ];
}
