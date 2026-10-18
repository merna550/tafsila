/** Tests for generatePattern: result shape, determinism, refused input, purity, speed. */
import { patternResultSchema } from "@tafsila/schemas";
import { sizeM, vNeckHalfCircleDress } from "@tafsila/test-fixtures";
import { describe, expect, it } from "vitest";
import { DraftingError } from "../errors/drafting-error";
import { deepFreeze } from "../test-utils/deep-freeze";
import { DEFAULT_ENGINE_OPTIONS, generatePattern } from "./generate-pattern";
import { createRegistry } from "./registry";
import { RECTANGLE_PIECE_ID, rectangleModule, rectangleRegistry } from "./test-support/rectangle-module";

const options = { ...DEFAULT_ENGINE_OPTIONS, sizeLabel: "M" };

/**
 * Smoke budget for one rectangle run, in ms. Only a guard against a gross slowdown: CI runners are slower and noisy
 * (one 18 ms run was seen), so it is far above a local run yet far under the real FR-PAT-04 budget of 500 ms,
 * which #147 measures properly.
 */
const PIPELINE_SMOKE_BUDGET_MS = 250;
/** Wall-clock allowance for the many warm-up runs on a busy shared CI runner. */
const PIPELINE_SMOKE_TEST_TIMEOUT_MS = 30_000;
/** Untimed runs first, so the timing is the steady-state cost and not JIT compilation (#128). */
const SMOKE_WARM_UPS = 50;
/** Timed runs after the warm-ups; the median ignores a single slow run (GC pause, busy runner). */
const SMOKE_RUNS = 20;

describe("generatePattern with the rectangle module", () => {
  it("returns a schema-valid result with the bodice and rectangle pieces and a passing FR-VAL-06", () => {
    const result = generatePattern(vNeckHalfCircleDress, sizeM, options, rectangleRegistry);
    expect(patternResultSchema.safeParse(result).success).toBe(true);
    expect(result.pieces.map((p) => p.id)).toEqual(["bodice-back", "bodice-front", RECTANGLE_PIECE_ID]);
    expect(result.validation.checks.find((c) => c.id === "FR-VAL-06")?.status).toBe("pass");
    expect(result.validation.status).toBe("pass");
    expect(result.meta).toMatchObject({ category: "dress", sizeLabel: "M" });
    expect(result.meta.createdFrom).toMatch(/^fnv1a64:[0-9a-f]{16}$/);
    expect(result.pieces.find((p) => p.id === RECTANGLE_PIECE_ID)?.bbox).toEqual({
      widthMm: 215,
      heightMm: 345,
    });
  });

  it("is deterministic and does not change frozen inputs", () => {
    const args = [
      deepFreeze(structuredClone(vNeckHalfCircleDress)),
      deepFreeze(structuredClone(sizeM)),
      deepFreeze({ ...options }),
    ] as const;
    const a = generatePattern(...args, rectangleRegistry);
    const b = generatePattern(...args, rectangleRegistry);
    expect(a).toEqual(b);
    expect(Object.isFrozen(a)).toBe(true);
  });

  it(
    "finishes the rectangle pipeline quickly (guard; the real target is FR-PAT-04)",
    () => {
      // Since #128 the dress also drafts the bodice block: warm up so the JIT has compiled the drafting code
      // before timing. The median budget still guards speed; the test timeout only allows slow shared runners.
      for (let i = 0; i < SMOKE_WARM_UPS; i += 1)
        generatePattern(vNeckHalfCircleDress, sizeM, options, rectangleRegistry);
      const timesMs = Array.from({ length: SMOKE_RUNS }, () => {
        const start = performance.now();
        generatePattern(vNeckHalfCircleDress, sizeM, options, rectangleRegistry);
        return performance.now() - start;
      }).sort((a, b) => a - b);
      expect(timesMs[Math.floor(SMOKE_RUNS / 2)]!).toBeLessThan(PIPELINE_SMOKE_BUDGET_MS);
    },
    PIPELINE_SMOKE_TEST_TIMEOUT_MS,
  );

  it("uses default options and the default registry to draft the bodice and skirt blocks", () => {
    const result = generatePattern(vNeckHalfCircleDress, sizeM);
    const ids = result.pieces.map((p) => p.id);
    expect(ids).toContain("bodice-back");
    expect(ids).toContain("bodice-front");
    expect(ids).toContain("skirt-front");
    expect(ids).toContain("skirt-back");
    expect(result.validation.status).toBe("pass");
  });

  it("keeps measurement warnings as warn checks without stopping", () => {
    const result = generatePattern(
      vNeckHalfCircleDress,
      { ...sizeM, waist: 1100, hip: 1000 },
      options,
      rectangleRegistry,
    );
    expect(result.validation.status).toBe("warn");
    expect(result.validation.checks.some((c) => c.code === "MEAS_WAIST_NOT_BELOW_HIP")).toBe(true);
    expect(result.pieces.some((p) => p.id === RECTANGLE_PIECE_ID)).toBe(true);
  });
});

describe("generatePattern with bad input", () => {
  it("fails with the MEAS code when high bust is above bust, and does not throw", () => {
    const result = generatePattern(
      vNeckHalfCircleDress,
      { ...sizeM, highBust: 1000 },
      options,
      rectangleRegistry,
    );
    expect(result.validation.status).toBe("fail");
    expect(result.pieces).toEqual([]);
    expect(result.validation.checks[0]).toMatchObject({
      id: "FR-MEAS-01",
      code: "MEAS_HIGH_BUST_EXCEEDS_BUST",
    });
    expect(patternResultSchema.safeParse(result).success).toBe(true);
  });

  it("fails with SPEC_INVALID for a malformed spec", () => {
    const result = generatePattern({ category: "coat" }, sizeM, options);
    expect(result.validation.checks.map((c) => c.code)).toContain("SPEC_INVALID");
    expect(result.meta.category).toBe("dress");
  });

  it("fails with MEAS_INVALID and OPTIONS_INVALID for malformed measurements and options", () => {
    const result = generatePattern(
      { ...vNeckHalfCircleDress, category: "skirt" },
      { bust: 1 },
      { sizeLabel: "S" },
    );
    const codes = result.validation.checks.map((c) => c.code);
    expect(codes).toEqual(expect.arrayContaining(["MEAS_INVALID", "OPTIONS_INVALID"]));
    expect(result.meta).toMatchObject({ category: "skirt", sizeLabel: "S" });
  });

  it("copes with input that cannot be written as JSON", () => {
    const result = generatePattern(null, sizeM, { ...options, fabricWidthMm: Number.NaN });
    expect(result.validation.status).toBe("fail");
    expect(result.meta.createdFrom).toBe("fnv1a64:invalid");
    expect(result.meta.sizeLabel).toBe("M");
  });
});

describe("generatePattern programming errors", () => {
  it("throws for a skirt with a bodice part", () => {
    const spec = { ...vNeckHalfCircleDress, category: "skirt" };
    expect(() => generatePattern(spec, sizeM, options)).toThrow(DraftingError);
  });

  it("throws on a duplicate module id", () => {
    expect(() => createRegistry([rectangleModule, rectangleModule])).toThrow(/share the id/);
  });
});
