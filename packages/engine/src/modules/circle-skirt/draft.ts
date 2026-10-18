/**
 * Circle skirt quarter (issue #136). Method: `docs/engine/drafting-method.md`, "Circle skirts" (Aldrich, Metric
 * Pattern Cutting for Women's Wear, Chapter 3, "Flared and circular skirts"); decision 136-circle-skirts.
 *
 * The skirt is an annulus sector: waist arc of radius r, hem arc of radius r + length. One drafted piece is a quarter
 * of the skirt (centre line to side seam), so its sweep is the skirt's sweep / 4 and its waist arc is a quarter of
 * waist + ease. The radius comes from that arc, measured on the drawn curve, not from a closed formula.
 */
import type { Point, Segment } from "@tafsila/schemas";
import {
  CIRCLE_GRAIN_LINE_SHARE,
  CIRCLE_SKIRT_COPIES,
  CIRCLE_SKIRT_SWEEP_RAD,
  CIRCLE_WAIST_MAX_STEPS,
  CIRCLE_WAIST_TOLERANCE_MM,
  type CircleSkirtType,
} from "../../constants/circle-skirt";
import { arcToCubics, lineSeg, pathLength, pointOnCircle, pt, type CubicSegment } from "../../geometry";
import type { SkirtEdgeRuns } from "../../blocks/skirt/edges";

/** Standard angle of the centre line: straight down the sheet (y grows downwards). */
const CENTRE_ANGLE_RAD = Math.PI / 2;

/** Half of a length or an angle. */
const HALF = 0.5;

/** Arguments of {@link draftCircleQuarter}. */
export interface CircleQuarterArgs {
  /** Half or full circle. */
  readonly type: CircleSkirtType;
  /** Finished waist of the whole skirt (waist + total ease), in mm. */
  readonly finishedWaistMm: number;
  /** Skirt length from the waist, in mm. */
  readonly skirtLengthMm: number;
}

/** One drafted circle-skirt quarter, before the finishing step. */
export interface CircleQuarterDraft {
  /** Closed stitch path: waist arc, side line, hem arc, centre line. */
  readonly stitchPath: Segment[];
  /** Which segments each named edge covers. */
  readonly runs: SkirtEdgeRuns;
  /** Grain line, parallel to the centre line (straight grain at CF / CB). */
  readonly grainLine: [Point, Point];
  /** Key points: `circle.waistCentre`, `circle.waistSide`, `circle.hemSide`, `circle.hemCentre`, `circle.centre`. */
  readonly keyPoints: Readonly<Record<string, Point>>;
  /** Waist radius in mm. */
  readonly waistRadiusMm: number;
  /** Hem radius in mm (waist radius + skirt length). */
  readonly hemRadiusMm: number;
  /** Sweep of this piece in radians. */
  readonly sweepRad: number;
}

/**
 * The waist arc of a quarter for a given radius, centred so that the waist centre sits at (0, 0).
 *
 * @param radiusMm - Waist radius.
 * @param sweepRad - Sweep of the quarter.
 * @returns The cubics from the centre line to the side.
 */
function waistArc(radiusMm: number, sweepRad: number): CubicSegment[] {
  return arcToCubics({
    center: pt(0, -radiusMm),
    radiusMm,
    fromRad: CENTRE_ANGLE_RAD,
    toRad: CENTRE_ANGLE_RAD - sweepRad,
  });
}

/**
 * Solves the waist radius so the drawn waist arc has the target length (decision 136-circle-skirts, 1). Starts at
 * target / sweep (the exact circle) and corrects by the measured ratio for the small Bézier drift.
 *
 * @param targetMm - Waist arc length of one quarter.
 * @param sweepRad - Sweep of the quarter.
 * @returns The waist radius in mm.
 */
export function solveWaistRadiusMm(targetMm: number, sweepRad: number): number {
  let radiusMm = targetMm / sweepRad;
  for (let i = 0; i < CIRCLE_WAIST_MAX_STEPS; i += 1) {
    const measuredMm = pathLength(waistArc(radiusMm, sweepRad));
    if (Math.abs(measuredMm - targetMm) <= CIRCLE_WAIST_TOLERANCE_MM) break;
    radiusMm *= targetMm / measuredMm;
  }
  return radiusMm;
}

/**
 * Drafts one quarter of a half- or full-circle skirt on the skirt block's frame: x from the centre line, y down from
 * the waist centre. The circle centre is (0, −r); the side seam is the radius at the quarter's sweep.
 *
 * @param args - Type, finished waist and length.
 * @returns Stitch path, edge runs, grain line, key points and radii.
 */
export function draftCircleQuarter(args: CircleQuarterArgs): CircleQuarterDraft {
  const sweepRad = CIRCLE_SKIRT_SWEEP_RAD[args.type] / CIRCLE_SKIRT_COPIES;
  const waistRadiusMm = solveWaistRadiusMm(args.finishedWaistMm / CIRCLE_SKIRT_COPIES, sweepRad);
  const hemRadiusMm = waistRadiusMm + args.skirtLengthMm;
  const centre = pt(0, -waistRadiusMm);
  const waist = waistArc(waistRadiusMm, sweepRad);
  const hem = arcToCubics({
    center: centre,
    radiusMm: hemRadiusMm,
    fromRad: CENTRE_ANGLE_RAD - sweepRad,
    toRad: CENTRE_ANGLE_RAD,
  });
  const waistSide = waist.at(-1)!.to;
  const hemSide = hem[0]!.from;
  const hemCentre = hem.at(-1)!.to;
  const waistCentre = waist[0]!.from;
  const n = waist.length;
  const runs: SkirtEdgeRuns = {
    waist: [0, n - 1],
    side: [n, n],
    hem: [n + 1, n + hem.length],
    centre: [n + hem.length + 1, n + hem.length + 1],
  };
  const grainMid = pointOnCircle(
    centre,
    (waistRadiusMm + hemRadiusMm) * HALF,
    CENTRE_ANGLE_RAD - sweepRad * HALF,
  );
  const grainHalfMm = args.skirtLengthMm * CIRCLE_GRAIN_LINE_SHARE * HALF;
  return {
    stitchPath: [...waist, lineSeg(waistSide, hemSide), ...hem, lineSeg(hemCentre, waistCentre)],
    runs,
    grainLine: [pt(grainMid.x, grainMid.y - grainHalfMm), pt(grainMid.x, grainMid.y + grainHalfMm)],
    keyPoints: {
      "circle.centre": centre,
      "circle.waistCentre": waistCentre,
      "circle.waistSide": waistSide,
      "circle.hemSide": hemSide,
      "circle.hemCentre": hemCentre,
    },
    waistRadiusMm,
    hemRadiusMm,
    sweepRad,
  };
}
