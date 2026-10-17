/** Front half of the bodice block (issue #128). Aldrich 6th ed., ch. 2, bodice block, front (docs/engine/drafting-method.md). */
import type { Dart, EngineOptions, Point, Segment } from "@tafsila/schemas";
import {
  ARMHOLE_FRONT_DIAGONAL_MM,
  BACK_NECK_RISE_MM,
  BUST_DART_APEX_SETBACK_MM,
  BUST_DART_BELOW_UNDERARM_MM,
  FRONT_DART_BELOW_BUST_MM,
  FRONT_SHOULDER_SLOPE,
  WIDTH_POINT_DROP_SHARE,
} from "../../constants/bodice";
import { lerp, lineSeg, pt } from "../../geometry";
import type { PieceDraft } from "../../pipeline/draft-context";
import { trueDartLegs } from "../shared/darts";
import { buildEdges } from "../shared/edges";
import { armholeCurve, neckCurve } from "./curves";
import { BACK_PIECE_ID, FRONT_PIECE_ID, bodiceCut, grainLine, waistEdge } from "./piece-parts";
import type { BodiceInput, BodiceLengths, FrontPoints } from "./types";

/**
 * Point on the front waist line (centre front waist to side waist) at x.
 *
 * @param waistCF - Centre front waist.
 * @param sideWaist - Side waist.
 * @param x - Horizontal position in mm.
 * @returns The point on the line.
 */
function onWaistLine(waistCF: Point, sideWaist: Point, x: number): Point {
  return lerp(waistCF, sideWaist, x / sideWaist.x);
}

/**
 * Front waist dart: centred under the bust point, ending below it, trued by extending the shorter leg.
 * Aldrich 6th ed., ch. 2, bodice block, front step 9 (docs/engine/drafting-method.md; decision 128, 3).
 *
 * @param input - Bodice input.
 * @param d - Derived lengths.
 * @param waist - Centre front and side waist points.
 * @param waist.cf - Centre front waist.
 * @param waist.side - Side waist.
 * @returns Left leg, right leg and apex.
 */
function frontWaistDart(
  input: BodiceInput,
  d: BodiceLengths,
  waist: { readonly cf: Point; readonly side: Point },
): { left: Point; right: Point; apex: Point } {
  const centreX = input.bustPointDistance / 2;
  const apex = pt(centreX, input.bustHeight + FRONT_DART_BELOW_BUST_MM);
  const left = onWaistLine(waist.cf, waist.side, centreX - d.waistDartMm / 2);
  const right = onWaistLine(waist.cf, waist.side, centreX + d.waistDartMm / 2);
  if (d.waistDartMm === 0) return { left, right, apex };
  const [l, r] = trueDartLegs(apex, left, right);
  return { left: l, right: r, apex };
}

/**
 * Front key points. Aldrich 6th ed., ch. 2, bodice block, front steps 1 to 9 (docs/engine/drafting-method.md);
 * bust dart apex per decision 128, 2.
 *
 * @param input - Bodice input.
 * @param d - Derived lengths.
 * @returns The 15 front key points.
 */
export function frontKeyPoints(input: BodiceInput, d: BodiceLengths): FrontPoints {
  const tipY = d.shoulderRunMm * FRONT_SHOULDER_SLOPE;
  const upper = pt(input.bustQuarterMm, d.scyeYMm + BUST_DART_BELOW_UNDERARM_MM);
  const lower = pt(input.bustQuarterMm, upper.y + d.bustDartMm);
  const bustPoint = pt(input.bustPointDistance / 2, input.bustHeight);
  const waistCF = pt(0, input.frontLength);
  const sideWaist = pt(d.sideWaistXMm, BACK_NECK_RISE_MM + input.backLength + d.bustDartMm);
  const dart = frontWaistDart(input, d, { cf: waistCF, side: sideWaist });
  return {
    neckPoint: pt(d.neckWidthMm, 0),
    neckCF: pt(0, d.frontNeckDepthMm),
    shoulderTip: pt(input.shoulderWidth / 2, tipY),
    chestWidthPoint: pt(d.chestWidthHalfMm, tipY + (d.scyeYMm - tipY) * WIDTH_POINT_DROP_SHARE),
    scyeLineCF: pt(0, d.scyeYMm),
    underarm: pt(input.bustQuarterMm, d.scyeYMm),
    bustPoint,
    bustDartUpper: upper,
    bustDartLower: lower,
    bustDartApex: pt(bustPoint.x + BUST_DART_APEX_SETBACK_MM, (upper.y + lower.y) / 2),
    waistCF,
    sideWaist,
    waistDartLeft: dart.left,
    waistDartRight: dart.right,
    waistDartApex: dart.apex,
  };
}

/**
 * Front armhole, shoulder tip to underarm.
 *
 * @param k - Front key points.
 * @returns Three cubics.
 */
export function frontArmhole(k: FrontPoints): Segment[] {
  return armholeCurve(
    { tip: k.shoulderTip, widthPoint: k.chestWidthPoint, underarm: k.underarm },
    FRONT_SHOULDER_SLOPE,
    ARMHOLE_FRONT_DIAGONAL_MM,
  );
}

/**
 * Darts of the front piece, legs in path order.
 *
 * @param k - Front key points.
 * @param hasWaistDart - Whether the waist dart is drafted.
 * @returns The bust dart and, when drafted, the waist dart.
 */
function frontDarts(k: FrontPoints, hasWaistDart: boolean): Dart[] {
  const bust: Dart = {
    id: "bust-dart",
    edgeId: "side",
    apex: k.bustDartApex,
    legs: [k.bustDartUpper, k.bustDartLower],
  };
  if (!hasWaistDart) return [bust];
  return [
    bust,
    { id: "waist-dart", edgeId: "waist", apex: k.waistDartApex, legs: [k.waistDartRight, k.waistDartLeft] },
  ];
}

/**
 * Builds the front piece: outline from the centre front neck (neck, shoulder, armhole, side with the bust dart,
 * waist, centre front on the fold).
 *
 * @param k - Front key points.
 * @param hasWaistDart - Whether the waist dart is drafted.
 * @param options - Engine options, for the seam allowances.
 * @returns The front piece in progress.
 */
export function frontPiece(
  k: FrontPoints,
  hasWaistDart: boolean,
  options: Pick<EngineOptions, "seamAllowance">,
): PieceDraft {
  const waist = waistEdge(k.sideWaist, [k.waistDartRight, k.waistDartLeft], k.waistCF, hasWaistDart);
  const outline: Segment[] = [
    ...neckCurve(k.neckCF, k.neckPoint, FRONT_SHOULDER_SLOPE),
    lineSeg(k.neckPoint, k.shoulderTip),
    ...frontArmhole(k),
    lineSeg(k.underarm, k.bustDartUpper),
    lineSeg(k.bustDartUpper, k.bustDartLower),
    lineSeg(k.bustDartLower, k.sideWaist),
    ...waist,
    lineSeg(k.waistCF, k.neckCF),
  ];
  const edges = buildEdges(
    FRONT_PIECE_ID,
    [
      { id: "neck", kind: "neckline", segments: 1 },
      {
        id: "shoulder",
        kind: "other",
        segments: 1,
        pairsWith: { pieceId: BACK_PIECE_ID, edgeId: "shoulder" },
      },
      { id: "armhole", kind: "armhole", segments: 3 },
      { id: "side", kind: "side", segments: 3, pairsWith: { pieceId: BACK_PIECE_ID, edgeId: "side" } },
      { id: "waist", kind: "other", segments: waist.length },
      { id: "cf", kind: "fold", segments: 1 },
    ],
    options,
  );
  return {
    id: FRONT_PIECE_ID,
    name: { ar: "الصدر الأمامي", en: "Front bodice" },
    cut: bodiceCut(),
    stitchPath: outline,
    edges,
    notches: [],
    grainLine: grainLine(k.neckCF.y, k.waistCF.y),
    darts: frontDarts(k, hasWaistDart),
  };
}
