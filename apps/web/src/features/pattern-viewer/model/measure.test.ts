import { buildPatternScene, generatePattern } from "@tafsila/engine";
import { seedDress, sizeM } from "@tafsila/test-fixtures";
import { describe, expect, it } from "vitest";
import { MEASURE_ON, allSnapPoints, measuredMm, nearestSnap, nextMeasure } from "./measure";
import type { SnapPoint } from "./types";

const scene = buildPatternScene(generatePattern(seedDress, sizeM));
const pts: SnapPoint[] = [
  { id: "a", pieceId: "p", at: { x: 0, y: 0 }, kind: "vertex" },
  { id: "b", pieceId: "p", at: { x: 30, y: 40 }, kind: "vertex" },
];

describe("nearestSnap", () => {
  it("picks the closest point within the radius", () => {
    expect(nearestSnap(pts, { x: 28, y: 38 }, 5)?.id).toBe("b");
  });
  it("returns null outside the radius", () => {
    expect(nearestSnap(pts, { x: 15, y: 20 }, 5)).toBeNull();
  });
});

describe("nextMeasure", () => {
  it("fills one, two, then restarts with the new point", () => {
    const one = nextMeasure(MEASURE_ON, pts[0]!);
    expect(one.points).toHaveLength(1);
    const two = nextMeasure(one, pts[1]!);
    expect(measuredMm(two)).toBe(50);
    expect(nextMeasure(two, pts[0]!).points.map((p) => p.id)).toEqual(["a"]);
  });
  it("has no distance before two points", () => {
    expect(measuredMm(MEASURE_ON)).toBeNull();
  });
});

describe("measuring a real edge", () => {
  it("collects every snap point of the scene and gives a positive distance for a pair", () => {
    const piece = scene.pieces[0]!;
    const verts = piece.snapPoints.filter((p) => p.kind === "vertex");
    expect(allSnapPoints(scene).length).toBeGreaterThan(verts.length);
    const [a, b] = verts;
    expect(measuredMm({ active: true, points: [a!, b!] })).toBeGreaterThan(0);
  });
});
