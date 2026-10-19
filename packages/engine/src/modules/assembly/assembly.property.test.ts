/**
 * Property tests of garment assembly (issue #144) across the size matrix: a dress with a waist seam over every skirt
 * family, and a one-piece dress with every bodice shaping over straight and A-line skirts. Each case: no `fail` (FR-VAL-01, -03, -04, -05, -07 included) and the same input
 * gives the same output.
 */
import type { DesignSpec } from "@tafsila/schemas";
import { SIZE_MATRIX, seedDress } from "@tafsila/test-fixtures";
import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { generatePattern } from "../../pipeline/generate-pattern";

/** Wall-clock allowance on a busy CI runner with coverage; locally each test takes a few seconds. */
const TIMEOUT_MS = 60_000;

/** Sampled design × size pairs per property. */
const RUNS = 8;

/** Every bodice shaping. */
const SHAPINGS = ["darts", "none", "princess-shoulder", "princess-armhole"] as const;

/** Dresses with a waist seam over each skirt family. */
const WAIST_SEAM_DRESSES: readonly DesignSpec[] = (
  ["straight", "a-line", "circle-half", "gathered", "pleated"] as const
).map((type) => ({ ...seedDress, skirt: { type, length: "knee" } }));

/** One-piece dresses: every shaping over a straight or an A-line skirt. */
const ONE_PIECE_DRESSES: readonly DesignSpec[] = SHAPINGS.flatMap((shaping) =>
  (["straight", "a-line"] as const).map((type) => ({
    ...seedDress,
    bodice: { fit: "fitted" as const, shaping, waistSeam: false },
    skirt: { type, length: "knee" as const },
  })),
);

/**
 * Asserts the pattern has no failing check and is deterministic.
 *
 * @param spec - The design.
 * @param measurements - The body.
 */
function expectAssembled(spec: DesignSpec, measurements: (typeof SIZE_MATRIX)[number]["measurements"]): void {
  const first = generatePattern(spec, measurements);
  const fails = first.validation.checks.filter((c) => c.status === "fail").map((c) => c.code);
  expect(fails).toEqual([]);
  expect(JSON.stringify(generatePattern(spec, measurements))).toBe(JSON.stringify(first));
}

describe.each([
  ["dress with a waist seam", WAIST_SEAM_DRESSES],
  ["one-piece dress", ONE_PIECE_DRESSES],
] as const)("%s", (_name, designs) => {
  it(
    "passes every FR-VAL check and is deterministic across the size matrix",
    () => {
      fc.assert(
        fc.property(fc.constantFrom(...designs), fc.constantFrom(...SIZE_MATRIX), (spec, entry) => {
          expectAssembled(spec, entry.measurements);
        }),
        { numRuns: RUNS, seed: 144 },
      );
    },
    TIMEOUT_MS,
  );
});
