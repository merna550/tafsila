/**
 * Straight skirt block, one half (issue #129). Method: `docs/engine/drafting-method.md`, "Straight skirt, front and
 * back" (Aldrich, Metric Pattern Cutting for Women's Wear, Chapter 2, "Skirt block"); decision 129-skirt-block.
 */
import type { Dart, Edge, Measurements, Point, Segment } from "@tafsila/schemas";
import {
  SKIRT_DART_LENGTH_MM,
  SKIRT_DART_SHARE,
  SKIRT_HIP_EASE_QUARTER_MM,
  SKIRT_TRUING_MAX_STEPS,
  SKIRT_TRUING_TOLERANCE_MM,
  SKIRT_WAIST_EASE_QUARTER_MM,
} from "../../constants/skirt-block";
import { DraftingError } from "../../errors/drafting-error";
import {
  add,
  curveThroughPoints,
  lerp,
  lineSeg,
  normalize,
  pathLength,
  perpendicular,
  pt,
  scale,
  sub,
} from "../../geometry";
import type { ResolvedDraftInputs, StyleEaseMm } from "../../resolve/types";
import { type SkirtHalf, skirtEdges } from "./edges";

export type { SkirtHalf } from "./edges";

/** Quarter of a circumference. */
const QUARTER = 4;

/** The resolved inputs the skirt block reads. Style ease may be negative (the total never is, #126). */
export type SkirtDraftInputs = Pick<ResolvedDraftInputs, "hipDepthMm" | "skirtLengthMm"> & {
  /** Style ease over the block's built-in ease, whole circumference. */
  readonly styleEaseMm: Pick<StyleEaseMm, "skirtHip" | "skirtWaist">;
};

/** Arguments of {@link draftSkirtHalf}. */
export interface SkirtHalfArgs {
  /** Front or back. */
  readonly half: SkirtHalf;
  /** Body measurements in mm (only `hip` and `waist` are read). */
  readonly measurements: Pick<Measurements, "hip" | "waist">;
  /** Resolved inputs. */
  readonly inputs: SkirtDraftInputs;
  /** True when the centre back is a seam (zip); ignored for the front. */
  readonly centreSeam?: boolean;
}

/** One drafted skirt half, before the finishing step. */
export interface SkirtHalfDraft {
  /** Closed stitch path: waist, side curve, side line, hem, centre (see `SKIRT_SEGMENT`). */
  readonly stitchPath: Segment[];
  /** Key points named as in the reference drafts, e.g. `skirt.front.hipSide`. */
  readonly keyPoints: Readonly<Record<string, Point>>;
  /** The waist dart, or none when the hip is not wider than the waist. */
  readonly darts: Dart[];
  /** Named edges. */
  readonly edges: Edge[];
}

/** Widths of one half on its waist and hip lines, in mm, before the side seams are trued. */
interface HalfWidths {
  /** Hip side x, built-in ease plus the style ease. */
  readonly hipXMm: number;
  /** Waist side x, built-in ease plus the style ease. */
  readonly waistSideXMm: number;
  /** Dart width at the waist (0 when there is no shaping). */
  readonly dartMm: number;
}

/**
 * Widths of a half: the block at its built-in ease (method steps 2–3), then the style ease added at the side seam
 * so the ease is counted once (decision 129-skirt-block, 1). A non-positive shaping gives no dart, never a negative one.
 *
 * @param half - Front or back.
 * @param measurements - Hip and waist in mm.
 * @param style - Style ease, whole circumference.
 * @returns Hip side x, waist side x and dart width.
 */
function halfWidths(
  half: SkirtHalf,
  measurements: Pick<Measurements, "hip" | "waist">,
  style: SkirtDraftInputs["styleEaseMm"],
): HalfWidths {
  const builtInHipXMm = measurements.hip / QUARTER + SKIRT_HIP_EASE_QUARTER_MM;
  const builtInWaistQMm = measurements.waist / QUARTER + SKIRT_WAIST_EASE_QUARTER_MM;
  const shapingMm = builtInHipXMm - builtInWaistQMm;
  const dartMm = Math.max(0, shapingMm * SKIRT_DART_SHARE[half]);
  const builtInWaistSideXMm = builtInHipXMm - (shapingMm - dartMm);
  return {
    hipXMm: builtInHipXMm + style.skirtHip / QUARTER,
    waistSideXMm: builtInWaistSideXMm + style.skirtWaist / QUARTER,
    dartMm,
  };
}

/**
 * Side seam from the waist side point to the hem: one curve through the hip side point (vertical there), then a line.
 *
 * @param waistSide - Waist side point.
 * @param hipSide - Hip side point.
 * @param hemSide - Hem side point.
 * @returns The two side segments, waist to hem.
 */
function sideSeam(waistSide: Point, hipSide: Point, hemSide: Point): Segment[] {
  const [curve] = curveThroughPoints([waistSide, hipSide], sub(hipSide, waistSide), pt(0, 1));
  return [curve!, lineSeg(hipSide, hemSide)];
}

/**
 * Side seam length, waist to hem, with the waist side point moved down by `dropMm` (negative moves it up).
 *
 * @param widths - Widths of the half.
 * @param dropMm - Vertical move of the waist side point.
 * @param hipDepthMm - Waist to hip line.
 * @param skirtLengthMm - Waist to hem.
 * @returns Side seam length in mm.
 */
function sideLengthMm(widths: HalfWidths, dropMm: number, hipDepthMm: number, skirtLengthMm: number): number {
  const hipSide = pt(widths.hipXMm, hipDepthMm);
  return pathLength(sideSeam(pt(widths.waistSideXMm, dropMm), hipSide, pt(widths.hipXMm, skirtLengthMm)));
}

/**
 * How far the front waist side point moves down (and the back one up) so both side seams have the same length
 * (decision 129-skirt-block, 5). Fixed-point iteration: each step closes half the remaining difference.
 *
 * @param front - Front widths.
 * @param back - Back widths.
 * @param hipDepthMm - Waist to hip line.
 * @param skirtLengthMm - Waist to hem.
 * @returns The move in mm (0 when the seams are already equal).
 */
function truingDropMm(
  front: HalfWidths,
  back: HalfWidths,
  hipDepthMm: number,
  skirtLengthMm: number,
): number {
  let dropMm = 0;
  for (let i = 0; i < SKIRT_TRUING_MAX_STEPS; i += 1) {
    const gapMm =
      sideLengthMm(front, dropMm, hipDepthMm, skirtLengthMm) -
      sideLengthMm(back, -dropMm, hipDepthMm, skirtLengthMm);
    if (Math.abs(gapMm) <= SKIRT_TRUING_TOLERANCE_MM) break;
    dropMm += gapMm / 2;
  }
  return dropMm;
}

/**
 * The waist dart, centred half way across the waist line, its apex square to the waist so both legs are equal (method step 4).
 *
 * @param half - Front or back.
 * @param waistSide - Waist side point (the waist runs from (0, 0) to it).
 * @param dartMm - Dart width.
 * @returns The dart, or none for a zero width.
 */
function waistDart(half: SkirtHalf, waistSide: Point, dartMm: number): Dart[] {
  if (dartMm <= 0) return [];
  const centre = lerp(pt(0, 0), waistSide, 1 / 2);
  const along = normalize(waistSide);
  const legs: [Point, Point] = [sub(centre, scale(along, dartMm / 2)), add(centre, scale(along, dartMm / 2))];
  const apex = add(centre, scale(perpendicular(along), SKIRT_DART_LENGTH_MM[half]));
  return [{ id: "waist-dart", edgeId: "waist", apex, legs }];
}

/**
 * Drafts one half of the straight skirt block on the method's frame: x from the centre line, y down from the waist.
 *
 * Front and back side seams are trued to equal length by moving each waist side point half the difference along the
 * centre line (front down, back up), so FR-VAL-01 holds for every body (decision 129-skirt-block, 5).
 *
 * @param args - Half, measurements, resolved inputs and the centre-back option.
 * @returns Stitch path, key points, dart and edges.
 * @throws {DraftingError} `SKIRT_LENGTH_MISSING` without a resolved length, `SKIRT_SHORTER_THAN_HIP_DEPTH` when the hem is not below the hip line.
 */
export function draftSkirtHalf(args: SkirtHalfArgs): SkirtHalfDraft {
  const { half, measurements, inputs } = args;
  const { hipDepthMm, skirtLengthMm } = inputs;
  if (skirtLengthMm === undefined) {
    throw new DraftingError("SKIRT_LENGTH_MISSING", "The straight skirt block needs a resolved skirt length");
  }
  if (skirtLengthMm <= hipDepthMm) {
    throw new DraftingError(
      "SKIRT_SHORTER_THAN_HIP_DEPTH",
      `Skirt length ${skirtLengthMm} mm must be longer than the hip depth ${hipDepthMm} mm`,
    );
  }
  const front = halfWidths("front", measurements, inputs.styleEaseMm);
  const back = halfWidths("back", measurements, inputs.styleEaseMm);
  const trueMm = truingDropMm(front, back, hipDepthMm, skirtLengthMm);
  const w = half === "front" ? front : back;
  const waistCentre = pt(0, 0);
  const waistSide = pt(w.waistSideXMm, half === "front" ? trueMm : -trueMm);
  const hipCentre = pt(0, hipDepthMm);
  const hipSide = pt(w.hipXMm, hipDepthMm);
  const hemCentre = pt(0, skirtLengthMm);
  const hemSide = pt(w.hipXMm, skirtLengthMm);
  const darts = waistDart(half, waistSide, w.dartMm);
  const k = `skirt.${half}`;
  const dartPoints = darts[0]
    ? {
        [`${k}.dartLeft`]: darts[0].legs[0],
        [`${k}.dartRight`]: darts[0].legs[1],
        [`${k}.dartApex`]: darts[0].apex,
      }
    : {};
  return {
    stitchPath: [
      lineSeg(waistCentre, waistSide),
      ...sideSeam(waistSide, hipSide, hemSide),
      lineSeg(hemSide, hemCentre),
      lineSeg(hemCentre, waistCentre),
    ],
    keyPoints: {
      [`${k}.waistCentre`]: waistCentre,
      [`${k}.waistSide`]: waistSide,
      ...dartPoints,
      [`${k}.hipCentre`]: hipCentre,
      [`${k}.hipSide`]: hipSide,
      [`${k}.hemCentre`]: hemCentre,
      [`${k}.hemSide`]: hemSide,
    },
    darts,
    edges: skirtEdges(half, half === "back" && (args.centreSeam ?? false)),
  };
}
