import { type DesignSpec, sewingStepSchema } from "@tafsila/schemas";
import * as fixtures from "@tafsila/test-fixtures";
import { SIZE_MATRIX } from "@tafsila/test-fixtures";
import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { generatePattern } from "../pipeline/generate-pattern";
import { SEWING_CATALOGUE } from "./catalogue";
import { sewingCoverage } from "./coverage";
import { refExists } from "./refs";

const DESIGNS = Object.entries(fixtures).filter(
  (entry): entry is [string, DesignSpec] =>
    typeof entry[1] === "object" && entry[1] !== null && "category" in entry[1] && "closure" in entry[1],
);

/**
 * Runs the engine and returns the result, or undefined when the input is refused.
 *
 * @param spec - The design.
 * @param entry - The body.
 * @returns The result or undefined.
 */
function run(spec: DesignSpec, entry: (typeof SIZE_MATRIX)[number]) {
  const result = generatePattern(spec, entry.measurements);
  return result.pieces.length > 0 ? result : undefined;
}

describe("sewing order, every design in the catalogue (FR-PAT-06, AC 1, AC 2)", () => {
  it("has designs to test", () => {
    expect(DESIGNS.length).toBeGreaterThan(30);
  });

  it("covers each seam exactly once, numbers steps 1..n and only names real pieces, edges and darts", () => {
    fc.assert(
      fc.property(fc.constantFrom(...DESIGNS), fc.constantFrom(...SIZE_MATRIX), ([, spec], entry) => {
        const result = run(spec, entry);
        if (!result) return;
        expect(sewingCoverage(result)).toEqual({ ok: true, uncovered: [], duplicated: [] });
        expect(result.sewingOrder.map((s) => s.order)).toEqual(result.sewingOrder.map((_, i) => i + 1));
        expect(result.sewingOrder.length).toBeGreaterThan(0);
        for (const step of result.sewingOrder) {
          expect(step.edges.length).toBeGreaterThan(0);
          for (const ref of step.edges) expect(refExists(result.pieces, ref)).toBe(true);
        }
        for (const step of result.sewingOrder) expect(sewingStepSchema.safeParse(step).success).toBe(true);
      }),
      { numRuns: 120 },
    );
  });

  it("is deterministic", () => {
    const entry = SIZE_MATRIX[1]!;
    for (const [, spec] of DESIGNS.slice(0, 10)) {
      expect(generatePattern(spec, entry.measurements).sewingOrder).toEqual(
        generatePattern(spec, entry.measurements).sewingOrder,
      );
    }
  });

  it("uses only catalogue text, in Arabic without Latin letters", () => {
    for (const entry of Object.values(SEWING_CATALOGUE)) {
      expect(entry.text.en.length).toBeGreaterThan(0);
      expect(entry.text.ar).not.toMatch(/[A-Za-z]/);
    }
  });
});
