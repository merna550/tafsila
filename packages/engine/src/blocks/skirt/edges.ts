/** Named edges of the straight skirt block (issue #129, decision 129-skirt-block). Ids are shared by #135–#140 and #143. */
import type { Edge } from "@tafsila/schemas";

/** Which half of the skirt block. */
export type SkirtHalf = "front" | "back";

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

/**
 * The five named edges of one skirt half. The side seams pair front with back and carry no ease.
 *
 * @param half - Front or back.
 * @param centreSeam - True when the centre back is a seam (a centre-back zip); the front is always on the fold.
 * @returns Edges `waist`, `side`, `hem` and `cf` or `cb`; seam allowances are written later by the finishing step.
 */
export function skirtEdges(half: SkirtHalf, centreSeam: boolean): Edge[] {
  const other: SkirtHalf = half === "front" ? "back" : "front";
  const centreIsSeam = half === "back" && centreSeam;
  return [
    {
      id: "waist",
      fromSegment: SKIRT_SEGMENT.waist,
      toSegment: SKIRT_SEGMENT.waist,
      kind: "other",
      seamAllowanceMm: 0,
    },
    {
      id: "side",
      fromSegment: SKIRT_SEGMENT.sideCurve,
      toSegment: SKIRT_SEGMENT.sideLine,
      kind: "side",
      seamAllowanceMm: 0,
      pairsWith: { pieceId: SKIRT_PIECE_ID[other], edgeId: "side", intendedEaseMm: 0 },
    },
    {
      id: "hem",
      fromSegment: SKIRT_SEGMENT.hem,
      toSegment: SKIRT_SEGMENT.hem,
      kind: "hem",
      seamAllowanceMm: 0,
    },
    {
      id: half === "front" ? "cf" : "cb",
      fromSegment: SKIRT_SEGMENT.centre,
      toSegment: SKIRT_SEGMENT.centre,
      kind: centreIsSeam ? "other" : "fold",
      seamAllowanceMm: 0,
      ...(centreIsSeam
        ? { pairsWith: { pieceId: SKIRT_PIECE_ID.back, edgeId: "cb", intendedEaseMm: 0 } }
        : {}),
    },
  ];
}
