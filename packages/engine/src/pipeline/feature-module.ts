/** The plugin interfaces every garment feature and validation rule implements (ARCHITECTURE §3). */
import type { DesignSpec, ValidationCheck } from "@tafsila/schemas";
import type { DraftContext } from "./draft-context";

/** One validation rule (FR-VAL-xx): runs on the finished context and reports a single check. */
export interface ValidationRule {
  /** The check id this rule reports. */
  readonly id: ValidationCheck["id"];
  /** Whether the rule matters for this context. */
  appliesTo(ctx: DraftContext): boolean;
  /** Runs the rule; never throws for bad geometry, reports `fail` instead. */
  run(ctx: DraftContext): ValidationCheck;
}

/** A garment feature (neckline, sleeve, closure...). Pure: returns a new context and never edits another module's work. */
export interface FeatureModule {
  /** Unique id, e.g. "neckline-v". */
  readonly id: string;
  /** Run order; lower first, ties broken by id. */
  readonly order: number;
  /** Whether the design asks for this feature. */
  appliesTo(spec: DesignSpec): boolean;
  /** Draws the feature by returning a new context. */
  draft(ctx: DraftContext): DraftContext;
  /** Rules this module contributes. */
  readonly validations?: readonly ValidationRule[];
}
