/** Orders rules and describes them for the rules table. */
import type { AdminFabricRule, RuleEffect } from "@tafsila/schemas";

/**
 * Sorts rules by priority (the decisive 5 first), then by id, without changing the input.
 *
 * @param rules - The rules.
 * @returns A sorted copy.
 */
export function sortByPriority<T extends { readonly priority: number; readonly id: string }>(
  rules: readonly T[],
): T[] {
  return [...rules].sort((a, b) => b.priority - a.priority || a.id.localeCompare(b.id));
}

/** One bound of an effect, shown to the admin on the 1 to 5 scale. */
export interface EffectBound {
  /** `min` reads "at least", `max` reads "at most". */
  readonly kind: "min" | "max";
  /** The bound on the 1 to 5 scale. */
  readonly shown: number;
}

/**
 * Lists the bounds of an effect for display.
 *
 * @param effect - A rule effect.
 * @returns The min bound and the max bound that exist.
 */
export function effectBounds(effect: RuleEffect): EffectBound[] {
  const bounds: EffectBound[] = [];
  if (effect.min !== undefined) bounds.push({ kind: "min", shown: effect.min + 1 });
  if (effect.max !== undefined) bounds.push({ kind: "max", shown: effect.max + 1 });
  return bounds;
}

/**
 * Finds a rule by id.
 *
 * @param rules - The rules.
 * @param id - The id.
 * @returns The rule, or undefined.
 */
export function findRule(rules: readonly AdminFabricRule[], id: string): AdminFabricRule | undefined {
  return rules.find((r) => r.id === id);
}
