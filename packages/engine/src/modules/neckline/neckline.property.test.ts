/**
 * Property tests of the neckline module (issue #139): every front × back combination across the size matrix
 * drafts closed, simple stitch and cut lines (FR-VAL-05), the facings match the neck within 2 mm and the facing
 * shoulders match each other (FR-VAL-01), on every bodice shaping; random bodies and depth overrides never throw,
 * and the head-opening warning is deterministic (FR-VAL-08).
 */
import type { DesignSpec, Measurements, PatternResult } from "@tafsila/schemas";
import { SIZE_MATRIX, arbMeasurements, dartedBlouse } from "@tafsila/test-fixtures";
import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { BACK_NECKLINE_SIZES, FRONT_NECKLINE_SIZES } from "../../constants/neckline";
import { isClosed, selfIntersections } from "../../geometry";
import { DEFAULT_ENGINE_OPTIONS, generatePattern } from "../../pipeline/generate-pattern";
import { FACING_PIECE_IDS } from "./facing";
import type { NecklineSpec } from "./resolve";

type Shaping = NonNullable<DesignSpec["bodice"]>["shaping"];

const FRONTS = Object.keys(FRONT_NECKLINE_SIZES) as NecklineSpec["front"][];
const BACKS = Object.keys(BACK_NECKLINE_SIZES) as NecklineSpec["back"][];
const SHAPINGS: readonly Shaping[] = ["darts", "princess-shoulder", "princess-armhole", "none"];

/** SRS seam tolerance (FR-VAL-01). */
const SEAM_MM = 2;

/** Wall-clock allowance on a busy CI runner with coverage; locally each test takes well under a tenth of it. */
const PIPELINE_TEST_TIMEOUT_MS = 30_000;

/** Random bodies per run: enough to hit every style and shaping several times. */
const RANDOM_RUNS = 40;

/**
 * The seed blouse with a neckline and a shaping.
 *
 * @param neckline - Front, back and optional depth.
 * @param shaping - Bodice shaping.
 * @param closure - Closure; the seed's centre-back zip by default.
 * @returns The design.
 */
function design(
  neckline: Omit<NecklineSpec, "collar">,
  shaping: Shaping,
  closure: DesignSpec["closure"] = dartedBlouse.closure,
): DesignSpec {
  return {
    ...dartedBlouse,
    bodice: { ...dartedBlouse.bodice!, shaping },
    neckline: { ...neckline, collar: "none" },
    closure,
  };
}

/**
 * Asserts the geometry and seam rules a neckline must keep.
 *
 * @param r - The pattern.
 * @param label - Case label for failures.
 * @param neckOnly - Check only the pieces that hold a neck (the bodice shaping of random bodies is #138's to test).
 */
function expectSound(r: PatternResult, label: string, neckOnly = false): void {
  for (const p of r.pieces.filter((x) => !neckOnly || x.edges.some((e) => e.id === "neck"))) {
    expect(isClosed(p.stitchPath) && isClosed(p.cutPath), `${label} ${p.id} closed`).toBe(true);
    expect(selfIntersections(p.stitchPath), `${label} ${p.id} stitch`).toEqual([]);
    expect(selfIntersections(p.cutPath), `${label} ${p.id} cut`).toEqual([]);
  }
  const facingSeams = r.validation.checks.filter(
    (c) => c.id === "FR-VAL-01" && c.refs?.some((ref) => ref.startsWith("neck-facing")),
  );
  expect(facingSeams, label).toHaveLength(Object.keys(FACING_PIECE_IDS).length + 1);
  for (const c of facingSeams)
    expect(Math.abs(c.measuredMm ?? 0), `${label} ${c.refs?.join(" ")}`).toBeLessThanOrEqual(SEAM_MM);
  if (neckOnly) return;
  const structural = r.validation.checks.filter((c) => c.id === "FR-VAL-05" && c.status !== "pass");
  expect(structural, label).toEqual([]);
}

describe.each(FRONTS)("front %s across the size matrix", (front) => {
  it.each(BACKS)(
    "with a %s back: closed, simple, facings within 2 mm",
    (back) => {
      SIZE_MATRIX.forEach((entry, i) => {
        const shaping = SHAPINGS[i % SHAPINGS.length]!;
        const r = generatePattern(design({ front, back }, shaping), entry.measurements);
        expect(r.pieces.length, `${entry.id} ${shaping}`).toBeGreaterThan(0);
        expectSound(r, `${entry.id} ${front}/${back} ${shaping}`);
      });
    },
    PIPELINE_TEST_TIMEOUT_MS,
  );
});

/**
 * A random neckline, shaping and optional front depth. Princess panels on random bodies are #138's to test (their
 * side panels can refuse an extreme body); the matrix test above covers every shaping.
 */
const arbCase = fc.record({
  front: fc.constantFrom(...FRONTS),
  back: fc.constantFrom(...BACKS),
  shaping: fc.constantFrom<Shaping>("darts", "none"),
  depthFrontMm: fc.option(fc.integer({ min: 1, max: 400 }), { nil: undefined }),
});

describe("necklines on random bodies", () => {
  it(
    "never throw: a sound pattern, or a fail with a BODICE_ or MEAS_ code",
    () => {
      fc.assert(
        fc.property(arbMeasurements(), arbCase, (m: Measurements, c) => {
          const neckline = c.depthFrontMm === undefined ? { front: c.front, back: c.back } : c;
          const r = generatePattern(design(neckline, c.shaping), m);
          if (r.pieces.length === 0) {
            expect(r.validation.checks.some((x) => /^(BODICE_|MEAS_)/.test(x.code ?? ""))).toBe(true);
            return;
          }
          expectSound(r, JSON.stringify(c), true);
        }),
        { numRuns: RANDOM_RUNS },
      );
    },
    PIPELINE_TEST_TIMEOUT_MS,
  );

  it(
    "report the head-opening check the same way twice when nothing opens at the neck",
    () => {
      fc.assert(
        fc.property(arbMeasurements(), fc.constantFrom(...FRONTS), (m, front) => {
          const spec = design({ front, back: "round" }, "darts", { type: "none", position: "center-back" });
          const first = generatePattern(spec, m, DEFAULT_ENGINE_OPTIONS);
          const again = generatePattern(spec, m, DEFAULT_ENGINE_OPTIONS);
          const head = (r: PatternResult) =>
            r.validation.checks.filter((c) => c.code?.startsWith("NECK_HEAD_"));
          expect(head(first)).toEqual(head(again));
          if (first.pieces.length > 0) expect(head(first)).toHaveLength(1);
        }),
        { numRuns: RANDOM_RUNS },
      );
    },
    PIPELINE_TEST_TIMEOUT_MS,
  );
});
