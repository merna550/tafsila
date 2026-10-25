/** The catalogue of option drawings, keyed by the same paths and values as the DesignSpec schema. */
import { BODICE_SHAPING } from "./bodice";
import { CATEGORY } from "./category";
import { BELT, CLOSURE_TYPE, LINING, POCKETS, WAISTBAND } from "./details";
import { NECKLINE_BACK, NECKLINE_COLLAR, NECKLINE_FRONT } from "./neckline";
import { SKIRT_LENGTH, SKIRT_TYPE } from "./skirt";
import { SLEEVE_CUFF, SLEEVE_LENGTH, SLEEVE_TYPE } from "./sleeve";
import type { Drawing, IllustratedPath, IllustrationValue } from "./types";

/** Every drawing, by catalogue path then option value. A new schema value fails the type check here. */
export const ILLUSTRATIONS: {
  readonly [P in IllustratedPath]: Record<IllustrationValue<P>, Drawing>;
} = {
  category: CATEGORY,
  "bodice.shaping": BODICE_SHAPING,
  "neckline.front": NECKLINE_FRONT,
  "neckline.back": NECKLINE_BACK,
  "neckline.collar": NECKLINE_COLLAR,
  "sleeve.type": SLEEVE_TYPE,
  "sleeve.length": SLEEVE_LENGTH,
  "sleeve.cuff": SLEEVE_CUFF,
  "skirt.type": SKIRT_TYPE,
  "skirt.length": SKIRT_LENGTH,
  waistband: WAISTBAND,
  "closure.type": CLOSURE_TYPE,
  pockets: POCKETS,
  belt: BELT,
  lining: LINING,
};

/**
 * Looks up one drawing without trusting the keys.
 *
 * @param path - Catalogue path.
 * @param value - Option value.
 * @returns The drawing, or undefined when none exists.
 */
export function findIllustration(path: string, value: string): Drawing | undefined {
  const byValue = (ILLUSTRATIONS as Record<string, Record<string, Drawing> | undefined>)[path];
  return byValue?.[value];
}

/**
 * Lists every drawing with its path and value (used by the gallery and the tests).
 *
 * @returns One entry per drawing.
 */
export function listIllustrations(): { path: IllustratedPath; value: string }[] {
  return (Object.keys(ILLUSTRATIONS) as IllustratedPath[]).flatMap((path) =>
    Object.keys(ILLUSTRATIONS[path]).map((value) => ({ path, value })),
  );
}
