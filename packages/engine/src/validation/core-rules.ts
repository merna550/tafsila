/** Core validation rules applied to every generated pattern. */
import type { ValidationRule } from "../pipeline/feature-module";
import { CIRCUMFERENCE_RULES } from "./rules/circumference";
import { DART_RULES } from "./rules/darts";
import { LABEL_RULES } from "./rules/labels";
import { NOTCH_RULES } from "./rules/notches";
import { PLAUSIBILITY_RULES } from "./rules/plausibility";
import { SEAM_MATCH_RULES } from "./rules/seam-match";
import { SLEEVE_CAP_RULES } from "./rules/sleeve-cap";
import { STRUCTURAL_RULES } from "./rules/structural";

/** Every rule that applies independent of garment modules. */
export const CORE_RULES: readonly ValidationRule[] = [
  ...SEAM_MATCH_RULES,
  ...SLEEVE_CAP_RULES,
  ...CIRCUMFERENCE_RULES,
  ...NOTCH_RULES,
  ...STRUCTURAL_RULES,
  ...LABEL_RULES,
  ...DART_RULES,
  ...PLAUSIBILITY_RULES,
];
