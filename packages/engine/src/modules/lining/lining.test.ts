/** Unit tests of the lining module (issue #145): copies, lining fabric, raised hem, pairs and what is not lined. */
import type { PatternResult, Piece } from "@tafsila/schemas";
import { linedCircleSkirt, linedSidePocketDress, sizeM } from "@tafsila/test-fixtures";
import { describe, expect, it } from "vitest";
import { LINING_HEM_RISE_MM } from "../../constants/lining";
import { samplePath } from "../../geometry";
import { edgeSegments } from "../../pieces/measure";
import { DEFAULT_ENGINE_OPTIONS, generatePattern } from "../../pipeline/generate-pattern";

/** Wall-clock allowance for full pipeline runs on a busy CI runner with coverage. */
const PIPELINE_TEST_TIMEOUT_MS = 30_000;

/**
 * Drafts a design at size M.
 *
 * @param spec - The design.
 * @returns The pattern.
 */
function draft(spec: typeof linedSidePocketDress): PatternResult {
  return generatePattern(spec, sizeM, DEFAULT_ENGINE_OPTIONS);
}

/**
 * The lowest y of a piece's hem.
 *
 * @param p - A piece with a hem.
 * @returns Largest y.
 */
function hemY(p: Piece): number {
  return Math.max(...samplePath(edgeSegments(p, "hem")).map((q) => q.y));
}

describe("lining", () => {
  const dress = draft(linedSidePocketDress);

  it("copies each bodice and skirt piece in lining fabric and nothing else", () => {
    const lined = dress.pieces.filter((p) => p.id.startsWith("lining-"));
    expect(lined.map((p) => p.id).sort((a, b) => a.localeCompare(b, "en"))).toEqual([
      "lining-bodice-back",
      "lining-bodice-front",
      "lining-skirt-back",
      "lining-skirt-front",
    ]);
    for (const p of lined) {
      const shell = dress.pieces.find((s) => s.id === p.id.slice("lining-".length))!;
      expect(p.cut).toEqual({ ...shell.cut, fabric: "lining" });
    }
    const ids = dress.pieces.map((p) => p.id);
    for (const never of ["lining-sleeve", "lining-neck-facing-front", "lining-pocket-bag-front"]) {
      expect(ids).not.toContain(never);
    }
  });

  it("raises the hem 25 mm on a straight skirt and on a circle skirt", () => {
    for (const result of [dress, draft(linedCircleSkirt)]) {
      const shell = result.pieces.find((p) => p.id === "skirt-front")!;
      const lining = result.pieces.find((p) => p.id === "lining-skirt-front")!;
      expect(hemY(shell) - hemY(lining)).toBeGreaterThanOrEqual(LINING_HEM_RISE_MM - 2);
      expect(lining.edges.find((e) => e.id === "hem")!.seamAllowanceMm).toBe(20);
    }
  });

  it(
    "pairs lining with lining and keeps the shell bodice and skirt waist lines unique",
    () => {
      const side = dress.pieces
        .find((p) => p.id === "lining-skirt-front")!
        .edges.find((e) => e.id === "side")!;
      expect(side.pairsWith).toMatchObject({ pieceId: "lining-skirt-back" });
      expect(
        dress.pieces.filter((p) => p.bodyLines.length > 0).every((p) => !p.id.startsWith("lining-")),
      ).toBe(true);
      expect(dress.validation.status).not.toBe("fail");
      expect(dress.validation.checks.some((c) => c.code === "LINING_HEM_CLEARANCE_OK")).toBe(true);
    },
    PIPELINE_TEST_TIMEOUT_MS,
  );
});
