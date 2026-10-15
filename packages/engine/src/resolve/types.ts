/** Output of the resolve step: the named inputs every block drafter reads (issue #126). */
import type { EaseProfile } from "@tafsila/schemas";
import type { BodiceFit } from "../constants/ease";

/** Style ease: the remainder over the ease already inside each block. May be negative; the total never is. */
export interface StyleEaseMm {
  /** Bodice bust, whole circumference. */
  bust: number;
  /** Bodice waist, whole circumference. */
  bodiceWaist: number;
  /** Skirt hip, whole circumference. */
  skirtHip: number;
  /** Skirt waist, whole circumference. */
  skirtWaist: number;
  /** Sleeve upper arm, whole circumference. */
  sleeveBicep: number;
  /** Back width, whole width. */
  acrossBack: number;
}

/** Total ease (built-in plus style) per body line, for the circumference check FR-VAL-03. */
export interface TotalEaseMm {
  /** Bust. */
  bust: number;
  /** Waist. */
  waist: number;
  /** Hip. */
  hip: number;
  /** Upper arm. */
  upperArm: number;
}

/** Everything a block drafter needs, in mm. Blocks never read a body circumference directly for a width. */
export interface ResolvedDraftInputs {
  /** Ease profile used. */
  easeProfile: EaseProfile;
  /** Bodice fit used (`semi-fitted` when the spec has no bodice). */
  bodiceFit: BodiceFit;
  /** Finished quarter bust width: (bust + total bust ease) / 4. */
  bustQuarterMm: number;
  /** Finished quarter bodice waist width. */
  bodiceWaistQuarterMm: number;
  /** Finished quarter hip width. */
  hipQuarterMm: number;
  /** Finished quarter skirt waist width: (waist + total waist ease) / 4. */
  skirtWaistQuarterMm: number;
  /** Finished half sleeve width at the upper arm: (upperArm + total upper arm ease) / 2. */
  sleeveBicepHalfMm: number;
  /** Finished half sleeve width at the wrist: (wrist + the block's fixed wrist ease) / 2. */
  sleeveWristHalfMm: number;
  /** Style ease on the whole back width. */
  acrossBackStyleEaseMm: number;
  /** Style ease per block line. */
  styleEaseMm: StyleEaseMm;
  /** Total ease per body line. */
  totalEaseMm: TotalEaseMm;
  /** Back length, nape to waist. */
  backLengthMm: number;
  /** Front length, shoulder to waist over the bust. */
  frontLengthMm: number;
  /** Waist to hip line. */
  hipDepthMm: number;
  /** Shoulder to wrist. */
  armLengthMm: number;
  /** Shoulder width. */
  shoulderWidthMm: number;
  /** Skirt length from the waist; undefined when the spec has no skirt. */
  skirtLengthMm: number | undefined;
}
