import type { DesignSpec, RuleCondition } from "@tafsila/schemas";

/**
 * Reads the value at a dotted path of a DesignSpec.
 *
 * @param spec - The design.
 * @param path - Dotted path such as `skirt.type`.
 * @returns The value, or undefined when any part of the path is absent.
 */
export function readPath(spec: DesignSpec, path: string): unknown {
  let current: unknown = spec;
  for (const key of path.split(".")) {
    if (current === null || typeof current !== "object") return undefined;
    current = (current as Record<string, unknown>)[key];
  }
  return current;
}

/**
 * Counts how many entries of a design value are in a condition's value list; a single value counts as one entry.
 *
 * @param value - A string, a list of strings (pockets) or anything else.
 * @param values - The condition's allowed values.
 * @returns The number of entries found in `values`.
 */
function countHits(value: unknown, values: readonly string[]): number {
  const entries = Array.isArray(value) ? (value as unknown[]) : [value];
  return entries.filter((entry) => typeof entry === "string" && values.includes(entry)).length;
}

/**
 * Whether one condition holds for a spec. An absent value (for example `skirt` on a blouse) never matches, even for
 * `not-in`, so a rule about skirts stays silent on blouses. Pocket lists match when any (`in`) or none (`not-in`) of
 * their entries are in `values`.
 *
 * @param spec - The design.
 * @param condition - The condition to test.
 * @returns True when the condition holds.
 */
export function conditionMatches(spec: DesignSpec, condition: RuleCondition): boolean {
  const value = readPath(spec, condition.path);
  if (value === undefined) return false;
  if (condition.op === "is-true") return value === true;
  const hits = countHits(value, condition.values ?? []);
  return condition.op === "in" ? hits > 0 : hits === 0;
}

/**
 * Whether every condition of a rule holds.
 *
 * @param spec - The design.
 * @param when - The rule's conditions.
 * @returns True when all of them hold.
 */
export function ruleMatches(spec: DesignSpec, when: readonly RuleCondition[]): boolean {
  return when.every((condition) => conditionMatches(spec, condition));
}
