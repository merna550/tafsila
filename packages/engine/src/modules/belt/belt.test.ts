/** Unit tests of the self-tie belt (issue #145): finished length, split at the fabric width, paired joins. */
import type { PatternResult } from "@tafsila/schemas";
import { patchPocketSkirt, sizeM } from "@tafsila/test-fixtures";
import { describe, expect, it } from "vitest";
import { BELT_TIE_LENGTH_MM, BELT_WAIST_EASE_MM, BELT_WIDTH_MM } from "../../constants/belt";
import { edgeLengthMm } from "../../pieces/measure";
import { DEFAULT_ENGINE_OPTIONS, generatePattern } from "../../pipeline/generate-pattern";
import { beltLengthMm } from "./belt";

/**
 * Drafts the belt skirt at size M for a fabric width.
 *
 * @param fabricWidthMm - Fabric width.
 * @returns The pattern.
 */
function draft(fabricWidthMm: number): PatternResult {
  return generatePattern(patchPocketSkirt, sizeM, { ...DEFAULT_ENGINE_OPTIONS, fabricWidthMm });
}

/**
 * The belt parts of a pattern.
 *
 * @param r - The pattern.
 * @returns The pieces.
 */
function parts(r: PatternResult): PatternResult["pieces"] {
  return r.pieces.filter((p) => /^belt(-\d+)?$/.test(p.id));
}

describe("self-tie belt", () => {
  it("is the waist plus ease plus two ties", () => {
    expect(beltLengthMm(700)).toBe(700 + BELT_WAIST_EASE_MM + 2 * BELT_TIE_LENGTH_MM);
  });

  it("is one piece on wide fabric, 40 mm finished (80 mm cut double)", () => {
    const [belt, ...rest] = parts(draft(3000));
    expect(rest).toEqual([]);
    expect(belt!.id).toBe("belt");
    expect(edgeLengthMm(belt!, "seam-1")).toBeCloseTo(beltLengthMm(sizeM.waist), 6);
    expect(edgeLengthMm(belt!, "start")).toBe(2 * BELT_WIDTH_MM);
  });

  it.each([
    [900, 2],
    [600, 3],
  ])("splits into the fewest equal parts that fit a %i mm fabric: %i", (width, count) => {
    const belt = parts(draft(width));
    expect(belt).toHaveLength(count);
    for (const p of belt) expect(edgeLengthMm(p, "seam-1") + 2 * 15).toBeLessThanOrEqual(width);
    expect(belt[0]!.edges.find((e) => e.id === "end")!.pairsWith).toMatchObject({
      pieceId: "belt-2",
      edgeId: "start",
    });
    expect(belt[1]!.edges.find((e) => e.id === "start")!.pairsWith).toMatchObject({
      pieceId: "belt-1",
      edgeId: "end",
    });
  });

  it("passes the belt length rule and every other check", () => {
    const { checks, status } = draft(900).validation;
    expect(status).not.toBe("fail");
    expect(checks.find((c) => c.code === "BELT_LENGTH_OK")).toBeDefined();
  });
});
