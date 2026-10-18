/** Back half of the bodice block (issue #128). Aldrich 6th ed., ch. 2, bodice block, back (docs/engine/drafting-method.md). */
import type { Dart, EngineOptions, Segment } from "@tafsila/schemas";
import {
  ARMHOLE_BACK_DIAGONAL_MM,
  BACK_NECK_RISE_MM,
  BACK_SHOULDER_EASE_MM,
  BACK_SHOULDER_SLOPE,
  WIDTH_POINT_DROP_SHARE,
} from "../../constants/bodice";
import { add, lineSeg, normalize, pt, scale } from "../../geometry";
import type { PieceDraft } from "../../pipeline/draft-context";
import { buildEdges } from "../shared/edges";
import { armholeCurve, neckCurve } from "./curves";
import { bodiceCut, grainLine, waistEdge, BACK_PIECE_ID, FRONT_PIECE_ID } from "./piece-parts";
import type { BackPoints, BodiceInput, BodiceLengths } from "./types";

/**
 * Back key points. Aldrich 6th ed., ch. 2, bodice block, back steps 1 to 8 (docs/engine/drafting-method.md);
 * the shoulder tip lies the back shoulder length along the back slope from the neck point (decision 128, 1).
 *
 * @param input - Bodice input.
 * @param d - Derived lengths.
 * @returns The 11 back key points.
 */
export function backKeyPoints(input: BodiceInput, d: BodiceLengths): BackPoints {
  const neckPoint = pt(d.neckWidthMm, 0);
  const shoulderTip = add(neckPoint, scale(normalize(pt(1, BACK_SHOULDER_SLOPE)), d.backShoulderLengthMm));
  const centreX = d.sideWaistXMm / 2;
  const waistY = d.backWaistYMm;
  return {
    nape: pt(0, BACK_NECK_RISE_MM),
    neckPoint,
    shoulderTip,
    backWidthPoint: pt(
      d.backWidthHalfMm,
      shoulderTip.y + (d.scyeYMm - shoulderTip.y) * WIDTH_POINT_DROP_SHARE,
    ),
    scyeLineCB: pt(0, d.scyeYMm),
    underarm: pt(input.bustQuarterMm, d.scyeYMm),
    waistCB: pt(0, waistY),
    sideWaist: pt(d.sideWaistXMm, waistY),
    waistDartLeft: pt(centreX - d.waistDartMm / 2, waistY),
    waistDartRight: pt(centreX + d.waistDartMm / 2, waistY),
    waistDartApex: pt(centreX, (d.scyeYMm + waistY) / 2),
  };
}

/**
 * Back armhole, shoulder tip to underarm.
 *
 * @param k - Back key points.
 * @returns Three cubics.
 */
export function backArmhole(k: BackPoints): Segment[] {
  return armholeCurve(
    { tip: k.shoulderTip, widthPoint: k.backWidthPoint, underarm: k.underarm },
    BACK_SHOULDER_SLOPE,
    ARMHOLE_BACK_DIAGONAL_MM,
  );
}

/**
 * Builds the back piece: outline from the nape (neck, shoulder, armhole, side, waist, centre back on the fold).
 *
 * @param k - Back key points.
 * @param armhole - The back armhole (drafted once by the caller, also passed on to the sleeve).
 * @param hasDart - Whether the waist dart is drafted.
 * @param options - Engine options, for the seam allowances.
 * @returns The back piece in progress.
 */
export function backPiece(
  k: BackPoints,
  armhole: readonly Segment[],
  hasDart: boolean,
  options: Pick<EngineOptions, "seamAllowance">,
): PieceDraft {
  const waist = waistEdge(k.sideWaist, [k.waistDartRight, k.waistDartLeft], k.waistCB, hasDart);
  const outline: Segment[] = [
    ...neckCurve(k.nape, k.neckPoint, BACK_SHOULDER_SLOPE),
    lineSeg(k.neckPoint, k.shoulderTip),
    ...armhole,
    lineSeg(k.underarm, k.sideWaist),
    ...waist,
    lineSeg(k.waistCB, k.nape),
  ];
  const edges = buildEdges(
    BACK_PIECE_ID,
    [
      { id: "neck", kind: "neckline", segments: 1 },
      {
        id: "shoulder",
        kind: "other",
        segments: 1,
        pairsWith: { pieceId: FRONT_PIECE_ID, edgeId: "shoulder", intendedEaseMm: BACK_SHOULDER_EASE_MM },
      },
      { id: "armhole", kind: "armhole", segments: 3 },
      { id: "side", kind: "side", segments: 1, pairsWith: { pieceId: FRONT_PIECE_ID, edgeId: "side" } },
      { id: "waist", kind: "other", segments: waist.length },
      { id: "cb", kind: "fold", segments: 1 },
    ],
    options,
  );
  const darts: Dart[] = hasDart
    ? [
        {
          id: "waist-dart",
          edgeId: "waist",
          apex: k.waistDartApex,
          legs: [k.waistDartRight, k.waistDartLeft],
        },
      ]
    : [];
  return {
    id: BACK_PIECE_ID,
    name: { ar: "الظهر", en: "Back bodice" },
    cut: bodiceCut(),
    stitchPath: outline,
    edges,
    notches: [],
    bodyLines: [
      { id: "bodice-bust", measurement: "bust", kind: "horizontal", atMm: k.underarm.y },
      { id: "bodice-waist", measurement: "waist", kind: "edge", edgeId: "waist" },
    ],
    grainLine: grainLine(k.nape.y, k.waistCB.y),
    darts,
  };
}
