/**
 * Sleeve style constants (issue #142, decision 142): the allowed type × length × cuff combinations and the shaping of
 * the puff, bishop, cap and flutter sleeves. All lengths in mm. Source: Aldrich 6th ed., ch. 2 (sleeve variations),
 * starting values pending sew-test.
 */
import type { DesignSpec } from "@tafsila/schemas";

/** The sleeve of a design. */
type Sleeve = NonNullable<DesignSpec["sleeve"]>;

/** Sleeve lengths, ordered short to long. */
const ALL_LENGTHS = ["cap", "short", "elbow", "three-quarter", "long"] as const;

/** Allowed cuffs per length of one sleeve type. */
export type SleeveLengthCuffs = Readonly<Partial<Record<Sleeve["length"], readonly Sleeve["cuff"][]>>>;

/**
 * Which lengths and cuffs each drafted sleeve type allows (decision 142, 1). A set-in sleeve takes a band from short
 * down; elastic stops at the elbow, as a straight wrist casing cannot pass the hand. A bishop sleeve is gathered into a
 * cuff, so it needs one. Cap and flutter sleeves end above the elbow and take no cuff.
 */
export const SLEEVE_COMBINATIONS: Readonly<Record<Exclude<Sleeve["type"], "none">, SleeveLengthCuffs>> = {
  "set-in": {
    cap: ["none"],
    short: ["none", "band", "elastic"],
    elbow: ["none", "band", "elastic"],
    "three-quarter": ["none", "band"],
    long: ["none", "band"],
  },
  cap: { cap: ["none"], short: ["none"] },
  puff: {
    cap: ["none", "band", "elastic"],
    short: ["none", "band", "elastic"],
    elbow: ["none", "band", "elastic"],
  },
  bishop: { "three-quarter": ["band", "elastic"], long: ["band", "elastic"] },
  flutter: { cap: ["none"], short: ["none"] },
};

/** Every sleeve length, for tests and tables. */
export const SLEEVE_LENGTHS: readonly Sleeve["length"][] = ALL_LENGTHS;

/**
 * Puff head: the cap between the balance notches is redrawn this many times its set-in length and gathered back
 * (Aldrich: slash and spread the head by half again for a soft puff).
 */
export const PUFF_CAP_GATHER_RATIO = 1.5;

/** Width of the raised puff head, as a share of the bicep width (the two top points sit ± half of it from the grain). */
export const PUFF_CAP_TOP_WIDTH_SHARE = 0.3;

/** Highest rise of the puff head above the set-in cap top the solver will try. */
export const PUFF_CAP_MAX_RISE_MM = 200;

/** Stop the puff rise search when the head is this close to its target length. */
export const PUFF_CAP_TOLERANCE_MM = 0.05;

/** Puff hem: the hem is spread to the cuff seam times this ratio and gathered back into the cuff. */
export const PUFF_HEM_GATHER_RATIO = 1.5;

/** Blouson length added below the hem of a puff sleeve with a cuff, so it puffs over the band. */
export const PUFF_HEM_DROP_MM = 20;

/** Blouson length added below the hem of a bishop sleeve, so the fullness falls over the cuff (Aldrich: 30 to 50). */
export const BISHOP_HEM_DROP_MM = 40;

/** Sweep of the flutter ruffle: a half circle. */
export const FLUTTER_SWEEP_RAD = Math.PI;

/** Depth of the flutter ruffle from the armhole seam to its hem, per length. */
export const FLUTTER_DEPTH_MM: Readonly<Record<"cap" | "short", number>> = { cap: 100, short: 150 };

/** The grain line of a cap sleeve or flutter stops this far from its seam and hem. */
export const PARTIAL_SLEEVE_GRAIN_INSET_MM = 15;
