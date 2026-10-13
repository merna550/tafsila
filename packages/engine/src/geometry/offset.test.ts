import { describe, expect, it } from "vitest";
import { offsetPath } from "./offset";
import { isClosed, pathLength, samplePath } from "./path";
import { distance, pt } from "./point";
import { bbox, signedArea } from "./polygon";
import { cubicSeg, lineSeg } from "./segment";

const square = [
  lineSeg(pt(0, 0), pt(100, 0)),
  lineSeg(pt(100, 0), pt(100, 100)),
  lineSeg(pt(100, 100), pt(0, 100)),
  lineSeg(pt(0, 100), pt(0, 0)),
];
const K = 0.5523;
const R = 100;
const circle = [
  cubicSeg(pt(R, 0), pt(R, K * R), pt(K * R, R), pt(0, R)),
  cubicSeg(pt(0, R), pt(-K * R, R), pt(-R, K * R), pt(-R, 0)),
  cubicSeg(pt(-R, 0), pt(-R, -K * R), pt(-K * R, -R), pt(0, -R)),
  cubicSeg(pt(0, -R), pt(K * R, -R), pt(R, -K * R), pt(R, 0)),
];

describe("offsetPath", () => {
  it("grows a 100 mm square by 10 mm with mitre corners to a 480 mm perimeter", () => {
    const out = offsetPath(square, 10);
    expect(pathLength(out)).toBeCloseTo(480, 2);
    expect(isClosed(out)).toBe(true);
    expect(bbox(samplePath(out))).toEqual({ minX: -10, minY: -10, maxX: 110, maxY: 110 });
    expect(signedArea(samplePath(out))).toBeCloseTo(14400, 2);
  });

  it("shrinks the square with a negative distance (inside corners trimmed)", () => {
    const out = offsetPath(square, -10);
    expect(pathLength(out)).toBeCloseTo(320, 2);
    expect(out).toHaveLength(4);
  });

  it("uses one distance per segment", () => {
    const out = offsetPath(square, [10, 20, 10, 20]);
    expect(bbox(samplePath(out))).toEqual({ minX: -20, minY: -10, maxX: 120, maxY: 110 });
    expect(offsetPath(square, [0, 0, 0, 0])).toEqual(square);
  });

  it("offsets curves to within the offset tolerance", () => {
    const out = offsetPath(circle, 10);
    samplePath(out).forEach((p) => expect(Math.abs(distance(p, pt(0, 0)) - 110)).toBeLessThan(0.1));
    expect(isClosed(out)).toBe(true);
  });

  it("does not close an open path", () => {
    const out = offsetPath([lineSeg(pt(0, 0), pt(30, 0)), lineSeg(pt(30, 0), pt(30, 40))], 5);
    expect(out[0]!.from).toEqual(pt(0, -5));
    expect(out.at(-1)!.to).toEqual(pt(35, 40));
    expect(out.some((s) => s.to.x === 35 && s.to.y === -5)).toBe(true);
  });

  it("cuts a very sharp corner square at the mitre limit", () => {
    const spike = [
      lineSeg(pt(0, 0), pt(200, 10)),
      lineSeg(pt(200, 10), pt(0, 20)),
      lineSeg(pt(0, 20), pt(0, 0)),
    ];
    const out = offsetPath(spike, 5);
    samplePath(out).forEach((p) => expect(distance(p, pt(200, 10))).toBeLessThan(4 * 5 + 200));
    const reach = Math.max(...samplePath(out).map((p) => p.x));
    expect(reach).toBeLessThanOrEqual(200 + 4 * 5 + 0.01);
  });

  it("fails on bad distances", () => {
    const code = { code: "GEOMETRY_OFFSET_FAILED" };
    expect(() => offsetPath(square, [1, 2])).toThrow(expect.objectContaining(code));
    expect(() => offsetPath(square, Number.NaN)).toThrow(expect.objectContaining(code));
  });

  it("rejects degenerate input", () => {
    expect(() => offsetPath([lineSeg(pt(1, 1), pt(1, 1))], 5)).toThrow(
      expect.objectContaining({ code: "GEOMETRY_DEGENERATE_SEGMENT" }),
    );
    expect(() => offsetPath([lineSeg(pt(Number.NaN, 0), pt(1, 1))], 5)).toThrow(
      expect.objectContaining({ code: "GEOMETRY_DEGENERATE_SEGMENT" }),
    );
  });
});
