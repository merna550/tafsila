/** Tests for the canonical JSON and the input hash. */
import { sizeM, vNeckHalfCircleDress } from "@tafsila/test-fixtures";
import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { DEFAULT_ENGINE_OPTIONS } from "./generate-pattern";
import { canonicalJson, inputHash } from "./input-hash";

/**
 * Rebuilds an object with its keys in reverse order, recursively.
 *
 * @param value - Any JSON value.
 * @returns The same data with reversed key order.
 */
function reverseKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(reverseKeys);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .reverse()
        .map(([k, v]) => [k, reverseKeys(v)]),
    );
  }
  return value;
}

describe("canonicalJson", () => {
  it("sorts keys, turns -0 into 0 and drops undefined", () => {
    expect(canonicalJson({ b: 1, a: [-0, "x"], c: undefined })).toBe('{"a":[0,"x"],"b":1}');
  });

  it("throws on a non-finite number", () => {
    expect(() => canonicalJson({ a: Number.POSITIVE_INFINITY })).toThrow(/non-finite/);
  });
});

describe("inputHash", () => {
  const options = DEFAULT_ENGINE_OPTIONS as never;

  it("ignores key order (property)", () => {
    fc.assert(
      fc.property(fc.constantFrom("S", "M", "L"), (sizeLabel) => {
        const o = { ...DEFAULT_ENGINE_OPTIONS, sizeLabel } as never;
        const same = inputHash(
          reverseKeys(vNeckHalfCircleDress) as never,
          reverseKeys(sizeM) as never,
          reverseKeys(o) as never,
        );
        expect(same).toBe(inputHash(vNeckHalfCircleDress, sizeM, o));
      }),
    );
  });

  it("changes when one measurement changes by 1 mm", () => {
    expect(inputHash(vNeckHalfCircleDress, { ...sizeM, bust: sizeM.bust + 1 }, options)).not.toBe(
      inputHash(vNeckHalfCircleDress, sizeM, options),
    );
  });
});
