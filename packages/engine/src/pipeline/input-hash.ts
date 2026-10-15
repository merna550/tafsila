/** A stable hash of the whole input, the same in the browser and in Node (decision 125). */
import type { DesignSpec, EngineOptions, Measurements } from "@tafsila/schemas";
import { DraftingError } from "../errors/drafting-error";
import { ENGINE_VERSION } from "../version";

const FNV_OFFSET_64 = 0xcbf29ce484222325n;
const FNV_PRIME_64 = 0x100000001b3n;
const HEX_RADIX = 16;
const MASK_64 = 0xffffffffffffffffn;
const HASH_HEX_DIGITS = 16;

/**
 * Compares two strings by code unit.
 *
 * @param a - First string.
 * @param b - Second string.
 * @returns Negative, zero or positive, like a sort comparator.
 */
export function compareText(a: string, b: string): number {
  if (a < b) return -1;
  return a > b ? 1 : 0;
}

/**
 * Writes a value as JSON with sorted object keys and `-0` as `0`, so key order never matters.
 *
 * @param value - Plain JSON data (objects, arrays, strings, finite numbers, booleans, null).
 * @returns The canonical text.
 * @throws {DraftingError} PIPELINE_NON_FINITE_NUMBER for NaN or Infinity.
 */
export function canonicalJson(value: unknown): string {
  if (typeof value === "number") {
    if (!Number.isFinite(value))
      throw new DraftingError("PIPELINE_NON_FINITE_NUMBER", "Cannot hash a non-finite number");
    return JSON.stringify(Object.is(value, -0) ? 0 : value);
  }
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  if (value !== null && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, v]) => v !== undefined)
      .sort(([a], [b]) => compareText(a, b));
    return `{${entries.map(([k, v]) => JSON.stringify(k) + ":" + canonicalJson(v)).join(",")}}`;
  }
  return JSON.stringify(value);
}

/**
 * FNV-1a 64-bit hash of a text's UTF-8 bytes.
 *
 * @param text - Text to hash.
 * @returns 16 lowercase hex digits.
 */
function fnv1a64(text: string): string {
  let hash = FNV_OFFSET_64;
  for (const byte of new TextEncoder().encode(text)) {
    hash = ((hash ^ BigInt(byte)) * FNV_PRIME_64) & MASK_64;
  }
  return hash.toString(HEX_RADIX).padStart(HASH_HEX_DIGITS, "0");
}

/**
 * The `meta.createdFrom` value: same input and engine version give the same hash.
 *
 * @param spec - The design.
 * @param measurements - The measurements.
 * @param options - The options.
 * @returns `fnv1a64:<16 hex digits>`.
 */
export function inputHash(spec: DesignSpec, measurements: Measurements, options: EngineOptions): string {
  return rawInputHash(spec, measurements, options);
}

/**
 * Same hash for input that may not be valid; used for refused runs so the result still has a stable id.
 *
 * @param spec - Any value.
 * @param measurements - Any value.
 * @param options - Any value.
 * @returns `fnv1a64:<16 hex digits>`, or `fnv1a64:invalid` when the input cannot be written as JSON.
 */
export function rawInputHash(spec: unknown, measurements: unknown, options: unknown): string {
  try {
    return `fnv1a64:${fnv1a64(canonicalJson({ spec, measurements, options, engineVersion: ENGINE_VERSION }))}`;
  } catch {
    return "fnv1a64:invalid";
  }
}
