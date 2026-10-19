/**
 * Neckline and facing constants (issue #139, decision 139). Depths are measured down the centre line from the
 * HPS level (the block neck point); widths along the shoulder line from the block neck point. All in mm.
 * Source: Aldrich 6th ed., ch. 4 (necklines and facings), tuned on the reference drafts; pending sew-test.
 */

/** How one neckline style changes the block neck: extra depth at the centre and extra width at the shoulder. */
export interface NecklineStyleSize {
  /** Added to the block neck depth at the centre line (negative raises the neck). */
  readonly depthAddMm: number;
  /** Distance the neck point moves out along the shoulder line (negative moves it in, toward the neck). */
  readonly widenMm: number;
}

/** Front neckline styles: block depth plus `depthAddMm`, neck point moved `widenMm` along the shoulder. */
export const FRONT_NECKLINE_SIZES = {
  /** The block neck itself. */
  round: { depthAddMm: 0, widenMm: 0 },
  /** Hugs the base of the neck: 20 mm higher and 5 mm narrower than the block. */
  "high-round": { depthAddMm: -20, widenMm: -5 },
  /** About 180 mm below the neck point on a size M (Aldrich: V neck lowered 100 to 120 mm). */
  v: { depthAddMm: 100, widenMm: 10 },
  /** Lowered 70 mm and widened 30 mm so the corner sits inside the bust width. */
  square: { depthAddMm: 70, widenMm: 30 },
  /** Lowered 90 mm at the centre dip, widened 25 mm. */
  sweetheart: { depthAddMm: 90, widenMm: 25 },
  /** Shallow and wide: 30 mm higher at the centre, 40 mm wider at the shoulder. */
  boat: { depthAddMm: -30, widenMm: 40 },
} as const satisfies Record<string, NecklineStyleSize>;

/** Back neckline styles, same meaning as the front table. The back block neck is `BACK_NECK_RISE_MM` deep. */
export const BACK_NECKLINE_SIZES = {
  /** The block neck itself. */
  round: { depthAddMm: 0, widenMm: 0 },
  /** As deep as the block (already close to the neck at the back) and 5 mm narrower. */
  "high-round": { depthAddMm: 0, widenMm: -5 },
  /** Back V lowered 130 mm (about 150 mm below the HPS). */
  v: { depthAddMm: 130, widenMm: 10 },
  /** Lowered 80 mm and widened 30 mm. */
  square: { depthAddMm: 80, widenMm: 30 },
} as const satisfies Record<string, NecklineStyleSize>;

/** Shallowest front neck allowed for a `depthFrontMm` override (below this the neck chokes). */
export const FRONT_NECK_DEPTH_MIN_MM = 40;

/** Shallowest back neck allowed. */
export const BACK_NECK_DEPTH_MIN_MM = 10;

/** The neck must stay this far above the armscye line (the bust body line and the bust dart start below it) and the bust point. */
export const NECK_CLEARANCE_ABOVE_SCYE_MM = 30;

/** Shortest shoulder left on each piece holding the neck once the neck is widened (keeps a sewable seam). */
export const NECK_MIN_SHOULDER_LEFT_MM = 15;

/** Facing width from the neck seam (FR-PAT-07; Aldrich: 50 to 75 mm). */
export const FACING_WIDTH_MM = 60;

/** Shortest shoulder seam left beyond the facing edge, so the facing never reaches the shoulder tip. */
export const FACING_SHOULDER_CLEARANCE_MM = 10;

/** x of the facing grain line from the fold. */
export const FACING_GRAIN_FROM_FOLD_MM = 20;

/** Grain line ends kept this far inside the facing band. */
export const FACING_GRAIN_INSET_MM = 10;

/** The grain line inset never takes more than this share of the band height. */
export const FACING_GRAIN_MAX_INSET_SHARE = 0.25;

/** Below this distance from the fold, the facing's outer edge is taken to start on it. */
export const FACING_ON_FOLD_EPSILON_MM = 0.01;

/** Round necks: centre handle as a share of the neck width. */
export const ROUND_NECK_CENTRE_HANDLE_SHARE = 0.7;

/** Round necks: shoulder handle as a share of the depth for a shallow neck (depth / width at or below the ratio). */
export const ROUND_NECK_SHALLOW_HANDLE_SHARE = 0.9;

/** Depth / width at or below which a round neck counts as shallow. */
export const ROUND_NECK_SHALLOW_RATIO = 0.3;

/** Round necks: shoulder handle as a share of the depth for a deep neck (depth / width at or above the ratio). */
export const ROUND_NECK_DEEP_HANDLE_SHARE = 0.55;

/** Depth / width at or above which a round neck counts as deep. */
export const ROUND_NECK_DEEP_RATIO = 1;

/** V neck: the first handle lies on the chord, this share of it, so the neck runs straight from the centre. */
export const V_NECK_CHORD_HANDLE_SHARE = 0.33;

/** Square and sweetheart necks: handle length as a share of the rise from the corner or lobe to the neck point. */
export const NECK_RISE_HANDLE_SHARE = 0.4;

/** Sweetheart: the lobe sits at this share of the neck point's distance from the centre line. */
export const SWEETHEART_LOBE_X_SHARE = 0.6;

/**
 * Sweetheart: radius of the arc from the centre dip to the lobe top. It must exceed the facing width plus the facing's
 * seam allowance, or the facing's outer edge would loop: 110 mm leaves a 50 mm curve on the facing edge.
 */
export const SWEETHEART_LOBE_RADIUS_MM = 110;

/** Sweetheart: smallest radius where the lobe turns up the strap (more than the 10 mm neck allowance). */
export const SWEETHEART_MIN_TURN_RADIUS_MM = 25;

/**
 * Sweetheart: radius of the arc that brings the strap square to the shoulder at the neck point; like the lobe radius
 * it leaves room for the facing width and its allowance (100 mm leaves a 40 mm curve on the facing edge).
 */
export const SWEETHEART_STRAP_RADIUS_MM = 100;

/** Sweetheart: shallowest front depth below the neck point, so the lobe sits below the strap arc. */
export const SWEETHEART_MIN_DEPTH_MM = 120;

/**
 * Square: shallowest front depth below the neck point. The side turns into the shoulder over its last handle; on a
 * shallower square that bend gets tighter than the facing width and the facing's outer edge would loop.
 */
export const SQUARE_MIN_DEPTH_MM = 100;

/**
 * Head circumference as a multiple of the neck circumference (anthropometric average, about 560 / 360 mm), used to
 * check that a neck with no closure slips over the head (FR-VAL-08).
 */
export const HEAD_TO_NECK_RATIO = 1.55;
