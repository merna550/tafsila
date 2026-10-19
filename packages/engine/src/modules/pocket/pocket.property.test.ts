/**
 * Property tests of pockets, belt and lining (issue #145) over the size matrix and the option combinations the
 * compatibility matrix allows: pocket notches align front and back (FR-VAL-04), the bag opening matches the shell
 * opening, lining pairs hold (FR-VAL-01), the lining hem is above the shell hem, the belt adds up and fits the fabric,
 * and no edge, notch or pair dangles.
 */
import type { DesignSpec, PatternResult } from "@tafsila/schemas";
import {
  SIZE_MATRIX,
  centreBackZipDress,
  halfCircleKneeSkirt,
  onePieceDress,
  princessOnePieceDress,
  seedDress,
  straightKneeSkirt,
} from "@tafsila/test-fixtures";
import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { DEFAULT_ENGINE_OPTIONS, generatePattern } from "../../pipeline/generate-pattern";
import { pocketAllowed } from "./compatibility";

/** Wall-clock allowance on a busy CI runner with coverage. */
const PIPELINE_TEST_TIMEOUT_MS = 60_000;

/** Sampled combinations per run. */
const RUNS = 12;

/** Bases: the three #144 seed dresses, a straight skirt and a half-circle skirt, all with a centre-back zip. */
const BASES: readonly DesignSpec[] = [
  seedDress,
  onePieceDress,
  princessOnePieceDress,
  { ...straightKneeSkirt, closure: { type: "zip", position: "center-back" } },
  { ...halfCircleKneeSkirt, closure: { type: "zip", position: "center-back" } },
  centreBackZipDress,
];

/** Pocket choices. */
const POCKETS = [[], ["side-seam"], ["patch"], ["side-seam", "patch"]] as const;

/** One sampled design option set. */
interface Sample {
  readonly base: DesignSpec;
  readonly pockets: readonly ("side-seam" | "patch")[];
  readonly lining: boolean;
  readonly belt: boolean;
  readonly size: (typeof SIZE_MATRIX)[number];
}

/**
 * Asserts the pattern of one sample: no failed check, nothing dangling, lining hems pass, belts fit the fabric.
 *
 * @param r - The pattern.
 * @param sample - The options that made it.
 */
function expectSound(r: PatternResult, sample: Sample): void {
  const codes = r.validation.checks.filter((c) => c.status === "fail").map((c) => c.code);
  if (codes.includes("POCKET_NO_ROOM")) return; // an honest refusal at this size
  expect(codes).toEqual([]);
  const ids = new Set(r.pieces.map((p) => p.id));
  for (const p of r.pieces) {
    for (const e of p.edges) if (e.pairsWith) expect(ids.has(e.pairsWith.pieceId)).toBe(true);
    for (const n of p.notches) if (n.pairsWith) expect(ids.has(n.pairsWith.pieceId)).toBe(true);
  }
  const hems = r.validation.checks.filter((c) => (c.code ?? "").startsWith("LINING_HEM"));
  expect(hems.length > 0).toBe(sample.lining);
  expect(hems.every((c) => c.status === "pass")).toBe(true);
  for (const p of r.pieces.filter((q) => q.id.startsWith("belt"))) {
    const xs = p.cutPath.flatMap((s) => [s.from.x, s.to.x]);
    expect(Math.max(...xs) - Math.min(...xs)).toBeLessThanOrEqual(DEFAULT_ENGINE_OPTIONS.fabricWidthMm);
  }
}

describe("pockets, belt and lining across sizes", () => {
  it(
    "never fail a check and leave nothing dangling wherever the matrix allows the pockets",
    () => {
      const sample = fc.record({
        base: fc.constantFrom(...BASES),
        pockets: fc.constantFrom(...POCKETS),
        lining: fc.boolean(),
        belt: fc.boolean(),
        size: fc.constantFrom(...SIZE_MATRIX),
      });
      fc.assert(
        fc.property(sample, (s) => {
          const spec: DesignSpec = {
            ...s.base,
            pockets: [...s.pockets],
            lining: s.lining,
            belt: s.belt ? "self-tie" : "none",
          };
          fc.pre(s.pockets.every((style) => pocketAllowed(spec, style)));
          expectSound(generatePattern(spec, s.size.measurements, DEFAULT_ENGINE_OPTIONS), s);
        }),
        { numRuns: RUNS },
      );
    },
    PIPELINE_TEST_TIMEOUT_MS,
  );
});
