/** Types of the bodice block (issue #128). Lengths in mm, frame of docs/engine/drafting-method.md. */
import type { Measurements, Point, Segment } from "@tafsila/schemas";
import type { PieceDraft } from "../../pipeline/draft-context";

/** Everything `draftBodice` reads: the body lengths it uses and the finished widths from resolve (#126). */
export interface BodiceInput extends Pick<
  Measurements,
  "neck" | "shoulderWidth" | "backLength" | "frontLength" | "bust" | "bustPointDistance" | "bustHeight"
> {
  /** Finished quarter bust width (bust + total ease) / 4. */
  readonly bustQuarterMm: number;
  /** Finished quarter bodice waist width. */
  readonly bodiceWaistQuarterMm: number;
  /** Style ease on the whole back width. */
  readonly acrossBackStyleEaseMm: number;
  /** Whether the design shapes the waist with darts (`bodice.shaping` other than `none`). */
  readonly waistDarts: boolean;
}

/** Names of the back key points, as in `referenceDrafts` (without the `bodice.back.` prefix). */
export type BackPointName =
  | "nape"
  | "neckPoint"
  | "shoulderTip"
  | "backWidthPoint"
  | "scyeLineCB"
  | "underarm"
  | "waistCB"
  | "sideWaist"
  | "waistDartLeft"
  | "waistDartRight"
  | "waistDartApex";

/** Names of the front key points, as in `referenceDrafts` (without the `bodice.front.` prefix). */
export type FrontPointName =
  | "neckPoint"
  | "neckCF"
  | "shoulderTip"
  | "chestWidthPoint"
  | "scyeLineCF"
  | "underarm"
  | "bustPoint"
  | "bustDartUpper"
  | "bustDartLower"
  | "bustDartApex"
  | "waistCF"
  | "sideWaist"
  | "waistDartLeft"
  | "waistDartRight"
  | "waistDartApex";

/** A key point name of the bodice, as in `referenceDrafts`. */
export type BodiceKeyPoint = `bodice.back.${BackPointName}` | `bodice.front.${FrontPointName}`;

/** Key points of the back half. */
export type BackPoints = Readonly<Record<BackPointName, Point>>;

/** Key points of the front half. */
export type FrontPoints = Readonly<Record<FrontPointName, Point>>;

/** Lengths derived from the input (drafting-method.md, "Missing lengths"), all in mm. */
export interface BodiceLengths {
  /** Neck width from the centre line. */
  readonly neckWidthMm: number;
  /** Front neck depth below the HPS level. */
  readonly frontNeckDepthMm: number;
  /** Horizontal shoulder run, neck point to SW / 2. */
  readonly shoulderRunMm: number;
  /** Front shoulder length along its slope. */
  readonly frontShoulderLengthMm: number;
  /** Back shoulder length: front length plus the back shoulder ease. */
  readonly backShoulderLengthMm: number;
  /** Armscye depth from the nape level. */
  readonly scyeDepthMm: number;
  /** y of the armscye line in the bodice frame. */
  readonly scyeYMm: number;
  /** Half the back width, with the across-back style ease. */
  readonly backWidthHalfMm: number;
  /** Half the chest width. */
  readonly chestWidthHalfMm: number;
  /** Bust dart opening at the side seam. */
  readonly bustDartMm: number;
  /** Waist dart width; 0 when dropped. */
  readonly waistDartMm: number;
  /** x of the side seam at the waist. */
  readonly sideWaistXMm: number;
  /** y of the back waist line. */
  readonly backWaistYMm: number;
}

/** The armhole of both halves, for the sleeve block (#134). */
export interface BodiceArmhole {
  /** Back armhole, shoulder tip to underarm. */
  readonly back: readonly Segment[];
  /** Front armhole, shoulder tip to underarm. */
  readonly front: readonly Segment[];
  /** Back armhole length. */
  readonly backLengthMm: number;
  /** Front armhole length. */
  readonly frontLengthMm: number;
}

/** The drafted bodice block. */
export interface BodiceDraft {
  /** Back half piece. */
  readonly back: PieceDraft;
  /** Front half piece. */
  readonly front: PieceDraft;
  /** Every key point, by reference name. */
  readonly keyPoints: Readonly<Record<BodiceKeyPoint, Point>>;
  /** The armholes and their lengths. */
  readonly armhole: BodiceArmhole;
  /** Armscye depth from the nape level. */
  readonly scyeDepthMm: number;
}
