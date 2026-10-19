/** Unit tests of the shared neck seam lookup (issues #139, #141): the holder pieces and their neck lengths. */
import { dartedBlouse, princessShoulderBlouse, sizeM } from "@tafsila/test-fixtures";
import { describe, expect, it } from "vitest";
import { DraftingError } from "../errors/drafting-error";
import { pathLength } from "../geometry";
import { DEFAULT_ENGINE_OPTIONS, generatePattern } from "../pipeline/generate-pattern";
import type { PieceDraft } from "../pipeline/draft-context";
import { neckHolders, neckPiece } from "./neck-seam";

/**
 * The drafted pieces of a design for size M.
 *
 * @param spec - The design.
 * @returns The pieces.
 */
function pieces(spec: typeof dartedBlouse): PieceDraft[] {
  return generatePattern(spec, sizeM, DEFAULT_ENGINE_OPTIONS).pieces;
}

describe("neckHolders", () => {
  it("finds the darted block halves and measures their necks", () => {
    const holders = neckHolders(pieces(dartedBlouse));
    expect(holders.front.piece.id).toBe("bodice-front");
    expect(holders.back.piece.id).toBe("bodice-back");
    expect(holders.front.lengthMm).toBeCloseTo(pathLength(holders.front.neck), 9);
    expect(holders.front.neck[0]!.from.x).toBeCloseTo(0, 6);
  });

  it("finds the princess centre panels", () => {
    const holders = neckHolders(pieces(princessShoulderBlouse));
    expect(holders.front.piece.id).toBe("bodice-front-centre");
    expect(holders.back.piece.id).toBe("bodice-back-centre");
  });

  it("refuses when no bodice piece holds the neck", () => {
    expect(() => neckPiece([], "front")).toThrow(DraftingError);
  });
});
