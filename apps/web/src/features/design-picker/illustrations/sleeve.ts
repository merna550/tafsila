/** Drawings of the sleeve type, length and cuff options. */
import { NONE } from "./shared";
import type { Drawing, IllustrationValue } from "./types";

export const SLEEVE_TYPE: Record<IllustrationValue<"sleeve.type">, Drawing> = {
  none: NONE,
  "set-in": ["M24 8 Q14 12 12 20 L8 50 H20 L26 24"],
  cap: ["M22 14 Q14 14 12 24 H28 L26 14"],
  puff: ["M24 10 Q6 14 8 32 L16 36 L18 54 H30 L28 36 L30 30 Q34 14 24 10 Z"],
  bishop: ["M24 8 L12 16 Q4 40 14 54 H36 Q36 34 28 16 Z"],
  flutter: ["M24 8 L10 14 Q4 30 12 40 Q18 32 24 40 Q30 30 28 14 Z"],
};

export const SLEEVE_LENGTH: Record<IllustrationValue<"sleeve.length">, Drawing> = {
  cap: ["M26 6 L10 12 L8 22 H24 L28 14 Z"],
  short: ["M26 6 L10 12 L8 32 H24 L28 14 Z"],
  elbow: ["M26 6 L10 12 L8 40 H24 L28 14 Z"],
  "three-quarter": ["M26 6 L10 12 L8 50 H24 L28 14 Z"],
  long: ["M26 6 L10 12 L8 60 H24 L28 14 Z"],
};

export const SLEEVE_CUFF: Record<IllustrationValue<"sleeve.cuff">, Drawing> = {
  none: NONE,
  band: ["M16 8 V40 M32 8 V40", "M14 40 H34 V50 H14 Z"],
  elastic: ["M16 8 V42 M32 8 V42", "M14 42 Q18 38 22 42 Q26 46 30 42 Q32 40 34 42 V52 H14 Z"],
};
