import { pt } from "@tafsila/engine/geometry";
import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { columnProfile, columnsFor, mergeIntervals } from "./rasterize";

describe("columnProfile", () => {
  it("covers a rectangle's full height in every column", () => {
    expect(columnProfile([pt(0, 0), pt(6, 0), pt(6, 2), pt(0, 2)], 3)).toEqual([[[0, 2]], [[0, 2]]]);
  });

  it("covers the highest point a sloped edge reaches inside each column", () => {
    const profile = columnProfile([pt(0, 0), pt(6, 0), pt(0, 6)], 3);
    expect(profile).toEqual([[[0, 6]], [[0, 3]]]);
  });

  it("keeps the gap of a U shape inside a column", () => {
    const u = [pt(0, 0), pt(9, 0), pt(9, 9), pt(6, 9), pt(6, 3), pt(3, 3), pt(3, 9), pt(0, 9)];
    // column 1 spans x 3..6: the base [0, 3] only; columns 0 and 2 are full.
    expect(columnProfile(u, 3)).toEqual([[[0, 9]], [[0, 3]], [[0, 9]]]);
    // with 1.5 mm columns the middle columns still see only the base.
    expect(columnProfile(u, 1.5)[2]).toEqual([[0, 3]]);
  });

  it("splits a column into two intervals when the polygon has a notch across it", () => {
    const c = [pt(0, 0), pt(6, 0), pt(6, 2), pt(1, 2), pt(1, 4), pt(6, 4), pt(6, 6), pt(0, 6)];
    expect(columnProfile(c, 3)[1]).toEqual([
      [0, 2],
      [4, 6],
    ]);
  });

  it("contains every point inside the polygon (random convex quadrilaterals)", () => {
    fc.assert(
      fc.property(
        fc.tuple(fc.integer({ min: 1, max: 200 }), fc.integer({ min: 1, max: 200 })),
        fc.integer({ min: 0, max: 100 }),
        fc.double({ min: 0, max: 1, noNaN: true }),
        fc.double({ min: 0, max: 1, noNaN: true }),
        ([l, w], skew, u, v) => {
          const polygon = [pt(0, skew % w), pt(l, 0), pt(l, w), pt(0, w)];
          const profile = columnProfile(polygon, 3);
          // a point of the quadrilateral by bilinear blend of its corners
          const x = u * l;
          const yLow = (skew % w) * (1 - u);
          const y = yLow + v * (w - yLow);
          const column = Math.min(Math.floor(x / 3), profile.length - 1);
          expect(profile[column]!.some(([a, b]) => y >= a - 1e-9 && y <= b + 1e-9)).toBe(true);
        },
      ),
    );
  });
});

describe("mergeIntervals and columnsFor", () => {
  it("merges overlapping and touching intervals", () => {
    expect(
      mergeIntervals([
        [5, 6],
        [0, 2],
        [2, 3],
        [1, 1.5],
      ]),
    ).toEqual([
      [0, 3],
      [5, 6],
    ]);
  });

  it("needs at least one column and ignores floating noise", () => {
    expect(columnsFor(0, 3)).toBe(1);
    expect(columnsFor(9.000000000001, 3)).toBe(3);
    expect(columnsFor(9.1, 3)).toBe(4);
  });
});
