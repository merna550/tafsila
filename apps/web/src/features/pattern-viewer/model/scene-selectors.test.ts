import { buildPatternScene, generatePattern } from "@tafsila/engine";
import { seedDress, sizeM } from "@tafsila/test-fixtures";
import { describe, expect, it } from "vitest";
import { gridPaths, isPartTargeted, isPieceTargeted, targetBox } from "./scene-selectors";

const scene = buildPatternScene(generatePattern(seedDress, sizeM));
const piece = scene.pieces[0]!;

describe("targetBox", () => {
  it("is the piece box for a piece and sits inside the sheet", () => {
    const box = targetBox(scene, [{ pieceId: piece.id }])!;
    expect(box).toEqual({ x: piece.cell.x, y: piece.cell.y, ...piece.bboxMm });
    expect(box.x + box.widthMm).toBeLessThanOrEqual(scene.widthMm + 1);
  });

  it("is smaller for an edge than for its piece", () => {
    const edge = targetBox(scene, [{ pieceId: piece.id, edgeId: piece.edges[0]!.id }])!;
    expect(edge.widthMm * edge.heightMm).toBeLessThanOrEqual(
      piece.bboxMm.widthMm * piece.bboxMm.heightMm + 1,
    );
  });

  it("joins several targets and ignores unknown ones", () => {
    const both = targetBox(scene, [{ pieceId: scene.pieces[0]!.id }, { pieceId: scene.pieces[1]!.id }])!;
    expect(both.widthMm).toBeGreaterThan(piece.bboxMm.widthMm);
    expect(targetBox(scene, [{ pieceId: "nope" }])).toBeNull();
  });
});

describe("isPieceTargeted and isPartTargeted", () => {
  it("tell a piece target from an edge target", () => {
    const list = [{ pieceId: "a", edgeId: "hem" }];
    expect(isPieceTargeted(list, "a")).toBe(false);
    expect(isPartTargeted(list, "a", { edgeId: "hem" })).toBe(true);
    expect(isPartTargeted(list, "a", { edgeId: "neck" })).toBe(false);
    expect(isPieceTargeted([{ pieceId: "a" }], "a")).toBe(true);
  });
});

describe("gridPaths", () => {
  it("puts strong lines on every 100 mm", () => {
    const grid = gridPaths({ widthMm: 200, heightMm: 100 });
    expect(grid.major).toContain("M 100 0 V 100");
    expect(grid.minor).toContain("M 10 0 V 100");
    expect(grid.minor).not.toContain("M 100 0");
  });
});
