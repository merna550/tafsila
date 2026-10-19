/**
 * The neckline curve of each catalogue style (issue #139, FR-PAT-05). Every curve runs from the centre line to the
 * neck point and meets the shoulder at a right angle, so the front and back necks join smoothly once the shoulder
 * seam is sewn (decision 139, 3). Aldrich 6th ed., ch. 4, necklines.
 */
import type { DesignSpec, Point, Segment } from "@tafsila/schemas";
import {
  NECK_RISE_HANDLE_SHARE,
  ROUND_NECK_CENTRE_HANDLE_SHARE,
  ROUND_NECK_DEEP_HANDLE_SHARE,
  ROUND_NECK_DEEP_RATIO,
  ROUND_NECK_SHALLOW_HANDLE_SHARE,
  ROUND_NECK_SHALLOW_RATIO,
  SWEETHEART_LOBE_RADIUS_MM,
  SWEETHEART_LOBE_X_SHARE,
  SWEETHEART_MIN_TURN_RADIUS_MM,
  SWEETHEART_STRAP_RADIUS_MM,
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
 * Share of the depth the shoulder handle reaches down: long for a shallow wide neck (so the turn into the shoulder is
 * spread out), short for a deep narrow one (so the bottom of the scoop stays round), linear in between.
 *
 * @param widthMm - Neck width from the centre line.
 * @param depthMm - Neck depth below the neck point.
 * @returns The share.
 */
function shoulderHandleShare(widthMm: number, depthMm: number): number {
  const span = ROUND_NECK_DEEP_RATIO - ROUND_NECK_SHALLOW_RATIO;
  const f = Math.min(Math.max((depthMm / widthMm - ROUND_NECK_SHALLOW_RATIO) / span, 0), 1);
  return (
    ROUND_NECK_SHALLOW_HANDLE_SHARE + (ROUND_NECK_DEEP_HANDLE_SHARE - ROUND_NECK_SHALLOW_HANDLE_SHARE) * f
  );
}

/**
 * Round, high-round and boat necks: square to the centre line and to the shoulder, like a quarter ellipse whose
 * handles adapt to the neck's proportions, so the tightest bend stays larger than the 10 mm neck allowance from a
 * shallow boat neck to a deep scoop (decision 139, 3).
 *
 * @param frame - The half's neck frame.
 * @returns One cubic.
 */
function roundNeck(frame: NeckFrame): Segment[] {
  const square = squareToShoulder(frame.shoulderDir);
  const widthMm = frame.neckPoint.x - frame.centre.x;
  const depthMm = frame.centre.y - frame.neckPoint.y;
  const c2 = sub(
    frame.neckPoint,
    scale(square, (depthMm * shoulderHandleShare(widthMm, depthMm)) / -square.y),
  );
  const c1 = pt(frame.centre.x + widthMm * ROUND_NECK_CENTRE_HANDLE_SHARE, frame.centre.y);
  return [cubicSeg(frame.centre, c1, c2, frame.neckPoint)];
}

/**
 * V neck: straight from the centre toward the last handle (the first handle lies on that line, so the curve turns one
 * way only and the facing never meets an S-bend), turning square to the shoulder at the top.
 *
 * @param frame - The half's neck frame.
 * @returns One cubic.
 */
function vNeck(frame: NeckFrame): Segment[] {
  const chordMm = distance(frame.centre, frame.neckPoint);
  const c2 = shoulderHandle(frame, chordMm * V_NECK_CHORD_HANDLE_SHARE);
  const c1 = lerp(frame.centre, c2, V_NECK_CHORD_HANDLE_SHARE);
  return [cubicSeg(frame.centre, c1, c2, frame.neckPoint)];
}

/**
 * Square neck: level from the centre to the corner, then straight up (the corner sits under the last handle, so the
 * side does not bow) and into the neck point, square to the shoulder.
 *
 * @param frame - The half's neck frame.
 * @returns A line and a cubic.
 */
function squareNeck(frame: NeckFrame): Segment[] {
  const handleMm = (frame.centre.y - frame.neckPoint.y) * NECK_RISE_HANDLE_SHARE;
  const top = shoulderHandle(frame, handleMm);
  const corner = pt(top.x, frame.centre.y);
  return [
    lineSeg(frame.centre, corner),
    cubicSeg(corner, add(corner, pt(0, -handleMm)), top, frame.neckPoint),
  ];
}

/** A circular arc between two points on its circle. */
interface ArcSpan {
  /** Circle centre. */
  readonly center: Point;
  /** Radius. */
  readonly radiusMm: number;
  /** Start point on the circle. */
  readonly from: Point;
  /** End point on the circle. */
  readonly to: Point;
  /** End angle, on the side of the start angle the arc sweeps to. */
  readonly toRad: number;
}

/**
 * A circular arc as cubics whose first and last points are exactly `from` and `to` (no rounding drift at the joins).
 *
 * @param span - The arc.
 * @returns The cubics.
 */
function snappedArc(span: ArcSpan): Segment[] {
  const { center, radiusMm, from, to, toRad } = span;
  const arc = arcToCubics({
    center,
    radiusMm,
    fromRad: Math.atan2(from.y - center.y, from.x - center.x),
    toRad,
  });
  return arc.map((seg, i) =>
    cubicSeg(i === 0 ? from : seg.from, seg.c1, seg.c2, i === arc.length - 1 ? to : seg.to),
  );
}

/**
 * Sweetheart neck: a circular arc from the centre dip up over the lobe (level at its top), a quarter circle turning
 * up the strap, a straight strap and a circular arc into the neck point, square to the shoulder. Both arcs bend away from the facing with radii larger
 * than the facing width plus its allowance, so the facing's outer edge never loops; the quarter circle bends the other
 * way with a radius of at least `SWEETHEART_MIN_TURN_RADIUS_MM`, larger than the neck allowance (decision 139, 3).
 *
 * @param frame - The half's neck frame.
 * @returns The neck segments, centre first.
 */
function sweetheartNeck(frame: NeckFrame): Segment[] {
  const strapRadiusMm = SWEETHEART_STRAP_RADIUS_MM;
  const strapCentre = add(frame.neckPoint, scale(frame.shoulderDir, strapRadiusMm));
  const top = pt(strapCentre.x - strapRadiusMm, strapCentre.y);
  const runMm = Math.min(
    (frame.neckPoint.x - frame.centre.x) * SWEETHEART_LOBE_X_SHARE,
    top.x - frame.centre.x - SWEETHEART_MIN_TURN_RADIUS_MM,
  );
  const lobeRadiusMm = SWEETHEART_LOBE_RADIUS_MM;
  const lobe = pt(
    frame.centre.x + runMm,
    frame.centre.y - (lobeRadiusMm - Math.sqrt(lobeRadiusMm * lobeRadiusMm - runMm * runMm)),
  );
  const turnRadiusMm = top.x - lobe.x;
  const turned = pt(top.x, lobe.y - turnRadiusMm);
  const endRad = Math.atan2(frame.neckPoint.y - strapCentre.y, frame.neckPoint.x - strapCentre.x);
  return [
    ...snappedArc({
      center: pt(lobe.x, lobe.y + lobeRadiusMm),
      radiusMm: lobeRadiusMm,
      from: frame.centre,
      to: lobe,
      toRad: -Math.PI / 2,
    }),
    ...snappedArc({ center: pt(lobe.x, turned.y), radiusMm: turnRadiusMm, from: lobe, to: turned, toRad: 0 }),
    lineSeg(turned, top),
    ...snappedArc({
      center: strapCentre,
      radiusMm: strapRadiusMm,
      from: top,
      to: frame.neckPoint,
      toRad: endRad < 0 ? endRad + 2 * Math.PI : endRad,
    }),
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
