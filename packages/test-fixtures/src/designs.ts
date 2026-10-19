/** Shared DesignSpec fixtures for tests. */
import type { DesignSpec } from "@tafsila/schemas";

/** The demo dress: V-neck, short set-in sleeves, darted bodice, half-circle skirt, back zip. */
export const vNeckHalfCircleDress: DesignSpec = {
  schemaVersion: 1,
  category: "dress",
  fabricType: "woven",
  bodice: { fit: "fitted", shaping: "darts", waistSeam: true },
  neckline: { front: "v", back: "round", depthFrontMm: 200, collar: "none" },
  sleeve: { type: "set-in", length: "short", cuff: "none" },
  skirt: { type: "circle-half", length: "knee", lengthMm: 600 },
  waistband: "none",
  closure: { type: "zip", position: "center-back" },
  pockets: [],
  lining: false,
  belt: "none",
};

/**
 * The bodice block seed design (issue #128): a semi-fitted, darted blouse with no sleeves, no collar and a
 * centre-back zip. Used by the bodice snapshots, property tests and `pnpm engine:print dartedBlouse size-m`.
 */
export const dartedBlouse: DesignSpec = {
  schemaVersion: 1,
  category: "blouse",
  fabricType: "woven",
  bodice: { fit: "semi-fitted", shaping: "darts", waistSeam: false },
  neckline: { front: "round", back: "round", collar: "none" },
  sleeve: { type: "none", length: "short", cuff: "none" },
  closure: { type: "zip", position: "center-back" },
  pockets: [],
  lining: false,
};

/**
 * The set-in sleeve seed design (issue #134): the seed blouse with long set-in sleeves. Tests set the other
 * lengths on it; used by the sleeve snapshots and `pnpm engine:print setInSleeveBlouse size-m`.
 */
export const setInSleeveBlouse: DesignSpec = {
  ...dartedBlouse,
  sleeve: { type: "set-in", length: "long", cuff: "none" },
};

/**
 * The shoulder princess seed design (issue #138): the seed blouse, fitted, shaped by princess seams from mid-shoulder
 * through the bust point instead of darts. Used by the princess snapshots and `pnpm engine:print princessShoulderBlouse size-m`.
 */
export const princessShoulderBlouse: DesignSpec = {
  ...dartedBlouse,
  bodice: { fit: "fitted", shaping: "princess-shoulder", waistSeam: false },
};

/**
 * The armhole princess seed design (issue #138): fitted, princess seams from the armhole, long set-in sleeves (the
 * armhole is split between the centre and side panels, so the sleeve sews to both).
 */
export const princessArmholeBlouse: DesignSpec = {
  ...setInSleeveBlouse,
  bodice: { fit: "fitted", shaping: "princess-armhole", waistSeam: false },
};

/** The dart-free seed design (issue #138): a loose blouse with no darts; the dart intake becomes ease. */
export const dartFreeLooseBlouse: DesignSpec = {
  ...dartedBlouse,
  bodice: { fit: "loose", shaping: "none", waistSeam: false },
};

/**
 * Neckline seed designs (issue #139): the seed blouse with each front style and a matching back, no closure where
 * the neck opens wide enough to slip over the head. Used by the neckline snapshots and `pnpm engine:print`.
 */
export const vNeckBlouse: DesignSpec = {
  ...dartedBlouse,
  neckline: { front: "v", back: "v", collar: "none" },
};

/** Square front and back neck (issue #139). */
export const squareNeckBlouse: DesignSpec = {
  ...dartedBlouse,
  neckline: { front: "square", back: "square", collar: "none" },
};

/** Sweetheart front, round back (issue #139). */
export const sweetheartNeckBlouse: DesignSpec = {
  ...dartedBlouse,
  neckline: { front: "sweetheart", back: "round", collar: "none" },
};

/** Boat front, high-round back, no closure: the head-opening check warns (issue #139). */
export const boatNeckBlouse: DesignSpec = {
  ...dartedBlouse,
  neckline: { front: "boat", back: "high-round", collar: "none" },
  closure: { type: "none", position: "center-back" },
};

/** High-round front and back (issue #139). */
export const highRoundNeckBlouse: DesignSpec = {
  ...dartedBlouse,
  neckline: { front: "high-round", back: "high-round", collar: "none" },
};

/** A plain straight skirt at the knee with a side zip: front and back both cut on the fold (issue #129). */
export const straightKneeSkirt: DesignSpec = {
  schemaVersion: 1,
  category: "skirt",
  fabricType: "woven",
  skirt: { type: "straight", length: "knee" },
  waistband: "none",
  closure: { type: "zip", position: "side" },
  pockets: [],
  lining: false,
};

/** A half-circle skirt at the knee with a side zip: front and back on the fold when the fabric is wide enough (issue #136). */
export const halfCircleKneeSkirt: DesignSpec = {
  schemaVersion: 1,
  category: "skirt",
  fabricType: "woven",
  skirt: { type: "circle-half", length: "knee" },
  waistband: "none",
  closure: { type: "zip", position: "side" },
  pockets: [],
  lining: false,
};

/** A full-circle skirt at the knee with a side zip; split into four pieces on narrow fabric (issue #136). */
export const fullCircleKneeSkirt: DesignSpec = {
  ...halfCircleKneeSkirt,
  skirt: { type: "circle-full", length: "knee" },
};

/** An A-line skirt at midi length with a side zip: each waist dart closed into the hem (issue #135). */
export const aLineMidiSkirt: DesignSpec = {
  ...straightKneeSkirt,
  skirt: { type: "a-line", length: "midi" },
};

/** A straight midi skirt with no slit: too narrow to walk in, so FR-VAL-08 warns (issue #135). */
export const straightMidiSkirt: DesignSpec = {
  ...straightKneeSkirt,
  skirt: { type: "straight", length: "midi" },
};

/** A straight midi skirt with a 200 mm back slit and a centre-back zip (issue #135). */
export const straightMidiBackSlitSkirt: DesignSpec = {
  ...straightKneeSkirt,
  skirt: { type: "straight", length: "midi", slit: { position: "back", lengthMm: 200 } },
  closure: { type: "zip", position: "center-back" },
};

/** An A-line ankle skirt with a 300 mm side slit (issue #135). */
export const aLineAnkleSideSlitSkirt: DesignSpec = {
  ...straightKneeSkirt,
  skirt: { type: "a-line", length: "ankle", slit: { position: "side", lengthMm: 300 } },
};

/** A gathered knee skirt with a side zip: rectangle panels gathered 1.8 times to the waist (issue #137). */
export const gatheredKneeSkirt: DesignSpec = {
  ...straightKneeSkirt,
  skirt: { type: "gathered", length: "knee" },
};

/** A knife-pleated knee skirt with a side zip: 16 pleats spaced evenly round the waist (issue #137). */
export const pleatedKneeSkirt: DesignSpec = {
  ...straightKneeSkirt,
  skirt: { type: "pleated", length: "knee" },
};

/** A three-tier midi skirt with a centre-back zip: each tier gathered onto the one above (issue #137). */
export const tieredMidiSkirt: DesignSpec = {
  ...straightKneeSkirt,
  skirt: { type: "tiered", length: "midi" },
  closure: { type: "zip", position: "center-back" },
};

/** A straight knee skirt with a straight folded waistband and a centre-back zip with a 30 mm underlap (issue #140). */
export const straightBandSkirt: DesignSpec = {
  ...straightKneeSkirt,
  waistband: "straight",
  closure: { type: "zip", position: "center-back" },
};

/** An A-line midi skirt with a contour band traced from the waist, darts closed, and a side zip (issue #140). */
export const contourBandSkirt: DesignSpec = {
  ...aLineMidiSkirt,
  waistband: "contour",
};

/** A gathered knee skirt with an elastic casing and no opening: wide enough to pull on over the hip (issue #140). */
export const elasticGatheredSkirt: DesignSpec = {
  ...gatheredKneeSkirt,
  waistband: "elastic",
  closure: { type: "none", position: "side" },
};

/** A straight knee skirt with an elastic casing: too narrow to pass over the hip, so FR-VAL-08 warns (issue #140). */
export const elasticStraightSkirt: DesignSpec = {
  ...straightKneeSkirt,
  waistband: "elastic",
  closure: { type: "none", position: "side" },
};

/**
 * Collar seed designs (issue #141): the seed blouse with each collar on a neckline and closure it allows. Used by the
 * collar snapshots, property tests and `pnpm engine:print`.
 */
export const peterPanBlouse: DesignSpec = {
  ...dartedBlouse,
  neckline: { front: "round", back: "round", collar: "peter-pan" },
};

/** Shirt collar (stand and fall) on a round neck, buttoned at centre front (issue #141). */
export const shirtCollarBlouse: DesignSpec = {
  ...dartedBlouse,
  neckline: { front: "round", back: "round", collar: "shirt" },
  closure: { type: "buttons", position: "center-front" },
};

/** Mandarin stand on a high-round neck with a centre-front zip (issue #141). */
export const mandarinBlouse: DesignSpec = {
  ...dartedBlouse,
  neckline: { front: "high-round", back: "high-round", collar: "mandarin" },
  closure: { type: "zip", position: "center-front" },
};

/**
 * Sleeve style seed designs (issue #142): the seed blouse with each sleeve style. Tests set other lengths and cuffs on
 * them; used by the sleeve-style snapshots, property tests and `pnpm engine:print`.
 */
export const puffSleeveBlouse: DesignSpec = {
  ...dartedBlouse,
  sleeve: { type: "puff", length: "short", cuff: "band" },
};

/** Long bishop sleeves gathered into an open band cuff (issue #142). */
export const bishopSleeveBlouse: DesignSpec = {
  ...dartedBlouse,
  sleeve: { type: "bishop", length: "long", cuff: "band" },
};

/** Self-lined cap sleeves, sewn between the armhole balance notches (issue #142). */
export const capSleeveBlouse: DesignSpec = {
  ...dartedBlouse,
  sleeve: { type: "cap", length: "short", cuff: "none" },
};

/** Half-circle flutter sleeves, sewn between the armhole balance notches (issue #142). */
export const flutterSleeveBlouse: DesignSpec = {
  ...dartedBlouse,
  sleeve: { type: "flutter", length: "short", cuff: "none" },
};

/**
 * Closure seed designs (issue #143): the seed garments with each closure. Used by the closure snapshots, property
 * tests and `pnpm engine:print`.
 */
export const centreBackZipDress: DesignSpec = {
  ...vNeckHalfCircleDress,
  skirt: { type: "straight", length: "knee" },
  neckline: { front: "round", back: "round", collar: "none" },
};

/** The straight dress with a zip in the left side seam (issue #143). */
export const sideZipDress: DesignSpec = { ...centreBackZipDress, closure: { type: "zip", position: "side" } };

/** The straight dress with a centre-front zip (issue #143). */
export const centreFrontZipDress: DesignSpec = {
  ...centreBackZipDress,
  closure: { type: "zip", position: "center-front" },
};

/** The straight dress buttoned down the centre front, neck to hem (issue #143). */
export const buttonFrontDress: DesignSpec = {
  ...centreBackZipDress,
  closure: { type: "buttons", position: "center-front" },
};

/** The seed blouse buttoned down the centre front, with no collar (issue #143). */
export const buttonFrontBlouse: DesignSpec = {
  ...dartedBlouse,
  closure: { type: "buttons", position: "center-front" },
};

/** The straight dress with no closure: the waist cannot pass the hips, so it warns (issue #143). */
export const noClosureDress: DesignSpec = {
  ...centreBackZipDress,
  closure: { type: "none", position: "center-back" },
};
