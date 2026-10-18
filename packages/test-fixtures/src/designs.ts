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
