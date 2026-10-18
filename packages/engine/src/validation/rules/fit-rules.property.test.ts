/** Property coverage for every fit-validation rule in issue #133. */
import { SIZE_MATRIX, straightKneeSkirt, vNeckHalfCircleDress } from "@tafsila/test-fixtures";
import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { generatePattern } from "../../pipeline/generate-pattern";
import { rectanglePath, validationContext, validationPiece } from "../test-support";
import { notchAlignmentRule } from "./notches";
import { sleeveCapRule } from "./sleeve-cap";

/** Required fit checks that apply to current bodice and skirt blocks. */
const CURRENT_BLOCK_CHECKS = new Set(["FR-VAL-01", "FR-VAL-03", "FR-VAL-07"]);

describe("fit rules over generated blocks", () => {
  it("keeps seam, circumference and dart rules passing across the size matrix", () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: SIZE_MATRIX.length - 1 }), (index) => {
        const measurements = SIZE_MATRIX[index]!.measurements;
        for (const spec of [vNeckHalfCircleDress, straightKneeSkirt]) {
          const checks = generatePattern(spec, measurements).validation.checks.filter((check) =>
            CURRENT_BLOCK_CHECKS.has(check.id),
          );
          expect(checks.length).toBeGreaterThan(0);
          expect(checks.every((check) => check.status === "pass")).toBe(true);
        }
      }),
      { numRuns: SIZE_MATRIX.length * 2 },
    );
  }, 10_000);
});

describe("fit rules awaiting generated sleeve and notch metadata", () => {
  it("accepts every sleeve-cap ease in the SRS range", () => {
    fc.assert(
      fc.property(fc.integer({ min: 10, max: 40 }), (easeMm) => {
        const armhole = (id: string) =>
          validationPiece({
            id,
            edges: [{ id: "armhole", fromSegment: 0, toSegment: 0, seamAllowanceMm: 10 }],
          });
        const sleeve = validationPiece({
          id: "sleeve",
          stitchPath: rectanglePath(200 + easeMm, 200),
          edges: [{ id: "cap", fromSegment: 0, toSegment: 0, seamAllowanceMm: 10 }],
          sleeveCap: {
            edgeId: "cap",
            armholeRefs: [
              { pieceId: "front", edgeId: "armhole" },
              { pieceId: "back", edgeId: "armhole" },
            ],
          },
        });
        const check = sleeveCapRule.runMany!(
          validationContext([armhole("front"), armhole("back"), sleeve]),
        )[0]!;
        expect(check).toMatchObject({ status: "pass", measuredMm: easeMm });
      }),
    );
  });

  it("accepts every notch offset inside the two-millimetre tolerance", () => {
    fc.assert(
      fc.property(fc.integer({ min: 10, max: 190 }), fc.integer({ min: -2, max: 2 }), (atMm, offsetMm) => {
        const piece = (id: string, partner: string, notchAtMm: number) =>
          validationPiece({
            id,
            edges: validationPiece().edges.map((edge) =>
              edge.id === "side" ? { ...edge, pairsWith: { pieceId: partner, edgeId: "side" } } : edge,
            ),
            notches: [{ id: "balance", edgeId: "side", atMm: notchAtMm }],
          });
        const check = notchAlignmentRule.runMany!(
          validationContext([piece("front", "back", atMm), piece("back", "front", atMm + offsetMm)]),
        )[0]!;
        expect(check.status).toBe("pass");
      }),
    );
  });
});
