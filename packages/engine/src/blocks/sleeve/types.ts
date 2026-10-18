/** Types of the set-in sleeve block (issue #134). Lengths in mm, sleeve frame of docs/engine/drafting-method.md. */
import type { DesignSpec, Point } from "@tafsila/schemas";
import type { PieceDraft } from "../../pipeline/draft-context";
import type { BodiceArmholeParts } from "../bodice/armhole-parts";

/** A sleeve length option of the design. */
export type SleeveLength = NonNullable<DesignSpec["sleeve"]>["length"];

/** Everything `draftSleeve` reads: finished widths from resolve (#126), the arm length and the bodice armholes (#128). */
export interface SleeveInput {
  /** Finished half sleeve width at the upper arm. */
  readonly bicepHalfMm: number;
  /** Finished half sleeve width at the wrist. */
  readonly wristHalfMm: number;
  /** Shoulder to wrist. */
  readonly armLengthMm: number;
  /** Back armhole seam length of the bodice. */
  readonly armholeBackMm: number;
  /** Front armhole seam length of the bodice. */
  readonly armholeFrontMm: number;
  /** Sleeve length option. */
  readonly length: SleeveLength;
  /** The bodice pieces holding each armhole, shoulder tip first; the darted block's two pieces when left out (#138). */
  readonly armholes?: BodiceArmholeParts;
}

/** Names of the sleeve key points, as in `referenceDrafts` plus the points this block adds. */
export type SleeveKeyPoint =
  | "sleeve.capTop"
  | "sleeve.shoulderPoint"
  | "sleeve.underarmBack"
  | "sleeve.underarmFront"
  | "sleeve.elbowBack"
  | "sleeve.elbowFront"
  | "sleeve.hemBack"
  | "sleeve.hemFront"
  | "sleeve.wristBack"
  | "sleeve.wristFront"
  | "sleeve.wristCentre";

/** The drafted sleeve. */
export interface SleeveDraft {
  /** The sleeve piece (cut as a mirrored pair). */
  readonly piece: PieceDraft;
  /** Every key point by name. */
  readonly keyPoints: Readonly<Record<SleeveKeyPoint, Point>>;
  /** Solved cap height, cap top to the underarm line. */
  readonly capHeightMm: number;
  /** Cap length minus armhole length, per half and in total, as drafted. */
  readonly capEaseMm: { readonly back: number; readonly front: number; readonly total: number };
  /** y of the hem line. */
  readonly hemYMm: number;
}
