/** Tests of the shared edge builder (issue #128). */
import { DEFAULT_SEAM_ALLOWANCE_MM } from "@tafsila/schemas";
import { describe, expect, it } from "vitest";
import { buildEdges } from "./edges";

const options = { seamAllowance: { defaultsMm: DEFAULT_SEAM_ALLOWANCE_MM, perEdgeMm: { "p/side": 20 } } };

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
      {
        id: "a",
        kind: "other",
        fromSegment: 0,
        toSegment: 0,
        seamAllowanceMm: DEFAULT_SEAM_ALLOWANCE_MM.other,
      },
      {
        id: "side",
        kind: "side",
        fromSegment: 1,
        toSegment: 3,
        seamAllowanceMm: 20,
        pairsWith: { pieceId: "q", edgeId: "side" },
      },
      { id: "cf", kind: "fold", fromSegment: 4, toSegment: 4, seamAllowanceMm: 0 },
    ]);
  });
});
