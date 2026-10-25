/** Drawings of the skirt types and lengths. */
import type { Drawing, IllustrationValue } from "./types";

export const SKIRT_TYPE: Record<IllustrationValue<"skirt.type">, Drawing> = {
  straight: ["M24 10 H40 L42 54 H22 Z"],
  "a-line": ["M24 10 H40 L52 54 H12 Z"],
  "circle-half": ["M24 10 H40 Q58 30 56 54 H8 Q6 30 24 10"],
  "circle-full": ["M24 10 H40 Q62 20 58 44 Q50 58 32 58 Q14 58 6 44 Q2 20 24 10 Z"],
  gathered: ["M24 10 H40 L52 54 H12 Z", "M26 10 L20 54 M32 10 V54 M38 10 L44 54"],
  pleated: ["M24 10 H40 L46 54 L40 50 L34 54 L28 50 L22 54 L18 54 Z"],
  tiered: ["M24 10 H40 L42 26 H46 L50 40 H54 L58 56 H6 L10 40 H14 L18 26 H22 Z"],
};

export const SKIRT_LENGTH: Record<IllustrationValue<"skirt.length">, Drawing> = {
  mini: ["M24 6 H40 L45 20 H19 Z"],
  knee: ["M24 6 H40 L48 32 H16 Z"],
  midi: ["M24 6 H40 L51 44 H13 Z"],
  ankle: ["M24 6 H40 L54 54 H10 Z"],
  floor: ["M24 6 H40 L55 60 H9 Z"],
};
