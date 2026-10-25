import {
  aLineMidiSkirt,
  dartedBlouse,
  onePieceDress,
  seedDress,
  sizeM,
  vNeckBlouse,
} from "@tafsila/test-fixtures";
import { describe, expect, it } from "vitest";
import { edgeLengthMm } from "../pieces/measure";
import { generatePattern } from "../pipeline/generate-pattern";
import { buildPatternScene } from "./scene";
import { measureBetween, resolveRef } from "./scene-queries";

const designs = [seedDress, onePieceDress, dartedBlouse, vNeckBlouse, aLineMidiSkirt];
const result = generatePattern(seedDress, sizeM);
const scene = buildPatternScene(result);

describe("buildPatternScene", () => {
  it("has one scene piece per piece, with the edges of each", () => {
    expect(scene.pieces.map((p) => p.id)).toEqual(result.pieces.map((p) => p.id));
    result.pieces.forEach((piece, i) => {
      expect(scene.pieces[i]!.edges.map((e) => e.id)).toEqual(piece.edges.map((e) => e.id));
    });
  });

  it("gives each edge the length the engine measures", () => {
    for (const piece of result.pieces) {
      for (const edge of scene.pieces.find((p) => p.id === piece.id)!.edges) {
        expect(edge.lengthMm).toBe(edgeLengthMm(piece, edge.id));
      }
    }
  });

  it("offers a snap point for every notch and every corner, inside the sheet", () => {
    for (const piece of scene.pieces) {
      const source = result.pieces.find((p) => p.id === piece.id)!;
      const notchSnaps = piece.snapPoints.filter((s) => s.kind === "notch");
      expect(notchSnaps).toHaveLength(source.notches.length);
      expect(piece.snapPoints.filter((s) => s.kind === "vertex")).toHaveLength(source.stitchPath.length);
      for (const s of piece.snapPoints) {
        expect(s.at.x).toBeGreaterThanOrEqual(-1);
        expect(s.at.x).toBeLessThanOrEqual(scene.widthMm + 1);
      }
    }
  });

  it("is plain data that survives JSON", () => {
    expect(JSON.parse(JSON.stringify(scene))).toEqual(scene);
  });
});

describe("resolveRef", () => {
  it("resolves every ref that names a piece of the sheet", () => {
    const cases = designs.flatMap((design) => {
      const out = generatePattern(design, sizeM);
      const s = buildPatternScene(out);
      const pieceIds = new Set(s.pieces.map((p) => p.id));
      // A few rules still name pieces by their block id (`front/waist`); those name nothing on the sheet.
      return out.validation.checks
        .flatMap((check) => check.refs ?? [])
        .filter((ref) => pieceIds.has(ref.split("/")[0]!))
        .map((ref) => resolveRef(s, ref));
    });
    expect(cases.length).toBeGreaterThan(0);
    expect(cases.every((target) => target !== null)).toBe(true);
  });

  it("names the edge, the dart or the piece", () => {
    const piece = scene.pieces.find((p) => p.edges.length > 0)!;
    expect(resolveRef(scene, piece.id)).toEqual({ pieceId: piece.id });
    expect(resolveRef(scene, `${piece.id}/${piece.edges[0]!.id}`)).toEqual({
      pieceId: piece.id,
      edgeId: piece.edges[0]!.id,
    });
  });

  it("returns null for junk", () => {
    expect(resolveRef(scene, "nope")).toBeNull();
    expect(resolveRef(scene, `${scene.pieces[0]!.id}/nope`)).toBeNull();
    expect(resolveRef(scene, "a/b/c")).toBeNull();
  });
});

describe("measureBetween", () => {
  it("is the straight distance in mm", () => {
    expect(measureBetween({ x: 0, y: 0 }, { x: 30, y: 40 })).toBe(50);
  });
});
