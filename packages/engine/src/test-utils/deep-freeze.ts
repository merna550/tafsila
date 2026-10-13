/** Test helper: inputs are deep-frozen before a call so any mutation by the engine throws (purity, SRS §3.3). */

/**
 * Freezes a value and everything inside it.
 *
 * @param value - Any value; objects and arrays are frozen recursively.
 * @returns The same value, now frozen.
 */
export function deepFreeze<T>(value: T): T {
  if (value && typeof value === "object") {
    Object.values(value).forEach(deepFreeze);
    Object.freeze(value);
  }
  return value;
}
