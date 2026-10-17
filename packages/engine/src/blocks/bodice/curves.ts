/** Neck and armhole curves of the bodice block (issue #128, decision 128, 5). */
import type { Point } from "@tafsila/schemas";
import { add, curveThroughPoints, pt, scale, type CubicSegment } from "../../geometry";

/** 1 / sqrt(2): the unit step along a 45 degree diagonal. */
const DIAGONAL_UNIT = Math.SQRT1_2;

/**
 * Neckline from the centre line to the neck point: square to the centre line at the centre and square to the
 * shoulder at the neck point. Aldrich 6th ed., ch. 2, bodice block, back step 2 / front step 2
 * (docs/engine/drafting-method.md).
 *
 * @param centre - Neck point on the centre line (nape or centre front neck).
 * @param neckPoint - Neck point on the HPS level.
 * @param shoulderSlope - Drop per mm of shoulder run.
 * @returns One cubic, centre to neck point.
 */
export function neckCurve(centre: Point, neckPoint: Point, shoulderSlope: number): CubicSegment[] {
  return curveThroughPoints([centre, neckPoint], pt(1, 0), pt(shoulderSlope, -1));
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
 * Armhole from the shoulder tip through the width point and the guide point to the underarm: square to the
 * shoulder at the tip and square to the side seam at the underarm. Aldrich 6th ed., ch. 2, bodice block,
 * back steps 5-6 / front steps 4-5 (docs/engine/drafting-method.md); guide point per decision 128, 5.
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
  return curveThroughPoints(
    [points.tip, points.widthPoint, guide, points.underarm],
    pt(-shoulderSlope, 1),
    pt(1, 0),
  );
}
