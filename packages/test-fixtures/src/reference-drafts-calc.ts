/* eslint-disable no-magic-numbers -- this file is the drafting arithmetic of docs/engine/drafting-method.md, every constant is named and cited there */
/**
 * The one calculation behind the reference drafts (issue #122, `docs/engine/drafting-method.md`).
 *
 * It follows the metric made-to-measure blocks of Winifred Aldrich (see ADR-122a). The numbers in the
 * document tables and in `reference-drafts.ts` are produced by this file (`gen-reference-drafts.ts`), and a
 * test fails when `reference-drafts.ts` is out of date. It is NOT engine code: the engine is implemented
 * separately in M2 and asserted against the stored numbers.
 *
 * Frame: millimetres, x to the right, y down. Bodice blocks: x = 0 on the centre line, y = 0 on the
 * horizontal through the high point of shoulder (HPS). Skirt blocks: y = 0 on the waist line.
 * Sleeve: x = 0 on the grain line, y = 0 at the top of the cap.
 */
import type { Measurements, Point } from "@tafsila/schemas";

/** Ease and ratio constants of the method; each is explained in the "Constants" table of the document. */
export const DRAFT_CONSTANTS = {
  /** Bust ease per quarter (total 80 mm) built into the bodice block. */
  bustEaseQuarterMm: 20,
  /** Waist ease per quarter (total 40 mm) built into the bodice block. */
  bodiceWaistEaseQuarterMm: 10,
  /** Armscye depth from the nape level is bust / 8 plus this value (Aldrich size 12: 880 / 8 + 100 = 210). */
  scyeDepthBaseMm: 100,
  /** Share of the bust that adds to the armscye depth (one eighth, the slope of Aldrich's size chart). */
  scyeDepthBustShare: 1 / 8,
  /** Back width (whole) as a share of the bust (Aldrich size 12: 356 / 880). */
  backWidthRatio: 356 / 880,
  /** Chest width (whole) as a share of the bust (Aldrich size 12: 320 / 880). */
  chestWidthRatio: 320 / 880,
  /** Neck width is neck / 5 minus this value. */
  neckWidthDeductMm: 2,
  /** The nape sits this far below the HPS level at the back. */
  backNeckRiseMm: 20,
  /** Front neck depth is neck / 5 plus this value. */
  frontNeckDepthAddMm: 10,
  /** Back shoulder slope: drop per mm of horizontal shoulder run. */
  backShoulderSlope: 0.36,
  /** Front shoulder slope: drop per mm of horizontal shoulder run. */
  frontShoulderSlope: 0.4,
  /** Bust dart opening at the side seam as a share of the bust (Aldrich size 12: 25 / 880). */
  bustDartRatio: 25 / 880,
  /** Share of the bodice waist shaping taken by the waist dart (the rest goes to the side seam). */
  bodiceDartShare: 0.5,
  /** Distance from the underarm point to the upper leg of the bust dart, along the side seam. */
  bustDartBelowUnderarmMm: 20,
  /** The front waist dart ends this far below the bust point. */
  frontDartBelowBustMm: 25,
  /** Share of the armscye depth used as sleeve cap height. */
  sleeveCapHeightShare: 2 / 3,
  /** Sleeve ease at the upper arm line (total). */
  sleeveBicepEaseMm: 50,
  /** Sleeve ease at the wrist (total). */
  sleeveWristEaseMm: 30,
  /** Hip ease per quarter (total 40 mm) built into the skirt block. */
  hipEaseQuarterMm: 10,
  /** Waist ease per quarter (total 20 mm) built into the skirt block. */
  skirtWaistEaseQuarterMm: 5,
  /** Share of the skirt waist shaping taken by the front dart. */
  skirtFrontDartShare: 0.5,
  /** Share of the skirt waist shaping taken by the back dart. */
  skirtBackDartShare: 0.6,
  /** Front skirt dart length. */
  skirtFrontDartLengthMm: 90,
  /** Back skirt dart length. */
  skirtBackDartLengthMm: 140,
} as const;

/**
 * Rounds to 0.1 mm, the precision of the stored tables.
 *
 * @param value - Length in mm.
 * @returns The value rounded to one decimal.
 */
function r1(value: number): number {
  return Math.round(value * 10) / 10;
}

/**
 * Builds a point rounded to 0.1 mm.
 *
 * @param x - Horizontal position in mm.
 * @param y - Vertical position in mm.
 * @returns The rounded point.
 */
function p(x: number, y: number): Point {
  return { x: r1(x), y: r1(y) };
}

/** Lengths the method needs that the measurement set does not hold, derived with the cited ratios. */
export interface DerivedLengths {
  /** Armscye depth from the nape level. */
  scyeDepth: number;
  /** Back width (whole). */
  backWidth: number;
  /** Chest width (whole). */
  chestWidth: number;
  /** Neck width of the block, measured from the centre line. */
  neckWidth: number;
  /** Front neck depth below the HPS level. */
  frontNeckDepth: number;
  /** Back shoulder length along the slope, from neck point to shoulder tip. */
  backShoulderLength: number;
  /** Front shoulder length along the slope. */
  frontShoulderLength: number;
  /** Bust dart opening at the side seam. */
  bustDart: number;
  /** Bodice waist dart width, back. */
  backWaistDart: number;
  /** Bodice waist dart width, front. */
  frontWaistDart: number;
  /** Sleeve cap height. */
  sleeveCapHeight: number;
}

/** Key points of every block of one size, keyed by dotted name. */
export type BlockPoints = Readonly<Record<string, Point>>;

/** Result of the calculation for one size. */
export interface DraftResult {
  /** Derived lengths (informational, printed in the document). */
  derived: DerivedLengths;
  /** Key points of the back bodice. */
  bodiceBack: BlockPoints;
  /** Key points of the front bodice. */
  bodiceFront: BlockPoints;
  /** Key points of the back straight skirt. */
  skirtBack: BlockPoints;
  /** Key points of the front straight skirt. */
  skirtFront: BlockPoints;
  /** Key points of the one-piece sleeve. */
  sleeve: BlockPoints;
}

const C = DRAFT_CONSTANTS;

/**
 * Linear interpolation of y on the segment a-b at the given x.
 *
 * @param a - First end of the segment.
 * @param b - Second end of the segment.
 * @param x - Horizontal position to read.
 * @returns The y of the segment at x.
 */
function yOnLine(a: Point, b: Point, x: number): number {
  return a.y + ((b.y - a.y) * (x - a.x)) / (b.x - a.x);
}

/**
 * Waist shaping shared by the bodice halves: how the difference between the bust and waist quarters is split.
 *
 * @param m - Measurements of the size.
 * @param centreFactor - Which half is drafted: the back centres its dart half way, the front under the bust point.
 * @returns Bust quarter, waist dart width, the x of the side seam at the waist and the x of the dart centre.
 */
function bodiceWaist(m: Measurements, centreFactor: "back" | "front") {
  const bustHalf = m.bust / 4 + C.bustEaseQuarterMm;
  const waistHalf = m.waist / 4 + C.bodiceWaistEaseQuarterMm;
  const shaping = bustHalf - waistHalf;
  const dart = shaping * C.bodiceDartShare;
  const sideX = bustHalf - (shaping - dart);
  const centreX = centreFactor === "back" ? sideX / 2 : m.bustPointDistance / 2;
  return { bustHalf, dart, sideX, centreX };
}

/**
 * Drafts the back bodice.
 *
 * @param m - Measurements of the size.
 * @param d - Unrounded derived lengths.
 * @returns Key points of the back bodice.
 */
function draftBodiceBack(m: Measurements, d: DerivedLengths): BlockPoints {
  const nape = p(0, C.backNeckRiseMm);
  const neckPoint = p(d.neckWidth, 0);
  const runMm = m.shoulderWidth / 2 - d.neckWidth;
  const tipY = C.backShoulderSlope * runMm;
  const underarmY = C.backNeckRiseMm + d.scyeDepth;
  const w = bodiceWaist(m, "back");
  const waistY = C.backNeckRiseMm + m.backLength;
  const apexY = (underarmY + waistY) / 2;
  return {
    "bodice.back.nape": nape,
    "bodice.back.neckPoint": neckPoint,
    "bodice.back.shoulderTip": p(m.shoulderWidth / 2, tipY),
    "bodice.back.backWidthPoint": p(d.backWidth / 2, tipY + (underarmY - tipY) / 3),
    "bodice.back.scyeLineCB": p(0, underarmY),
    "bodice.back.underarm": p(w.bustHalf, underarmY),
    "bodice.back.waistCB": p(0, waistY),
    "bodice.back.sideWaist": p(w.sideX, waistY),
    "bodice.back.waistDartLeft": p(w.centreX - w.dart / 2, waistY),
    "bodice.back.waistDartRight": p(w.centreX + w.dart / 2, waistY),
    "bodice.back.waistDartApex": p(w.centreX, apexY),
  };
}

/**
 * Drafts the front bodice.
 *
 * @param m - Measurements of the size.
 * @param d - Unrounded derived lengths.
 * @returns Key points of the front bodice.
 */
function draftBodiceFront(m: Measurements, d: DerivedLengths): BlockPoints {
  const runMm = m.shoulderWidth / 2 - d.neckWidth;
  const tipY = C.frontShoulderSlope * runMm;
  const underarmY = C.backNeckRiseMm + d.scyeDepth;
  const w = bodiceWaist(m, "front");
  const waistCF = p(0, m.frontLength);
  const sideWaist = p(w.sideX, C.backNeckRiseMm + m.backLength + d.bustDart);
  /**
   * The y of the front waist line at x.
   *
   * @param x - Horizontal position in mm.
   * @returns The y in mm.
   */
  const waistLineY = (x: number): number => yOnLine(waistCF, sideWaist, x);
  const bust = p(m.bustPointDistance / 2, m.bustHeight);
  const upperY = underarmY + C.bustDartBelowUnderarmMm;
  return {
    "bodice.front.neckPoint": p(d.neckWidth, 0),
    "bodice.front.neckCF": p(0, d.frontNeckDepth),
    "bodice.front.shoulderTip": p(m.shoulderWidth / 2, tipY),
    "bodice.front.chestWidthPoint": p(d.chestWidth / 2, tipY + (underarmY - tipY) / 3),
    "bodice.front.scyeLineCF": p(0, underarmY),
    "bodice.front.underarm": p(w.bustHalf, underarmY),
    "bodice.front.bustPoint": bust,
    "bodice.front.bustDartUpper": p(w.bustHalf, upperY),
    "bodice.front.bustDartLower": p(w.bustHalf, upperY + d.bustDart),
    "bodice.front.waistCF": waistCF,
    "bodice.front.sideWaist": sideWaist,
    "bodice.front.waistDartLeft": p(w.centreX - w.dart / 2, waistLineY(w.centreX - w.dart / 2)),
    "bodice.front.waistDartRight": p(w.centreX + w.dart / 2, waistLineY(w.centreX + w.dart / 2)),
    "bodice.front.waistDartApex": p(w.centreX, bust.y + C.frontDartBelowBustMm),
  };
}

/**
 * Drafts one straight skirt half (front or back).
 *
 * @param m - Measurements of the size.
 * @param side - Which half is drafted.
 * @returns Key points of the skirt half.
 */
function draftSkirt(m: Measurements, side: "front" | "back"): BlockPoints {
  const hipX = m.hip / 4 + C.hipEaseQuarterMm;
  const waistX = m.waist / 4 + C.skirtWaistEaseQuarterMm;
  const share = side === "front" ? C.skirtFrontDartShare : C.skirtBackDartShare;
  const length = side === "front" ? C.skirtFrontDartLengthMm : C.skirtBackDartLengthMm;
  const shaping = hipX - waistX;
  const dart = shaping * share;
  const sideX = hipX - (shaping - dart);
  const k = `skirt.${side}`;
  return {
    [`${k}.waistCentre`]: p(0, 0),
    [`${k}.waistSide`]: p(sideX, 0),
    [`${k}.dartLeft`]: p(sideX / 2 - dart / 2, 0),
    [`${k}.dartRight`]: p(sideX / 2 + dart / 2, 0),
    [`${k}.dartApex`]: p(sideX / 2, length),
    [`${k}.hipCentre`]: p(0, m.hipDepth),
    [`${k}.hipSide`]: p(hipX, m.hipDepth),
    [`${k}.hemCentre`]: p(0, m.waistToKnee),
    [`${k}.hemSide`]: p(hipX, m.waistToKnee),
  };
}

/**
 * Drafts the one-piece set-in sleeve.
 *
 * @param m - Measurements of the size.
 * @param d - Unrounded derived lengths.
 * @returns Key points of the sleeve.
 */
function draftSleeve(m: Measurements, d: DerivedLengths): BlockPoints {
  const bicepHalf = (m.upperArm + C.sleeveBicepEaseMm) / 2;
  const wristHalf = (m.wrist + C.sleeveWristEaseMm) / 2;
  return {
    "sleeve.capTop": p(0, 0),
    "sleeve.underarmBack": p(-bicepHalf, d.sleeveCapHeight),
    "sleeve.underarmFront": p(bicepHalf, d.sleeveCapHeight),
    "sleeve.wristBack": p(-wristHalf, m.armLength),
    "sleeve.wristFront": p(wristHalf, m.armLength),
    "sleeve.wristCentre": p(0, m.armLength),
  };
}

/**
 * Armscye depth from the nape level.
 *
 * @param m - Measurements of the size.
 * @returns Depth in mm.
 */
function scyeDepthOf(m: Measurements): number {
  return m.bust * C.scyeDepthBustShare + C.scyeDepthBaseMm;
}

/**
 * Derives the lengths missing from the measurement set, rounded for printing.
 *
 * @param m - Measurements of the size.
 * @returns The derived lengths.
 */
function deriveLengths(m: Measurements): DerivedLengths {
  const neckWidth = m.neck / 5 - C.neckWidthDeductMm;
  const run = m.shoulderWidth / 2 - neckWidth;
  const scyeDepth = scyeDepthOf(m);
  const bustHalf = m.bust / 4 + C.bustEaseQuarterMm;
  const shaping = bustHalf - (m.waist / 4 + C.bodiceWaistEaseQuarterMm);
  return {
    scyeDepth: r1(scyeDepth),
    backWidth: r1(m.bust * C.backWidthRatio),
    chestWidth: r1(m.bust * C.chestWidthRatio),
    neckWidth: r1(neckWidth),
    frontNeckDepth: r1(m.neck / 5 + C.frontNeckDepthAddMm),
    backShoulderLength: r1(Math.hypot(run, run * C.backShoulderSlope)),
    frontShoulderLength: r1(Math.hypot(run, run * C.frontShoulderSlope)),
    bustDart: r1(m.bust * C.bustDartRatio),
    backWaistDart: r1(shaping * C.bodiceDartShare),
    frontWaistDart: r1(shaping * C.bodiceDartShare),
    sleeveCapHeight: r1(scyeDepth * C.sleeveCapHeightShare),
  };
}

/**
 * Runs the whole calculation for one size.
 *
 * @param m - The measurements of the size (mm).
 * @returns Derived lengths and the key points of every block, rounded to 0.1 mm.
 */
export function computeReferenceDraft(m: Measurements): DraftResult {
  const raw = deriveLengths(m);
  // Use unrounded values inside the drafting, so rounding happens once, on output.
  const exact: DerivedLengths = {
    ...raw,
    scyeDepth: scyeDepthOf(m),
    backWidth: m.bust * C.backWidthRatio,
    chestWidth: m.bust * C.chestWidthRatio,
    neckWidth: m.neck / 5 - C.neckWidthDeductMm,
    frontNeckDepth: m.neck / 5 + C.frontNeckDepthAddMm,
    bustDart: m.bust * C.bustDartRatio,
    sleeveCapHeight: scyeDepthOf(m) * C.sleeveCapHeightShare,
  };
  return {
    derived: raw,
    bodiceBack: draftBodiceBack(m, exact),
    bodiceFront: draftBodiceFront(m, exact),
    skirtBack: draftSkirt(m, "back"),
    skirtFront: draftSkirt(m, "front"),
    sleeve: draftSleeve(m, exact),
  };
}
