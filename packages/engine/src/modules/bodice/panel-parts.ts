/**
 * Parts shared by the front and back princess panels (issue #138, decision 138): where the style line leaves the
 * shoulder or the armhole, the side-panel cut and grain line, and the bust-level notch.
 */
import type { Notch, Piece, Point, Segment } from "@tafsila/schemas";
import {
  PRINCESS_ARMHOLE_MIN_LOWER_MM,
  PRINCESS_ARMHOLE_MIN_UPPER_MM,
  PRINCESS_ARMHOLE_SHARE,
  SIDE_PANEL_GRAIN_INSET_MM,
} from "../../constants/bodice-shaping";
import { add, lineSeg, normalize, pathLength, pt, scale, splitAtLength, sub } from "../../geometry";

/** Where the princess line starts: in the shoulder seam or in the armhole. */
export type PrincessVariant = "shoulder" | "armhole";

/** Id of the princess seam edge on every panel. */
export const STYLE_EDGE_ID = "style";

/** Id of the bust-level notch on both princess seam edges. */
export const BUST_NOTCH_ID = "princess-bust";

/** The top of one bodice half, cut by the start of the princess line. */
export interface PanelTops {
  /** Where the style line starts, on the shoulder or the armhole. */
  readonly start: Point;
  /** Centre panel: neck point to `start` (shoulder, then the upper armhole for the armhole variant). */
  readonly centre: readonly Segment[];
  /** Side panel: `start` to the underarm (the outer shoulder and the armhole, or the lower armhole). */
  readonly side: readonly Segment[];
  /** Segments of the centre panel's top that belong to the shoulder seam. */
  readonly centreShoulderSegments: number;
  /** Segments of the side panel's top that belong to the shoulder seam. */
  readonly sideShoulderSegments: number;
}

/** The shoulder line and armhole of one half, shoulder tip first. */
export interface HalfTop {
  /** Neck point (HPS). */
  readonly neckPoint: Point;
  /** Shoulder tip. */
  readonly tip: Point;
  /** Armhole, shoulder tip to underarm. */
  readonly armhole: readonly Segment[];
}

/**
 * Length of the upper armhole kept on the centre panel by an armhole princess line: a share of the armhole, but
 * never so much that the sleeve notches leave the side panel, and never less than a usable corner.
 *
 * @param armholeMm - Armhole length.
 * @returns Distance from the shoulder tip along the armhole, in mm.
 */
export function armholeSplitMm(armholeMm: number): number {
  const wanted = Math.min(armholeMm * PRINCESS_ARMHOLE_SHARE, armholeMm - PRINCESS_ARMHOLE_MIN_LOWER_MM);
  return Math.max(wanted, PRINCESS_ARMHOLE_MIN_UPPER_MM);
}

/**
 * Cuts the top of one half where the princess line starts. Shoulder variant: `shoulderStartMm` along the shoulder
 * from the neck point. Armhole variant: {@link armholeSplitMm} down the armhole from the shoulder tip.
 * Aldrich 6th ed., ch. 3, princess lines (decision 138, 2).
 *
 * @param top - Shoulder line and armhole.
 * @param variant - Shoulder or armhole princess line.
 * @param shoulderStartMm - For the shoulder variant: distance of the start from the neck point.
 * @returns The start point and the two tops.
 */
export function panelTops(top: HalfTop, variant: PrincessVariant, shoulderStartMm: number): PanelTops {
  if (variant === "shoulder") {
    const start = add(top.neckPoint, scale(normalize(sub(top.tip, top.neckPoint)), shoulderStartMm));
    return {
      start,
      centre: [lineSeg(top.neckPoint, start)],
      side: [lineSeg(start, top.tip), ...top.armhole],
      centreShoulderSegments: 1,
      sideShoulderSegments: 1,
    };
  }
  const [upper, lower] = splitAtLength(top.armhole, armholeSplitMm(pathLength(top.armhole)));
  return {
    start: upper.at(-1)!.to,
    centre: [lineSeg(top.neckPoint, top.tip), ...upper],
    side: lower,
    centreShoulderSegments: 1,
    sideShoulderSegments: 0,
  };
}

/**
 * Cut info of a side panel: a mirrored pair, no fold.
 *
 * @returns The cut info.
 */
export function sidePanelCut(): Piece["cut"] {
  return { quantity: 2, onFold: false, mirror: true, fabric: "main" };
}

/**
 * Grain line of a side panel: parallel to the centre line (the block's grain), half way across the panel's waist.
 *
 * @param waistXs - x of the two ends of the panel's waist.
 * @param topY - y of the highest point the grain line may reach (the underarm level).
 * @param waistY - y of the waist at the grain line.
 * @returns The two grain line ends.
 */
export function sidePanelGrain(
  waistXs: readonly [number, number],
  topY: number,
  waistY: number,
): [Point, Point] {
  const x = (waistXs[0] + waistXs[1]) / 2;
  return [pt(x, topY + SIDE_PANEL_GRAIN_INSET_MM), pt(x, waistY - SIDE_PANEL_GRAIN_INSET_MM)];
}

/**
 * The bust-level notch of a princess seam, paired with the same notch on the partner panel. Each panel places its
 * own at its own distance, so the notch rule (FR-VAL-04) measures the real difference.
 *
 * @param atMm - Distance from the start of this panel's style edge.
 * @param partnerId - The partner panel's id.
 * @returns The notch.
 */
export function bustNotch(atMm: number, partnerId: string): Notch {
  return {
    id: BUST_NOTCH_ID,
    edgeId: STYLE_EDGE_ID,
    atMm,
    pairsWith: { pieceId: partnerId, edgeId: STYLE_EDGE_ID, reversed: true },
  };
}
