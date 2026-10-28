import { pointInPolygon, samplePath, distancePointToPolyline } from "@tafsila/engine/geometry";
import { describe, expect, it } from "vitest";
import { flattenPath, nestingOutline, offsetOutward, simplifyPolygon, simplifyPolyline } from "./flatten";
import { polygonPath } from "./test-support/pieces";

/** A closed path with one cubic bulge on its top edge. */
const bulge = [
  { kind: "line" as const, from: { x: 0, y: 0 }, to: { x: 200, y: 0 } },
  { kind: "line" as const, from: { x: 200, y: 0 }, to: { x: 200, y: 300 } },
  {
    kind: "cubic" as const,
    from: { x: 200, y: 300 },
    c1: { x: 150, y: 380 },
    c2: { x: 50, y: 380 },
    to: { x: 0, y: 300 },
  },
  { kind: "line" as const, from: { x: 0, y: 300 }, to: { x: 0, y: 0 } },
];

describe("flattenPath", () => {
  it("drops the closing point of a closed path", () => {
    const square = polygonPath([
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 10 },
      { x: 0, y: 10 },
    ]);
    expect(flattenPath(square)).toHaveLength(4);
  });
});

describe("simplifyPolyline", () => {
  it("keeps only the ends of a straight run", () => {
    const run = [0, 1, 2, 3].map((x) => ({ x: x * 10, y: 0 }));
    expect(simplifyPolyline(run, 2)).toEqual([run[0], run[3]]);
  });
  it("keeps a corner farther than the tolerance", () => {
    const run = [
      { x: 0, y: 0 },
      { x: 50, y: 5 },
      { x: 100, y: 0 },
    ];
    expect(simplifyPolyline(run, 2)).toHaveLength(3);
  });
});

describe("simplifyPolygon", () => {
  it("leaves a triangle as it is", () => {
    const triangle = [
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 0, y: 1 },
    ];
    expect(simplifyPolygon(triangle, 2)).toEqual(triangle);
  });
  it("keeps every dropped point within the tolerance of the result", () => {
    const corners = flattenPath(bulge);
    const kept = simplifyPolygon(corners, 2);
    expect(kept.length).toBeLessThan(corners.length);
    for (const p of corners)
      expect(distancePointToPolyline(p, [...kept, kept[0]!])).toBeLessThanOrEqual(2 + 1e-9);
  });
});

describe("offsetOutward", () => {
  it("grows a square by the distance on every side, whichever way it runs", () => {
    const square = [
      { x: 0, y: 0 },
      { x: 0, y: 10 },
      { x: 10, y: 10 },
      { x: 10, y: 0 },
    ];
    const xs = offsetOutward(square, 2).map((p) => p.x);
    expect([Math.min(...xs), Math.max(...xs)]).toEqual([-2, 12]);
  });
});

describe("nestingOutline", () => {
  it("contains every point of the real cut line", () => {
    const outline = nestingOutline(bulge);
    for (const p of samplePath(bulge)) {
      expect(pointInPolygon(p, outline) || distancePointToPolyline(p, [...outline, outline[0]!]) < 1e-6).toBe(
        true,
      );
    }
  });
});
