/** Named edges of the straight skirt block (issue #129, decision 129-skirt-block). Ids are shared by #135–#140 and #143. */
import type { Edge, Piece } from "@tafsila/schemas";

/** Which half of the skirt block. */
export type SkirtHalf = "front" | "back";

/** Bilingual piece name of each half (copy glossary: تنورة = skirt). */
export const SKIRT_PIECE_NAME: Readonly<Record<SkirtHalf, Piece["name"]>> = {
  front: { ar: "أمام التنورة", en: "Skirt front" },
  back: { ar: "خلف التنورة", en: "Skirt back" },
};

/** Piece id of each half. */
export const SKIRT_PIECE_ID: Readonly<Record<SkirtHalf, string>> = {
  front: "skirt-front",
  back: "skirt-back",
};

/**
 * Index of each run in the stitch path drawn by `draftSkirtHalf`:
 * waist (centre to side), side curve (waist to hip), side line (hip to hem), hem (side to centre), centre (hem to waist).
 */
export const SKIRT_SEGMENT = { waist: 0, sideCurve: 1, sideLine: 2, hem: 3, centre: 4 } as const;

/** Inclusive first and last stitch-path segment of each skirt edge. */
export interface SkirtEdgeRuns {
  /** Waist, centre to side. */
  readonly waist: readonly [number, number];
  /** Side seam, waist to hem. */
  readonly side: readonly [number, number];
  /** Hem, side to centre. */
  readonly hem: readonly [number, number];
  /** Centre front or back, hem to waist. */
  readonly centre: readonly [number, number];
}

/** Edge runs of the straight skirt block's stitch path. */
export const STRAIGHT_SKIRT_RUNS: SkirtEdgeRuns = {
  waist: [SKIRT_SEGMENT.waist, SKIRT_SEGMENT.waist],
  side: [SKIRT_SEGMENT.sideCurve, SKIRT_SEGMENT.sideLine],
  hem: [SKIRT_SEGMENT.hem, SKIRT_SEGMENT.hem],
  centre: [SKIRT_SEGMENT.centre, SKIRT_SEGMENT.centre],
};

/**
 * The named edges of one skirt half. The side seams pair front with back and carry no ease; a centre seam pairs with
 * the same edge of the mirrored copy. Shared by every skirt that keeps the block's edge names (#129, #136).
 *
 * @param half - Front or back.
 * @param centreSeam - True when this half's centre line is a seam (a zip, or a circle skirt split to fit the fabric).
 * @param runs - Which stitch-path segments each edge covers; defaults to the straight block's.
 * @returns Edges `waist`, `side`, `hem` and `cf` or `cb`; seam allowances are written later by the finishing step.
 */
export function skirtEdges(
  half: SkirtHalf,
  centreSeam: boolean,
  runs: SkirtEdgeRuns = STRAIGHT_SKIRT_RUNS,
): Edge[] {
  const other: SkirtHalf = half === "front" ? "back" : "front";
  const centreId = half === "front" ? "cf" : "cb";
  return [
    { id: "waist", fromSegment: runs.waist[0], toSegment: runs.waist[1], kind: "other", seamAllowanceMm: 0 },
    {
      id: "side",
      fromSegment: runs.side[0],
      toSegment: runs.side[1],
      kind: "side",
      seamAllowanceMm: 0,
      pairsWith: { pieceId: SKIRT_PIECE_ID[other], edgeId: "side", intendedEaseMm: 0 },
    },
    { id: "hem", fromSegment: runs.hem[0], toSegment: runs.hem[1], kind: "hem", seamAllowanceMm: 0 },
    {
      id: centreId,
      fromSegment: runs.centre[0],
      toSegment: runs.centre[1],
      kind: centreSeam ? "other" : "fold",
      seamAllowanceMm: 0,
      ...(centreSeam
        ? { pairsWith: { pieceId: SKIRT_PIECE_ID[half], edgeId: centreId, intendedEaseMm: 0 } }
        : {}),
    },
  ];
}
