import { describe, expect, it } from "vitest";
import {
  cutPath,
  isClosed,
  locateAtLength,
  pathLength,
  pointAtLength,
  reversePath,
  samplePath,
  segmentLength,
  splitAtLength,
  splitSegmentAt,
  subPath,
  tangentAtLength,
} from "./path";
import { pt } from "./point";
import { cubicSeg, lineSeg } from "./segment";

const line100 = [lineSeg(pt(0, 0), pt(100, 0))];
const lShape = [lineSeg(pt(0, 0), pt(30, 0)), lineSeg(pt(30, 0), pt(30, 40))];
const square = [
  lineSeg(pt(0, 0), pt(10, 0)),
  lineSeg(pt(10, 0), pt(10, 10)),
  lineSeg(pt(10, 10), pt(0, 10)),
  lineSeg(pt(0, 10), pt(0, 0)),
];
const curved = [lineSeg(pt(0, 0), pt(30, 0)), cubicSeg(pt(30, 0), pt(40, 0), pt(50, 10), pt(50, 20))];

describe("path helpers", () => {
  it("measures segments and paths", () => {
    expect(segmentLength(lineSeg(pt(0, 0), pt(3, 4)))).toBe(5);
    expect(pathLength(lShape)).toBe(70);
    expect(pathLength(square)).toBe(40);
  });

  it("finds points and tangents by length", () => {
    expect(pointAtLength(lShape, 0)).toEqual(pt(0, 0));
    expect(pointAtLength(lShape, 30)).toEqual(pt(30, 0));
    expect(pointAtLength(lShape, 50)).toEqual(pt(30, 20));
    expect(pointAtLength(lShape, 70)).toEqual(pt(30, 40));
    expect(tangentAtLength(lShape, 10)).toEqual(pt(1, 0));
    expect(tangentAtLength(lShape, 60)).toEqual(pt(0, 1));
    expect(locateAtLength(lShape, 45)).toEqual({ index: 1, t: 0.375 });
  });

  it("rejects lengths outside the path", () => {
    const code = { code: "GEOMETRY_LENGTH_OUT_OF_RANGE" };
    expect(() => pointAtLength(lShape, -1)).toThrow(expect.objectContaining(code));
    expect(() => pointAtLength(lShape, 71)).toThrow(expect.objectContaining(code));
    expect(() => pointAtLength(lShape, Number.NaN)).toThrow(expect.objectContaining(code));
    expect(() => pointAtLength([], 0)).toThrow(
      expect.objectContaining({ code: "GEOMETRY_DEGENERATE_SEGMENT" }),
    );
  });

  it("splits a 100 mm line at 50 into 50 + 50", () => {
    const [before, after] = splitAtLength(line100, 50);
    expect(pathLength(before)).toBeCloseTo(50, 9);
    expect(pathLength(after)).toBeCloseTo(50, 9);
    expect(before.at(-1)!.to).toEqual(pt(50, 0));
  });

  it("splits on a joint without creating empty segments", () => {
    const [before, after] = splitAtLength(lShape, 30);
    expect(before).toHaveLength(1);
    expect(after).toHaveLength(1);
    expect(() => splitAtLength(lShape, 0)).toThrow(
      expect.objectContaining({ code: "GEOMETRY_LENGTH_OUT_OF_RANGE" }),
    );
    expect(() => splitAtLength(lShape, 70)).toThrow(
      expect.objectContaining({ code: "GEOMETRY_LENGTH_OUT_OF_RANGE" }),
    );
    expect(cutPath(lShape, 0)[0]).toEqual([]);
  });

  it("splits a curved path and keeps the length", () => {
    const total = pathLength(curved);
    const [before, after] = splitAtLength(curved, 40);
    expect(pathLength(before)).toBeCloseTo(40, 2);
    expect(pathLength(before) + pathLength(after)).toBeCloseTo(total, 2);
    expect(splitSegmentAt(curved[1]!, 0.5)[0].kind).toBe("cubic");
  });

  it("takes a sub-path between two lengths", () => {
    const part = subPath(lShape, 10, 50);
    expect(pathLength(part)).toBeCloseTo(40, 9);
    expect(part[0]!.from).toEqual(pt(10, 0));
    expect(part.at(-1)!.to).toEqual(pt(30, 20));
    expect(() => subPath(lShape, 20, 20)).toThrow(
      expect.objectContaining({ code: "GEOMETRY_LENGTH_OUT_OF_RANGE" }),
    );
  });

  it("reverses a path", () => {
    const reversed = reversePath(curved);
    expect(reversed[0]!.from).toEqual(pt(50, 20));
    expect(reversed.at(-1)!.to).toEqual(pt(0, 0));
    expect(reversed[0]).toEqual(cubicSeg(pt(50, 20), pt(50, 10), pt(40, 0), pt(30, 0)));
  });

  it("knows closed from open", () => {
    expect(isClosed(square)).toBe(true);
    expect(isClosed(lShape)).toBe(false);
    expect(isClosed([])).toBe(false);
  });

  it("samples a path into points", () => {
    expect(samplePath(square)).toHaveLength(5);
    expect(samplePath(curved, 4)).toHaveLength(6);
    expect(samplePath([])).toEqual([]);
  });
});
