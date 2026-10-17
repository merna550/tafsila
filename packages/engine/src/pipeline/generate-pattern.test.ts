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
      widthMm: 200,
      heightMm: 300,
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

  it("finishes the rectangle pipeline quickly (guard; the real target is FR-PAT-04)", () => {
    // Since #128 the dress also drafts the bodice block. The guard measures the steady-state cost of one run:
    // warm up so the JIT has compiled the drafting code (a cold run on a loaded CI runner was 7-8 ms while a
    // warm one is well under 1 ms), then take the median of several runs. The 5 ms target is unchanged.
    const warmUps = 50;
    const runs = 21;
    for (let i = 0; i < warmUps; i += 1)
      generatePattern(vNeckHalfCircleDress, sizeM, options, rectangleRegistry);
    const timesMs = Array.from({ length: runs }, () => {
      const start = performance.now();
      generatePattern(vNeckHalfCircleDress, sizeM, options, rectangleRegistry);
      return performance.now() - start;
    }).sort((a, b) => a - b);
    expect(timesMs[Math.floor(runs / 2)]).toBeLessThan(5);
  });

  it("uses default options and the empty default registry: only the bodice block pieces", () => {
    const result = generatePattern(vNeckHalfCircleDress, sizeM);
    expect(result.pieces.map((p) => p.id)).toEqual(["bodice-back", "bodice-front"]);
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
