/** Tests of the shared edge builder (issue #128). */
import { DEFAULT_SEAM_ALLOWANCE_MM } from "@tafsila/schemas";
import { describe, expect, it } from "vitest";
import { buildEdges, seamAllowanceFor } from "./edges";

const options = { seamAllowance: { defaultsMm: DEFAULT_SEAM_ALLOWANCE_MM, perEdgeMm: { "p/side": 20 } } };

describe("seamAllowanceFor", () => {
  it("uses the per-edge value first, then the kind default; a fold has none", () => {
    expect(seamAllowanceFor(options, "p", "side", "side")).toBe(20);
    expect(seamAllowanceFor(options, "q", "side", "side")).toBe(DEFAULT_SEAM_ALLOWANCE_MM.side);
    expect(seamAllowanceFor(options, "p", "neck", "neckline")).toBe(DEFAULT_SEAM_ALLOWANCE_MM.neckline);
    const foldOverride = {
      seamAllowance: { defaultsMm: DEFAULT_SEAM_ALLOWANCE_MM, perEdgeMm: { "p/cb": 9 } },
    };
    expect(seamAllowanceFor(foldOverride, "p", "cb", "fold")).toBe(0);
  });
});

describe("buildEdges", () => {
  it("turns segment counts into consecutive ranges and keeps pairsWith", () => {
    const edges = buildEdges(
      "p",
      [
        { id: "a", kind: "other", segments: 1 },
        { id: "side", kind: "side", segments: 3, pairsWith: { pieceId: "q", edgeId: "side" } },
        { id: "cf", kind: "fold", segments: 1 },
      ],
      options,
    );
    expect(edges).toEqual([
      { id: "a", fromSegment: 0, toSegment: 0, seamAllowanceMm: DEFAULT_SEAM_ALLOWANCE_MM.other },
      {
        id: "side",
        fromSegment: 1,
        toSegment: 3,
        seamAllowanceMm: 20,
        pairsWith: { pieceId: "q", edgeId: "side" },
      },
      { id: "cf", fromSegment: 4, toSegment: 4, seamAllowanceMm: 0 },
    ]);
  });
});
