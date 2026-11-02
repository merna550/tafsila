/** Tests for matching the pieces of two drafts (issue #345). */
import { describe, expect, it } from "vitest";
import { matchPieces, overlayBox, type ScenePiece } from "./match-pieces";

/**
 * Builds a minimal piece.
 *
 * @param id - Piece id.
 * @param x - Left of the box.
 * @param w - Width in mm.
 * @returns The piece.
 */
function piece(id: string, x: number, w: number): ScenePiece {
  return {
    id,
    name: { ar: id, en: id },
    cell: { x, y: 0 },
    bboxMm: { widthMm: w, heightMm: 100 },
    cutD: "",
  } as unknown as ScenePiece;
}
const scene = (...pieces: ScenePiece[]) => ({ widthMm: 1000, heightMm: 1000, pieces });

describe("matchPieces", () => {
  it("matches by id and marks identical pieces as same", () => {
    const [m] = matchPieces(scene(piece("front", 0, 300)), scene(piece("front", 50, 300)));
    expect(m?.status).toBe("same");
    expect(m?.shift).toEqual({ x: -50, y: 0 });
  });

  it("marks a different size as changed", () => {
    const [m] = matchPieces(scene(piece("sleeve", 0, 300)), scene(piece("sleeve", 0, 450)));
    expect(m?.status).toBe("changed");
  });

  it("marks a piece only in the first as removed and only in the second as added", () => {
    const result = matchPieces(scene(piece("cuff", 0, 100)), scene(piece("pocket", 0, 100)));
    expect(result.map((m) => [m.id, m.status])).toEqual([
      ["cuff", "removed"],
      ["pocket", "added"],
    ]);
  });
});

describe("overlayBox", () => {
  it("holds both drafts with a margin", () => {
    const box = overlayBox(matchPieces(scene(piece("a", 0, 300)), scene(piece("a", 10, 400))), 10);
    expect(box).toEqual({ x: -10, y: -10, width: 420, height: 120 });
  });

  it("is a small box with no pieces", () => {
    expect(overlayBox([], 10).width).toBeGreaterThan(0);
  });
});
