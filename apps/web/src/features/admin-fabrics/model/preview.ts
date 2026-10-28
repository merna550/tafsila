/** The recommendation preview: runs the shared `recommend` on the saved rows with an unsaved edit applied (ADR-320 item 1). */
import { recommend } from "@tafsila/fabric-kb";
import type { DesignSpec, Fabric, FabricRecommendationResult, FabricRule } from "@tafsila/schemas";

/**
 * Replaces the rule with the same id, or appends the rule when it is new.
 *
 * @param rules - The saved rules.
 * @param draft - The rule as edited.
 * @returns A new list that holds the edit.
 */
export function applyDraftRule(rules: readonly FabricRule[], draft: FabricRule): FabricRule[] {
  const exists = rules.some((r) => r.id === draft.id);
  return exists ? rules.map((r) => (r.id === draft.id ? draft : r)) : [...rules, draft];
}

/**
 * Replaces the fabric with the same id, or appends it when it is new.
 *
 * @param catalogue - The saved fabrics.
 * @param draft - The fabric as edited.
 * @returns A new list that holds the edit.
 */
export function applyDraftFabric(catalogue: readonly Fabric[], draft: Fabric): Fabric[] {
  const exists = catalogue.some((f) => f.id === draft.id);
  return exists ? catalogue.map((f) => (f.id === draft.id ? draft : f)) : [...catalogue, draft];
}

/** The preview of one design: what the saved rules give and what the edited rules give. */
export interface RulePreview {
  /** The result with the saved rules. */
  readonly before: FabricRecommendationResult;
  /** The result with the edit applied. */
  readonly after: FabricRecommendationResult;
  /** True when the ranked ids or the avoid list differ. */
  readonly changed: boolean;
}

/**
 * Computes the preview of one design.
 *
 * @param spec - The fixture design.
 * @param catalogue - The saved fabrics.
 * @param rules - The saved rules.
 * @param draft - The rule as edited (new or existing).
 * @returns Before, after and whether they differ.
 */
export function previewRule(
  spec: DesignSpec,
  catalogue: readonly Fabric[],
  rules: readonly FabricRule[],
  draft: FabricRule,
): RulePreview {
  const before = recommend(spec, catalogue, rules);
  const after = recommend(spec, catalogue, applyDraftRule(rules, draft));
  /**
   * Reduces a result to the ids that decide whether two results differ.
   *
   * @param r - A recommendation result.
   * @returns A comparable string.
   */
  const key = (r: FabricRecommendationResult): string =>
    JSON.stringify([r.recommended.map((x) => x.fabricId), r.avoid.map((x) => x.fabricId)]);
  return { before, after, changed: key(before) !== key(after) };
}
