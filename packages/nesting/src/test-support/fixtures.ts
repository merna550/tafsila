/** The five fixture patterns of ADR-313, drafted once per size, for the placement tests. */
import { generatePattern } from "@tafsila/engine";
import type { PatternResult } from "@tafsila/schemas";
import {
  egyptianSizeChart,
  gatheredKneeSkirt,
  linedSidePocketDress,
  seedDress,
  setInSleeveBlouse,
  vNeckHalfCircleDress,
} from "@tafsila/test-fixtures";

/** The five fixture designs, by name. */
export const NESTING_DESIGNS = {
  seedDress,
  vNeckHalfCircleDress,
  setInSleeveBlouse,
  gatheredKneeSkirt,
  linedSidePocketDress,
} as const;

/** The sizes the tests draft. */
export const NESTING_SIZES = ["M", "XXL"] as const;

/** Patterns already drafted, by `<name> <size>`. */
const cache = new Map<string, PatternResult>();

/**
 * A fixture pattern, drafted once.
 *
 * @param name - The design name.
 * @param size - The size.
 * @returns The pattern.
 */
export function fixturePattern(name: keyof typeof NESTING_DESIGNS, size: string): PatternResult {
  const key = `${name} ${size}`;
  let pattern = cache.get(key);
  if (!pattern) {
    pattern = generatePattern(NESTING_DESIGNS[name], egyptianSizeChart[size]!);
    cache.set(key, pattern);
  }
  return pattern;
}
