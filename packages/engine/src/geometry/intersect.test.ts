import { describe, expect, it } from "vitest";
import { cubicCubic, intersectSegments, lineCubic, lineLine, selfIntersections } from "./intersect";
import { expectNear } from "../test-utils/expect-near";
import { pt } from "./point";
import { cubicSeg, lineSeg } from "./segment";

const arch = cubicSeg(pt(0, 0), pt(0, 100), pt(100, 100), pt(100, 0));
const rising = cubicSeg(pt(0, 0), pt(30, 0), pt(70, 100), pt(100, 100));
const falling = cubicSeg(pt(0, 100), pt(30, 100), pt(70, 0), pt(100, 0));

describe("intersections", () => {
  it("crosses the x-axis with a vertical line at a known point", () => {
    const hit = lineLine(lineSeg(pt(0, 0), pt(10, 0)), lineSeg(pt(4, -5), pt(4, 5)));
    expect(hit).not.toBeNull();
    expectNear(hit!.point, pt(4, 0));
    expect(hit!.t1).toBeCloseTo(0.4, 12);
    expect(hit!.t2).toBeCloseTo(0.5, 12);
  });

  it("separates segments from infinite lines and ignores parallels", () => {
    const a = lineSeg(pt(0, 0), pt(1, 0));
    const b = lineSeg(pt(4, -5), pt(4, 5));
    expect(lineLine(a, b)).toBeNull();
    expectNear(lineLine(a, b, true)!.point, pt(4, 0));
    expect(lineLine(a, lineSeg(pt(0, 1), pt(1, 1)), true)).toBeNull();
  });

  it("finds the 2 known roots of a line through a symmetric cubic", () => {
    const hits = lineCubic(lineSeg(pt(-10, 50), pt(110, 50)), arch);
    expect(hits).toHaveLength(2);
    const t = (1 - Math.sqrt(1 / 3)) / 2;
    expect(hits[0]!.t2).toBeCloseTo(t, 9);
    expect(hits[1]!.t2).toBeCloseTo(1 - t, 9);
    expectNear(hits[0]!.point, pt(100 * t * t * (3 - 2 * t), 50));
    expectNear(hits[1]!.point, pt(100 - 100 * t * t * (3 - 2 * t), 50));
  });

  it("limits a line segment but not an infinite line", () => {
    const short = lineSeg(pt(-10, 50), pt(40, 50));
    expect(lineCubic(short, arch)).toHaveLength(1);
    expect(lineCubic(short, arch, true)).toHaveLength(2);
    expect(lineCubic(lineSeg(pt(0, 200), pt(100, 200)), arch, true)).toEqual([]);
  });

  it("finds the 1 known crossing of two cubics", () => {
    const hits = cubicCubic(rising, falling);
    expect(hits).toHaveLength(1);
    expectNear(hits[0]!.point, pt(50, 50));
    expect(hits[0]!.t1).toBeCloseTo(0.5, 3);
    expect(cubicCubic(rising, cubicSeg(pt(0, 300), pt(30, 300), pt(70, 300), pt(100, 300)))).toEqual([]);
  });

  it("intersects any pair of segment kinds", () => {
    const line = lineSeg(pt(-10, 50), pt(110, 50));
    expect(intersectSegments(line, arch)).toHaveLength(2);
    const swapped = intersectSegments(arch, line);
    expect(swapped).toHaveLength(2);
    expect(swapped[0]!.t1).toBeCloseTo((1 - Math.sqrt(1 / 3)) / 2, 9);
    expect(intersectSegments(rising, falling)).toHaveLength(1);
    expect(intersectSegments(line, lineSeg(pt(0, 0), pt(0, 100)))).toHaveLength(1);
    expect(intersectSegments(line, lineSeg(pt(0, 0), pt(0, 10)))).toEqual([]);
  });

  it("finds 1 self-intersection in a figure 8 and none in a square", () => {
    const figure8 = [
      lineSeg(pt(0, 0), pt(10, 10)),
      lineSeg(pt(10, 10), pt(10, 0)),
      lineSeg(pt(10, 0), pt(0, 10)),
      lineSeg(pt(0, 10), pt(0, 0)),
    ];
    const crossings = selfIntersections(figure8);
    expect(crossings).toHaveLength(1);
    expectNear(crossings[0]!, pt(5, 5));
    const square = [
      lineSeg(pt(0, 0), pt(10, 0)),
      lineSeg(pt(10, 0), pt(10, 10)),
      lineSeg(pt(10, 10), pt(0, 10)),
      lineSeg(pt(0, 10), pt(0, 0)),
    ];
    expect(selfIntersections(square)).toEqual([]);
  });

  it("ignores the shared joints of a two-segment outline", () => {
    const lens = [cubicSeg(pt(0, 0), pt(30, 40), pt(70, 40), pt(100, 0)), lineSeg(pt(100, 0), pt(0, 0))];
    expect(selfIntersections(lens)).toEqual([]);
  });

  it("refuses an open path", () => {
    expect(() => selfIntersections([lineSeg(pt(0, 0), pt(1, 0))])).toThrow(
      expect.objectContaining({ code: "GEOMETRY_PATH_NOT_CLOSED" }),
    );
  });

  it("stops on curves that overlap along a stretch", () => {
    expect(() => cubicCubic(rising, rising)).toThrow(
      expect.objectContaining({ code: "GEOMETRY_DEGENERATE_SEGMENT" }),
    );
  });
});
