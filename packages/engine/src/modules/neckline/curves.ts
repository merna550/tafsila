/**
 * The neckline curve of each catalogue style (issue #139, FR-PAT-05). Every curve runs from the centre line to the
 * neck point and meets the shoulder at a right angle, so the front and back necks join smoothly once the shoulder
 * seam is sewn (decision 139, 3). Aldrich 6th ed., ch. 4, necklines.
 */
import type { DesignSpec, Point, Segment } from "@tafsila/schemas";
import { neckCurve } from "../../blocks/bodice/curves";
import {
  NECK_RISE_HANDLE_SHARE,
  SQUARE_CORNER_X_SHARE,
  SWEETHEART_LOBE_RISE_MM,
  SWEETHEART_LOBE_X_SHARE,
  SWEETHEART_RISE_HANDLE_SHARE,
  SWEETHEART_STRAP_HANDLE_SHARE,
  V_NECK_CHORD_HANDLE_SHARE,
} from "../../constants/neckline";
import {
  add,
  arcToCubics,
  cubicSeg,
  distance,
  lerp,
  lineSeg,
  normalize,
  pt,
  scale,
  sub,
} from "../../geometry";

/** Any front or back neckline style. */
export type NecklineStyle =
  NonNullable<DesignSpec["neckline"]>["front"] | NonNullable<DesignSpec["neckline"]>["back"];

/** Where one half's neckline runs. */
export interface NeckFrame {
  /** Neck point on the centre line (centre front neck or nape). */
  readonly centre: Point;
  /** Neck point on the shoulder line. */
  readonly neckPoint: Point;
  /** Unit direction of the shoulder line, from the neck point to the shoulder tip. */
  readonly shoulderDir: Point;
}

/**
 * Direction of travel at the neck point: square to the shoulder, heading up and out (y grows downward).
 *
 * @param shoulderDir - Unit shoulder direction.
 * @returns Unit direction.
 */
export function squareToShoulder(shoulderDir: Point): Point {
  return normalize(pt(shoulderDir.y, -shoulderDir.x));
}

/**
 * Last handle of a curve that ends at the neck point square to the shoulder.
 *
 * @param frame - The half's neck frame.
 * @param handleMm - Handle length.
 * @returns The control point.
 */
function shoulderHandle(frame: NeckFrame, handleMm: number): Point {
  return sub(frame.neckPoint, scale(squareToShoulder(frame.shoulderDir), handleMm));
}

/**
 * Round, high-round and boat necks: the block neck curve (square to the centre line and to the shoulder),
 * redrawn between the new centre and neck points.
 *
 * @param frame - The half's neck frame.
 * @returns One cubic.
 */
function roundNeck(frame: NeckFrame): Segment[] {
  const slope = frame.shoulderDir.y / frame.shoulderDir.x;
  return neckCurve(frame.centre, frame.neckPoint, slope);
}

/**
 * V neck: straight from the centre (the first handle lies on the chord), turning square to the shoulder at the top.
 *
 * @param frame - The half's neck frame.
 * @returns One cubic.
 */
function vNeck(frame: NeckFrame): Segment[] {
  const chordMm = distance(frame.centre, frame.neckPoint);
  const c1 = lerp(frame.centre, frame.neckPoint, V_NECK_CHORD_HANDLE_SHARE);
  return [
    cubicSeg(frame.centre, c1, shoulderHandle(frame, chordMm * V_NECK_CHORD_HANDLE_SHARE), frame.neckPoint),
  ];
}

/**
 * Square neck: level from the centre to the corner, then up to the neck point, square to the shoulder there.
 *
 * @param frame - The half's neck frame.
 * @returns A line and a cubic.
 */
function squareNeck(frame: NeckFrame): Segment[] {
  const corner = pt(
    frame.centre.x + (frame.neckPoint.x - frame.centre.x) * SQUARE_CORNER_X_SHARE,
    frame.centre.y,
  );
  const handleMm = (corner.y - frame.neckPoint.y) * NECK_RISE_HANDLE_SHARE;
  return [
    lineSeg(frame.centre, corner),
    cubicSeg(corner, add(corner, pt(0, -handleMm)), shoulderHandle(frame, handleMm), frame.neckPoint),
  ];
}

/**
 * Sweetheart neck: a circular arc from the centre dip up over the lobe (level at its top; a true arc keeps the
 * facing's outer edge from looping), then up to the neck point, square to the shoulder.
 *
 * @param frame - The half's neck frame.
 * @returns The arc's cubics and one more cubic.
 */
function sweetheartNeck(frame: NeckFrame): Segment[] {
  const runMm = (frame.neckPoint.x - frame.centre.x) * SWEETHEART_LOBE_X_SHARE;
  const riseMm = SWEETHEART_LOBE_RISE_MM;
  const lobe = pt(frame.centre.x + runMm, frame.centre.y - riseMm);
  const radiusMm = (runMm * runMm + riseMm * riseMm) / (2 * riseMm);
  const center = pt(lobe.x, lobe.y + radiusMm);
  const arc = arcToCubics({
    center,
    radiusMm,
    fromRad: Math.atan2(frame.centre.y - center.y, frame.centre.x - center.x),
    toRad: -Math.PI / 2,
  });
  const bump = arc.map((seg, i) =>
    cubicSeg(i === 0 ? frame.centre : seg.from, seg.c1, seg.c2, i === arc.length - 1 ? lobe : seg.to),
  );
  const strapHandleMm = (frame.neckPoint.x - lobe.x) * SWEETHEART_STRAP_HANDLE_SHARE;
  const riseHandleMm = (lobe.y - frame.neckPoint.y) * SWEETHEART_RISE_HANDLE_SHARE;
  return [
    ...bump,
    cubicSeg(lobe, add(lobe, pt(strapHandleMm, 0)), shoulderHandle(frame, riseHandleMm), frame.neckPoint),
  ];
}

/** The curve builder of each style. */
const NECK_CURVES: Readonly<Record<NecklineStyle, (frame: NeckFrame) => Segment[]>> = {
  round: roundNeck,
  "high-round": roundNeck,
  boat: roundNeck,
  v: vNeck,
  square: squareNeck,
  sweetheart: sweetheartNeck,
};

/**
 * The neckline of one half for a style, centre line to neck point. Aldrich 6th ed., ch. 4 (decision 139, 3).
 *
 * @param style - Front or back neckline style.
 * @param frame - The half's neck frame.
 * @returns The neck segments, centre first.
 */
export function necklineCurve(style: NecklineStyle, frame: NeckFrame): Segment[] {
  return NECK_CURVES[style](frame);
}
