/** Pure helpers on a design and its feature paths: reading a value and comparing designs. */
import type { DesignSpec } from "@tafsila/schemas";
import type { FeaturePath } from "@tafsila/engine/spec-rules";

/**
 * Reads the value of one feature from a design.
 *
 * @param spec - The design.
 * @param path - The feature, such as `"sleeve.type"`.
 * @returns The value, or undefined when the design has no such part.
 */
export function readFeature(spec: DesignSpec, path: FeaturePath): unknown {
  let node: unknown = spec;
  for (const key of path.split(".")) {
    if (typeof node !== "object" || node === null) return undefined;
    node = (node as Record<string, unknown>)[key];
  }
  return node;
}

/**
 * Compares two JSON-like values by content, ignoring key order.
 *
 * @param a - First value.
 * @param b - Second value.
 * @returns True when they hold the same data.
 */
export function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (typeof a !== "object" || typeof b !== "object" || a === null || b === null) return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  const left = a as Record<string, unknown>;
  const right = b as Record<string, unknown>;
  const keys = Object.keys(left).filter((k) => left[k] !== undefined);
  const otherKeys = Object.keys(right).filter((k) => right[k] !== undefined);
  return keys.length === otherKeys.length && keys.every((k) => deepEqual(left[k], right[k]));
}

/** The message key of a feature: its path with the dot replaced by an underscore (`sleeve.type` becomes `sleeve_type`). */
export type PathMessageKey = FeaturePath extends infer P
  ? P extends `${infer Group}.${infer Field}`
    ? `${Group}_${Field}`
    : P
  : never;

/**
 * Builds the message key of a feature.
 *
 * @param path - The feature.
 * @returns The key under `designPicker.paths`.
 */
export function pathMessageKey(path: FeaturePath): PathMessageKey {
  return path.replace(".", "_") as PathMessageKey;
}

/**
 * Joins names into a spoken list, such as "A, B and C".
 *
 * @param names - Already translated names.
 * @param locale - Language of the list words.
 * @returns The joined text.
 */
export function joinNames(names: readonly string[], locale: string): string {
  return new Intl.ListFormat(locale, { style: "long", type: "conjunction" }).format(names);
}
