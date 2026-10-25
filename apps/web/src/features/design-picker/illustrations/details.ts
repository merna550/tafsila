/** Drawings of the waistband, closure, pockets, belt and lining options. */
import { NONE } from "./shared";
import type { Drawing, IllustrationValue } from "./types";

export const WAISTBAND: Record<IllustrationValue<"waistband">, Drawing> = {
  none: NONE,
  straight: ["M12 24 H52 V38 H12 Z"],
  contour: ["M12 24 Q32 30 52 24 V38 Q32 44 12 38 Z"],
  elastic: ["M12 24 H52 V38 H12 Z", "M16 31 L20 27 L24 35 L28 27 L32 35 L36 27 L40 35 L44 27 L48 31"],
};

export const CLOSURE_TYPE: Record<IllustrationValue<"closure.type">, Drawing> = {
  zip: ["M32 6 V58", "M27 12 H37 M27 20 H37 M27 28 H37 M27 36 H37 M27 44 H37"],
  buttons: [
    "M35 14 A3 3 0 1 0 29 14 A3 3 0 1 0 35 14 Z",
    "M35 30 A3 3 0 1 0 29 30 A3 3 0 1 0 35 30 Z",
    "M35 46 A3 3 0 1 0 29 46 A3 3 0 1 0 35 46 Z",
    "M20 6 V58",
  ],
  none: NONE,
};

export const POCKETS: Record<IllustrationValue<"pockets">, Drawing> = {
  "side-seam": ["M10 8 V56 H54 V8 Z", "M10 24 Q20 26 22 38"],
  patch: ["M10 8 V56 H54 V8 Z", "M22 28 H42 V44 L32 48 L22 44 Z"],
};

export const BELT: Record<IllustrationValue<"belt">, Drawing> = {
  none: NONE,
  "self-tie": ["M10 28 H54 V36 H10 Z", "M32 32 L22 50 M32 32 L42 50 M32 32 L24 22"],
};

export const LINING: Record<IllustrationValue<"lining">, Drawing> = {
  true: ["M20 10 V54 H44 V10 Z", "M25 15 V49 H39 V15 Z"],
  false: ["M20 10 V54 H44 V10 Z"],
};
