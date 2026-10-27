import {
  RECOMMENDED_COUNT,
  type DesignSpec,
  type Fabric,
  type FabricAvoid,
  type FabricRecommendation,
  type FabricRecommendationResult,
  type FabricRule,
} from "@tafsila/schemas";
import { ruleMatches } from "./conditions";
import { NEUTRAL_REASON } from "./reasons";
import { byPriorityThenId, compareIds, distanceOutside, ruleScore } from "./score";

/**
 * The avoid entry for a fabric that breaks a matched `must` rule; the highest-priority breaking rule explains it.
 *
 * @param fabric - The fabric.
 * @param matched - Matched rules, highest priority first.
 * @returns The entry, or undefined when the fabric breaks no `must` rule.
 */
function avoidEntry(fabric: Fabric, matched: readonly FabricRule[]): FabricAvoid | undefined {
  const broken = matched.find((r) => r.effect.strength === "must" && distanceOutside(fabric, r.effect) > 0);
  return broken && { fabricId: fabric.id, ruleId: broken.id, reason: broken.reason };
}

/**
 * Scores a fabric against the matched rules and picks the reason of the best rule it satisfies.
 *
 * @param fabric - The fabric.
 * @param matched - Matched rules, highest priority first.
 * @returns The scored recommendation.
 */
function recommendation(fabric: Fabric, matched: readonly FabricRule[]): FabricRecommendation {
  const score = matched.reduce((sum, rule) => sum + ruleScore(fabric, rule), 0);
  const satisfied = matched.find((r) => distanceOutside(fabric, r.effect) === 0);
  return { fabricId: fabric.id, score, reason: satisfied?.reason ?? NEUTRAL_REASON };
}

/**
 * Recommends 3 to 5 fabrics for a design and lists the fabrics to avoid (FR-REC-01, FR-REC-02).
 * Deterministic: it does not depend on the order of the catalogue or the rules; ties are broken by fabric id.
 * Fabrics that break a matched `must` rule are on the avoid list and never recommended.
 *
 * @param spec - The validated design.
 * @param catalogue - The fabrics to choose from.
 * @param rules - The recommendation rules.
 * @returns 3 to 5 recommendations (best first) and the avoid list.
 */
export function recommend(
  spec: DesignSpec,
  catalogue: readonly Fabric[],
  rules: readonly FabricRule[],
): FabricRecommendationResult {
  const matched = rules.filter((r) => ruleMatches(spec, r.when)).sort(byPriorityThenId);
  const fabrics = [...catalogue].sort((a, b) => compareIds(a.id, b.id));
  const avoid = fabrics.flatMap((f) => avoidEntry(f, matched) ?? []);
  const avoided = new Set(avoid.map((a) => a.fabricId));
  const ranked = fabrics
    .filter((f) => !avoided.has(f.id))
    .map((f) => recommendation(f, matched))
    .sort((a, b) => b.score - a.score || compareIds(a.fabricId, b.fabricId));
  const scored = ranked.filter((r) => r.score > 0).slice(0, RECOMMENDED_COUNT.max);
  const recommended =
    scored.length >= RECOMMENDED_COUNT.min ? scored : ranked.slice(0, RECOMMENDED_COUNT.min);
  return { recommended, avoid };
}
