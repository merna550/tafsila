/** Drawings of the bodice shaping options. */
import { NONE } from "./shared";
import type { Drawing, IllustrationValue } from "./types";

const TORSO = "M20 8 V56 H44 V8";

export const BODICE_SHAPING: Record<IllustrationValue<"bodice.shaping">, Drawing> = {
  darts: [TORSO, "M24 36 L28 22 L32 36", "M32 36 L36 22 L40 36"],
  "princess-shoulder": [TORSO, "M27 8 Q23 32 27 54", "M37 8 Q41 32 37 54"],
  "princess-armhole": [TORSO, "M20 20 Q27 32 25 54", "M44 20 Q37 32 39 54"],
  none: NONE,
};
