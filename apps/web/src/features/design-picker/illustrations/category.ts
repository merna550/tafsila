/** Drawings of the garment categories. */
import type { Drawing, IllustrationValue } from "./types";

export const CATEGORY: Record<IllustrationValue<"category">, Drawing> = {
  dress: ["M24 8 L20 20 L26 30 L16 56 H48 L38 30 L44 20 L40 8", "M24 8 Q32 16 40 8"],
  skirt: ["M22 12 H42 L50 54 H14 Z"],
  blouse: ["M24 10 L10 20 L14 28 L20 25 V54 H44 V25 L50 28 L54 20 L40 10 Q32 18 24 10"],
};
