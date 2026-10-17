/** A stable hash of the whole input, the same in the browser and in Node (decision 125). */
import type { DesignSpec, EngineOptions, Measurements } from "@tafsila/schemas";
import { DraftingError } from "../errors/drafting-error";
import { ENGINE_VERSION } from "../version";

/** FNV-1a 64-bit offset basis, limb 0 (lowest 16 bits of 0xcbf29ce484222325). */
const FNV_OFFSET_0 = 0x2325;
/** FNV-1a 64-bit offset basis, limb 1. */
const FNV_OFFSET_1 = 0x8422;
/** FNV-1a 64-bit offset basis, limb 2. */
const FNV_OFFSET_2 = 0x9ce4;
/** FNV-1a 64-bit offset basis, limb 3 (highest). */
const FNV_OFFSET_3 = 0xcbf2;
/** Low 16 bits of the FNV-1a 64-bit prime (0x100000001b3 = 2^40 + 0x1b3). */
const FNV_PRIME_LOW = 0x1b3;
/** The 2^40 part of the prime, as it lands in the third limb (2^40 = 2^32 * 2^8). */
const FNV_PRIME_HIGH_IN_LIMB = 0x100;
/** Bits per limb. */
const LIMB_BITS = 16;
/** Mask of one limb. */
const LIMB_MASK = 0xffff;
/** Hex digits per limb. */
const LIMB_HEX_DIGITS = 4;
const HEX_RADIX = 16;

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
  if (value !== null && typeof value === "object") return canonicalObject(value as Record<string, unknown>);
  return JSON.stringify(value);
}

/**
 * One 16-bit limb as 4 hex digits.
 *
 * @param n - The limb.
 * @returns The hex text.
 */
function hexLimb(n: number): string {
  return n.toString(HEX_RADIX).padStart(LIMB_HEX_DIGITS, "0");
}

/**
 * Canonical JSON of a plain object: keys sorted by UTF-16 code units, with `undefined` values left out.
 *
 * @param obj - The object.
 * @returns The JSON text.
 */
function canonicalObject(obj: Record<string, unknown>): string {
  const keys = Object.keys(obj).sort(compareText);
  let out = "";
  for (const key of keys) {
    const value = obj[key];
    if (value === undefined) continue;
    out += `${out === "" ? "" : ","}${JSON.stringify(key)}:${canonicalJson(value)}`;
  }
  return `{${out}}`;
}

/**
 * FNV-1a 64-bit hash of a text's UTF-8 bytes.
 *
 * @param text - Text to hash.
 * @returns 16 lowercase hex digits.
 */
function fnv1a64(text: string): string {
  // Four 16-bit limbs preserve the exact 64-bit FNV result without allocating a BigInt for every byte.
  let h0 = FNV_OFFSET_0;
  let h1 = FNV_OFFSET_1;
  let h2 = FNV_OFFSET_2;
  let h3 = FNV_OFFSET_3;
  const bytes = new TextEncoder().encode(text);
  for (let i = 0; i < bytes.length; i += 1) {
    h0 ^= bytes[i]!;
    const t0 = h0 * FNV_PRIME_LOW;
    const t1 = h1 * FNV_PRIME_LOW + (t0 >>> LIMB_BITS);
    const t2 = h2 * FNV_PRIME_LOW + h0 * FNV_PRIME_HIGH_IN_LIMB + (t1 >>> LIMB_BITS);
    const t3 = h3 * FNV_PRIME_LOW + h1 * FNV_PRIME_HIGH_IN_LIMB + (t2 >>> LIMB_BITS);
    h0 = t0 & LIMB_MASK;
    h1 = t1 & LIMB_MASK;
    h2 = t2 & LIMB_MASK;
    h3 = t3 & LIMB_MASK;
  }
  return hexLimb(h3) + hexLimb(h2) + hexLimb(h1) + hexLimb(h0);
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
