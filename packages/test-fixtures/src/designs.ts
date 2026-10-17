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
