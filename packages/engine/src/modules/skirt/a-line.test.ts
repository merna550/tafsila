/** Unit tests of the A-line transfer: dart closed into the hem, waist and hip kept (issue #135). */
import { aLineMidiSkirt, SIZE_MATRIX } from "@tafsila/test-fixtures";
import { describe, expect, it } from "vitest";
import { skirtBlockModule } from "../../blocks/skirt/skirt-module";
import { SKIRT_SEGMENT } from "../../blocks/skirt/edges";
import { isClosed, selfIntersections } from "../../geometry";
import { bodyLineLengthMm } from "../../pieces/body-lines";
import { edgeLengthMm } from "../../pieces/measure";
import { createContext, type PieceDraft } from "../../pipeline/draft-context";
import { DEFAULT_ENGINE_OPTIONS } from "../../pipeline/generate-pattern";
import { resolveDraftInputs } from "../../resolve/resolve-draft-inputs";
import { deepFreeze } from "../../test-utils/deep-freeze";
import { A_LINE_SEGMENT, aLinePiece } from "./a-line";

const sizeM = SIZE_MATRIX.find((e) => e.id === "size-m")!.measurements;
const { hipDepthMm } = resolveDraftInputs(aLineMidiSkirt, sizeM, DEFAULT_ENGINE_OPTIONS);
const blocks = skirtBlockModule.draft(createContext(aLineMidiSkirt, sizeM, DEFAULT_ENGINE_OPTIONS)).pieces;
const front = deepFreeze(blocks.find((p) => p.id === "skirt-front")!);
const back = blocks.find((p) => p.id === "skirt-back")!;

/**
 * The hip body line of a piece, measured on its geometry.
 *
 * @param piece - Skirt piece.
 * @returns Hip width in mm.
 */
function hipWidthMm(piece: PieceDraft): number {
  return bodyLineLengthMm(
    piece,
    piece.bodyLines.find((l) => l.id === "skirt-hip")!,
  )!;
}

describe("aLinePiece", () => {
  const { piece, hemGainMm } = aLinePiece(front, "front", hipDepthMm);

  it("closes the waist dart: no dart left and the waist keeps its sewn length within 1 mm", () => {
    expect(piece.darts).toEqual([]);
    expect(edgeLengthMm(piece, "waist")).toBeCloseTo(edgeLengthMm(front, "waist", { closeDarts: true }), 0);
  });

  it("keeps the hip width along the bent hip line exactly", () => {
    expect(piece.bodyLines.find((l) => l.id === "skirt-hip")!.kind).toBe("polyline");
    expect(hipWidthMm(piece)).toBeCloseTo(hipWidthMm(front), 6);
  });

  it("widens the hem by the declared gain (the chord the turn opens at the hem)", () => {
    expect(hemGainMm).toBeGreaterThan(0);
    const grownMm = edgeLengthMm(piece, "hem") - edgeLengthMm(front, "hem");
    expect(grownMm).toBeGreaterThanOrEqual(hemGainMm - 0.01);
    expect(grownMm).toBeLessThanOrEqual(hemGainMm + 1);
  });

  it("keeps the side seam length and the centre-line length", () => {
    expect(edgeLengthMm(piece, "side")).toBeCloseTo(edgeLengthMm(front, "side"), 6);
    expect(piece.stitchPath[A_LINE_SEGMENT.centre]).toEqual(front.stitchPath[SKIRT_SEGMENT.centre]);
  });

  it("draws a closed outline with no crossings, in the block's edge names", () => {
    expect(isClosed(piece.stitchPath)).toBe(true);
    expect(selfIntersections(piece.stitchPath)).toEqual([]);
    expect(piece.edges.map((e) => [e.id, e.fromSegment, e.toSegment])).toEqual([
      ["waist", 0, 1],
      ["side", 2, 3],
      ["hem", 4, 6],
      ["cf", 7, 7],
    ]);
  });

  it("opens the back more than the front: its dart is wider", () => {
    expect(aLinePiece(back, "back", hipDepthMm).hemGainMm).toBeGreaterThan(hemGainMm);
  });

  it("returns a block with no dart unchanged, with no gain", () => {
    const flat = { ...front, darts: [] };
    expect(aLinePiece(flat, "front", hipDepthMm)).toEqual({ piece: flat, hemGainMm: 0 });
  });

  it("refuses a pivot outside the piece", () => {
    expect(() => aLinePiece(front, "front", -1e6)).toThrow(
      expect.objectContaining({ code: "SKIRT_A_LINE_PIVOT_OUTSIDE" }),
    );
  });
});
