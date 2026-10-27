import type { Fabric, FabricRule } from "@tafsila/schemas";

/** Score lost per step outside a preferred range (ADR-314). */
export const FALL_OFF_PER_STEP = 0.5;

/**
 * How many steps a fabric's property lies outside the rule's range.
 *
 * @param fabric - The fabric.
 * @param effect - The rule effect with its min and/or max.
 * @returns 0 when inside the range, else the distance in steps.
 */
export function distanceOutside(fabric: Fabric, effect: FabricRule["effect"]): number {
  const level = fabric.properties[effect.property];
  const below = effect.min === undefined ? 0 : Math.max(0, effect.min - level);
  const above = effect.max === undefined ? 0 : Math.max(0, level - effect.max);
  return below + above;
}

/**
 * Score one fabric earns from one matched rule: priority, falling by half per step outside the range.
 *
 * @param fabric - The fabric.
 * @param rule - A matched rule.
 * @returns The score, 0 or more.
 */
export function ruleScore(fabric: Fabric, rule: FabricRule): number {
  const fit = Math.max(0, 1 - FALL_OFF_PER_STEP * distanceOutside(fabric, rule.effect));
  return rule.priority * fit;
}

/**
 * Orders two ids by code unit so the result never depends on the locale.
 *
 * @param a - First id.
 * @param b - Second id.
 * @returns Negative, zero or positive, as for `Array.sort`.
 */
export function compareIds(a: string, b: string): number {
  if (a === b) return 0;
  return a < b ? -1 : 1;
}

/**
 * Orders rules by priority (high first), then id, so the choice of reason does not depend on input order.
 *
 * @param a - First rule.
 * @param b - Second rule.
 * @returns Negative, zero or positive, as for `Array.sort`.
 */
export function byPriorityThenId(a: FabricRule, b: FabricRule): number {
  return b.priority - a.priority || compareIds(a.id, b.id);
}
