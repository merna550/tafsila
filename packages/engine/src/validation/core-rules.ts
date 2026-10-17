/** Core validation rules applied to every generated pattern. */
import type { ValidationRule } from "../pipeline/feature-module";
import { LABEL_RULES } from "./rules/labels";
import { PLAUSIBILITY_RULES } from "./rules/plausibility";
import { STRUCTURAL_RULES } from "./rules/structural";

/** Every rule that applies independent of garment modules. */
export const CORE_RULES: readonly ValidationRule[] = [
  ...STRUCTURAL_RULES,
  ...LABEL_RULES,
  ...PLAUSIBILITY_RULES,
];
