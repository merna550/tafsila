/** Neck and armhole curves of the bodice block (issue #128, decision 128, 5). */
import type { Point } from "@tafsila/schemas";
import { NECK_CURVE_HANDLE_RATIO, NECK_SHOULDER_HANDLE_SHARE } from "../../constants/bodice";
import { CATMULL_ROM_HANDLE_RATIO } from "../../constants/geometry";
import {
  add,
  cubicSeg,
  curveThroughPoints,
  distance,
  normalize,
  pt,
  scale,
  sub,
  type CubicSegment,
} from "../../geometry";

/** 1 / sqrt(2): the unit step along a 45 degree diagonal. */
const DIAGONAL_UNIT = Math.SQRT1_2;

/** Direction of the armhole at the guide point: square to the 45 degree diagonal, heading down to the side. */
const GUIDE_TANGENT = pt(1, 1);

/**
 * Neckline from the centre line to the neck point as one explicit cubic: square to the centre line at the
 * centre and square to the shoulder at the neck point, with handles of `NECK_CURVE_HANDLE_RATIO` of the neck
 * width and `NECK_SHOULDER_HANDLE_SHARE` of its depth, so the curve stays inside its box. Aldrich 6th ed., ch. 2, bodice block, back step 2 /
 * front step 2 (docs/engine/drafting-method.md).
 *
 * @param centre - Neck point on the centre line (nape or centre front neck).
 * @param neckPoint - Neck point on the HPS level.
 * @param shoulderSlope - Drop per mm of shoulder run.
 * @returns One cubic, centre to neck point.
 */
export function neckCurve(centre: Point, neckPoint: Point, shoulderSlope: number): CubicSegment[] {
  const square = normalize(pt(shoulderSlope, -1));
  const depthMm = centre.y - neckPoint.y;
  const c1 = add(centre, pt((neckPoint.x - centre.x) * NECK_CURVE_HANDLE_RATIO, 0));
  const c2 = sub(neckPoint, scale(square, (depthMm * NECK_SHOULDER_HANDLE_SHARE) / -square.y));
  return [cubicSeg(centre, c1, c2, neckPoint)];
}

/**
 * Armhole guide point on the 45 degree diagonal from the corner of the width point x and the armscye line.
 *
 * @param widthPoint - Back or chest width point.
 * @param underarm - Underarm point.
 * @param diagonalMm - Distance from the corner along the diagonal.
 * @returns The guide point.
 */
export function armholeGuidePoint(widthPoint: Point, underarm: Point, diagonalMm: number): Point {
  return add(pt(widthPoint.x, underarm.y), scale(pt(1, -1), diagonalMm * DIAGONAL_UNIT));
}

/**
 * Lower armhole, guide point to underarm, as one explicit cubic. The first handle runs square to the diagonal
 * and is never longer than the diagonal distance, so the curve cannot dip below the armscye line; the second
 * runs square to the side seam (decision 128, 5).
 *
 * @param guide - Armhole guide point.
 * @param underarm - Underarm point.
 * @param diagonalMm - Guide point distance along the diagonal.
 * @returns The cubic.
 */
function lowerArmhole(guide: Point, underarm: Point, diagonalMm: number): CubicSegment {
  const handle = distance(guide, underarm) * CATMULL_ROM_HANDLE_RATIO;
  const c1 = add(guide, scale(normalize(GUIDE_TANGENT), Math.min(handle, diagonalMm)));
  return cubicSeg(guide, c1, sub(underarm, pt(handle, 0)), underarm);
}

/**
 * Armhole from the shoulder tip through the width point and the guide point to the underarm: square to the
 * shoulder at the tip, square to the diagonal at the guide point and square to the side seam at the underarm.
 * Aldrich 6th ed., ch. 2, bodice block, back steps 5-6 / front steps 4-5 (docs/engine/drafting-method.md);
 * guide point per decision 128, 5.
 *
 * @param points - Shoulder tip, width point and underarm.
 * @param points.tip - Shoulder tip.
 * @param points.widthPoint - Back or chest width point.
 * @param points.underarm - Underarm point.
 * @param shoulderSlope - Drop per mm of shoulder run.
 * @param diagonalMm - Guide point distance along the diagonal.
 * @returns Three cubics, tip to underarm.
 */
export function armholeCurve(
  points: { readonly tip: Point; readonly widthPoint: Point; readonly underarm: Point },
  shoulderSlope: number,
  diagonalMm: number,
): CubicSegment[] {
  const guide = armholeGuidePoint(points.widthPoint, points.underarm, diagonalMm);
  const upper = curveThroughPoints(
    [points.tip, points.widthPoint, guide],
    pt(-shoulderSlope, 1),
    GUIDE_TANGENT,
  );
  return [...upper, lowerArmhole(guide, points.underarm, diagonalMm)];
}
