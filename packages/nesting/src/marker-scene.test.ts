import { DEFAULT_FABRIC_OPTIONS, fabricOptionsSchema } from "@tafsila/schemas";
import { describe, expect, it } from "vitest";
import { fabricResult } from "./fabric-result";
import { buildMarkerScene } from "./marker-scene";
import { fixturePattern } from "./test-support/fixtures";

/**
 * Every number in a path.
 *
 * @param d - Path data.
 * @returns Pairs of x and y.
 */
function points(d: string): [number, number][] {
  const n = d.replace(/[MLZ]/g, " ").trim().split(/\s+/).map(Number);
  return Array.from({ length: n.length / 2 }, (_, i) => [n[2 * i]!, n[2 * i + 1]!]);
}

describe("buildMarkerScene", () => {
  it("draws every placement inside the strip, with the fold and selvedge lines", () => {
    const pattern = fixturePattern("linedSidePocketDress", "M");
    const result = fabricResult(pattern, DEFAULT_FABRIC_OPTIONS);
    const scene = buildMarkerScene(pattern, result.prepared, result.main);
    expect(scene.pieces.map((p) => p.shapeId)).toEqual(result.main.placements.map((p) => p.shapeId));
    expect(scene).toMatchObject({ kind: "main", layout: "folded", heightMm: 700 });
    expect(scene.widthMm).toBe(result.main.stripLengthMm);
    for (const piece of scene.pieces) {
      expect(piece.cutD.endsWith("Z")).toBe(true);
      expect(piece.name.en.length).toBeGreaterThan(0);
      for (const [x, y] of [...points(piece.cutD), ...points(piece.grainD)]) {
        expect(x).toBeGreaterThanOrEqual(0);
        expect(x).toBeLessThanOrEqual(scene.widthMm + 0.01);
        expect(y).toBeGreaterThanOrEqual(0);
        expect(y).toBeLessThanOrEqual(scene.heightMm + 0.01);
      }
    }
    expect(scene.lines.map((l) => l.kind)).toEqual(["fold", "selvedge"]);
  });

  it("draws two selvedges for an open layout", () => {
    const pattern = fixturePattern("setInSleeveBlouse", "M");
    const result = fabricResult(pattern, fabricOptionsSchema.parse({ layout: "open" }));
    const scene = buildMarkerScene(pattern, result.prepared, result.lining);
    expect(scene.pieces).toEqual([]);
    expect(scene.lines.map((l) => l.kind)).toEqual(["selvedge", "selvedge"]);
    expect(scene.lines[0]!.d).toBe("M0.00 0.00 L0.00 0.00");
  });
});
