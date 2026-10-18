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
  offsetPath,
  pt,
  reversePath,
  scale,
  sub,
} from "../../geometry";
import { PIECE_NAMES } from "../../i18n/pieces";
import type { PieceDraft } from "../../pipeline/draft-context";
import type { NeckHalf } from "./resolve";
import { NECK_EDGE_ID, SHOULDER_EDGE_ID } from "./splice";

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
 * @throws {DraftingError} GEOMETRY_OFFSET_FAILED when the neck curves tighter than the facing width.
 */
export function facingOutline(source: FacingSource): {
  outline: Segment[];
  segments: Record<string, number>;
} {
  const outer = offsetPath(source.neck, -source.widthMm);
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
 * @throws {DraftingError} GEOMETRY_OFFSET_FAILED or NECKLINE_FACING_INVALID.
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
