import { buildPatternScene, edgeLengthMm, generatePattern } from "@tafsila/engine";
import { seedDress, sizeM } from "@tafsila/test-fixtures";
import { describe, expect, it } from "vitest";
import { pieceDetails } from "./piece-details";

const result = generatePattern(seedDress, sizeM);
const scene = buildPatternScene(result);

describe("pieceDetails", () => {
  it("reads the cut kind from the piece", () => {
    const kinds = new Set(scene.pieces.map((p) => pieceDetails(p).cutKind));
    expect(kinds.has("fold") || kinds.has("pair")).toBe(true);
    for (const p of scene.pieces) {
      const d = pieceDetails(p);
      expect(d.quantity).toBe(p.cut.quantity);
      expect(d.fabric).toBe(p.cut.fabric);
      if (p.cut.onFold) expect(d.cutKind).toBe("fold");
    }
  });

  it("gives size and edge values in cm from the engine numbers", () => {
    const piece = scene.pieces[0]!;
    const source = result.pieces[0]!;
    const d = pieceDetails(piece);
    expect(Number(d.widthCm)).toBeCloseTo(source.bbox.widthMm / 10, 1);
    expect(Number(d.heightCm)).toBeCloseTo(source.bbox.heightMm / 10, 1);
    expect(d.edges).toHaveLength(source.edges.length);
    d.edges.forEach((e, i) => {
      expect(Number(e.lengthCm)).toBeCloseTo(edgeLengthMm(source, source.edges[i]!.id) / 10, 1);
      expect(Number(e.allowanceCm)).toBeCloseTo(source.edges[i]!.seamAllowanceMm / 10, 1);
    });
  });
});
