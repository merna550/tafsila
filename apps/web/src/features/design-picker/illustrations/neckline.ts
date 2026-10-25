/** Drawings of the front and back neckline shapes and the collars. */
import { NONE } from "./shared";
import type { Drawing, IllustrationValue } from "./types";

const TOP = "M8 24 L20 14 M44 14 L56 24 M14 22 V54 H50 V22";

const ROUND = [TOP, "M20 14 Q32 34 44 14"];
const V = [TOP, "M20 14 L32 36 L44 14"];
const SQUARE = [TOP, "M20 14 V28 H44 V14"];
const HIGH_ROUND = [TOP, "M20 14 Q32 24 44 14"];

export const NECKLINE_FRONT: Record<IllustrationValue<"neckline.front">, Drawing> = {
  round: ROUND,
  v: V,
  square: SQUARE,
  sweetheart: [TOP, "M20 14 Q22 30 32 24 Q42 30 44 14"],
  boat: [TOP, "M16 16 Q32 26 48 16"],
  "high-round": HIGH_ROUND,
};

export const NECKLINE_BACK: Record<IllustrationValue<"neckline.back">, Drawing> = {
  round: ROUND,
  v: V,
  square: SQUARE,
  "high-round": HIGH_ROUND,
};

export const NECKLINE_COLLAR: Record<IllustrationValue<"neckline.collar">, Drawing> = {
  none: NONE,
  "peter-pan": [TOP, "M20 14 Q32 26 44 14", "M20 14 Q16 24 26 26", "M44 14 Q48 24 38 26"],
  shirt: [TOP, "M20 14 L32 26 L44 14", "M20 14 L22 24 L32 26 L42 24 L44 14"],
  mandarin: [TOP, "M22 14 Q32 20 42 14 V8 Q32 12 22 8 Z"],
};
