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
