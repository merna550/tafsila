/**
 * Neck depth and width for a design (issue #139, decision 139, 1-2): the style constants, the optional
 * `depthFrontMm` override and the limits that keep the neck inside the bodice.
 */
import type { DesignSpec } from "@tafsila/schemas";
import {
  BACK_NECKLINE_SIZES,
  BACK_NECK_DEPTH_MIN_MM,
  FRONT_NECKLINE_SIZES,
  FRONT_NECK_DEPTH_MIN_MM,
  NECK_CLEARANCE_ABOVE_SCYE_MM,
  SQUARE_MIN_DEPTH_MM,
  SWEETHEART_MIN_DEPTH_MM,
} from "../../constants/neckline";

/** The neckline part of a design. */
export type NecklineSpec = NonNullable<DesignSpec["neckline"]>;

/** One half of the bodice. */
export type NeckHalf = "front" | "back";

/** The block measures the resolution needs, in mm. */
export interface NeckBlockSizes {
  /** Block neck depth at the centre line below the HPS level, per half. */
  readonly blockDepthMm: Readonly<Record<NeckHalf, number>>;
  /** Depth of the armscye line at the centre line below the HPS level, per half. */
  readonly scyeDepthMm: Readonly<Record<NeckHalf, number>>;
  /** How far the neck point drops per mm it moves out along the shoulder, per half. */
  readonly dropPerWidenMm: Readonly<Record<NeckHalf, number>>;
  /** Largest widening that keeps `NECK_MIN_SHOULDER_LEFT_MM` of shoulder on every piece holding the neck. */
  readonly maxWidenMm: number;
}

/** A value that may have been held inside its limits. */
export interface Clamped {
  /** What the style or the override asked for. */
  readonly requestedMm: number;
  /** What is drafted. */
  readonly valueMm: number;
  /** Shallowest or narrowest value allowed. */
  readonly minMm: number;
  /** Deepest or widest value allowed. */
  readonly maxMm: number;
  /** Whether `valueMm` differs from `requestedMm`. */
  readonly clamped: boolean;
}

/** The resolved neck of both halves. */
export interface NeckResolution {
  /** Neck depth at the centre line below the (moved) neck point, per half. */
  readonly depth: Readonly<Record<NeckHalf, Clamped>>;
  /** How far both neck points move out along the shoulder (shared, so the shoulder seams still match). */
  readonly widen: Clamped;
}

/**
 * Holds a value inside [min, max].
 *
 * @param requestedMm - Wanted value.
 * @param minMm - Lower limit.
 * @param maxMm - Upper limit.
 * @returns The clamped value and whether it moved.
 */
export function clampMm(requestedMm: number, minMm: number, maxMm: number): Clamped {
  const valueMm = Math.min(Math.max(requestedMm, minMm), maxMm);
  return { requestedMm, valueMm, minMm, maxMm, clamped: valueMm !== requestedMm };
}

/**
 * Deepest neck allowed on a half, below the moved neck point: `NECK_CLEARANCE_ABOVE_SCYE_MM` above the armscye line.
 *
 * @param sizes - Block sizes.
 * @param half - Front or back.
 * @param widenMm - Resolved widening.
 * @returns Depth in mm.
 */
export function maxNeckDepthMm(sizes: NeckBlockSizes, half: NeckHalf, widenMm: number): number {
  return sizes.scyeDepthMm[half] - widenMm * sizes.dropPerWidenMm[half] - NECK_CLEARANCE_ABOVE_SCYE_MM;
}

/**
 * Shallowest front depth for a style: the sweetheart needs room for its lobe below the strap, the square for its turn
 * into the shoulder.
 *
 * @param style - Front style.
 * @returns Depth in mm.
 */
export function frontMinDepthMm(style: NecklineSpec["front"]): number {
  if (style === "sweetheart") return SWEETHEART_MIN_DEPTH_MM;
  return style === "square" ? SQUARE_MIN_DEPTH_MM : FRONT_NECK_DEPTH_MIN_MM;
}

/**
 * Resolves both neck depths and the shared widening. The widening is the larger of the two styles' (the back follows
 * a wide front), held so each shoulder keeps `NECK_MIN_SHOULDER_LEFT_MM`. Depths are measured down the centre line
 * from the level of the moved neck point: the front depth is `depthFrontMm` when given, else the block depth plus the
 * style's `depthAddMm`; both are clamped to [minimum, scye − clearance] (decision 139, 1-2).
 *
 * @param neckline - The design's neckline.
 * @param sizes - Block sizes.
 * @returns The resolution.
 */
export function resolveNeck(neckline: NecklineSpec, sizes: NeckBlockSizes): NeckResolution {
  const front = FRONT_NECKLINE_SIZES[neckline.front];
  const back = BACK_NECKLINE_SIZES[neckline.back];
  const frontRequested = neckline.depthFrontMm ?? sizes.blockDepthMm.front + front.depthAddMm;
  const widen = clampMm(Math.max(front.widenMm, back.widenMm), Number.NEGATIVE_INFINITY, sizes.maxWidenMm);
  return {
    depth: {
      front: clampMm(
        frontRequested,
        frontMinDepthMm(neckline.front),
        maxNeckDepthMm(sizes, "front", widen.valueMm),
      ),
      back: clampMm(
        sizes.blockDepthMm.back + back.depthAddMm,
        BACK_NECK_DEPTH_MIN_MM,
        maxNeckDepthMm(sizes, "back", widen.valueMm),
      ),
    },
    widen,
  };
}
