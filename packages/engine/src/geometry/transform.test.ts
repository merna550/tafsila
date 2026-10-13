import { describe, expect, it } from "vitest";
import { pathLength } from "./path";
import { expectNear } from "../test-utils/expect-near";
import { pt } from "./point";
import { cubicSeg, lineSeg } from "./segment";
import { mirrorAcross, rotateAbout, rotateSegmentAround, translate } from "./transform";

const lShape = [lineSeg(pt(0, 0), pt(30, 0)), lineSeg(pt(30, 0), pt(30, 40))];

describe("transforms", () => {
  it("translates points, segments and paths", () => {
    expect(translate(pt(1, 2), pt(10, 20))).toEqual(pt(11, 22));
    expect(translate(lineSeg(pt(0, 0), pt(1, 0)), pt(0, 5))).toEqual(lineSeg(pt(0, 5), pt(1, 5)));
    expect(translate(lShape, pt(1, 1))[1]!.to).toEqual(pt(31, 41));
  });

  it("rotates (10, 0) by 90° about the origin to (0, 10)", () => {
    expectNear(rotateAbout(pt(10, 0), pt(0, 0), Math.PI / 2), pt(0, 10));
    expectNear(rotateAbout(pt(20, 10), pt(10, 10), Math.PI), pt(0, 10));
  });

  it("rotates a cubic by its control points", () => {
    const curve = cubicSeg(pt(0, 0), pt(10, 0), pt(20, 10), pt(30, 10));
    const turned = rotateAbout(curve, pt(0, 0), Math.PI / 2);
    expect(turned.kind).toBe("cubic");
    expectNear(turned.to, pt(-10, 30));
  });

  it("mirrors across y = x by swapping x and y", () => {
    expectNear(mirrorAcross(pt(3, 7), pt(0, 0), pt(1, 1)), pt(7, 3));
    expectNear(mirrorAcross(pt(5, 2), pt(0, 0), pt(0, 1)), pt(-5, 2));
    expect(() => mirrorAcross(pt(1, 1), pt(0, 0), pt(0, 0))).toThrow(
      expect.objectContaining({ code: "GEOMETRY_DEGENERATE_SEGMENT" }),
    );
  });

  it("rotates part of a path about a pivot (dart closing)", () => {
    const { before, moved, after } = rotateSegmentAround(
      lShape,
      { fromMm: 30, toMm: 70 },
      pt(30, 0),
      -Math.PI / 2,
    );
    expect(before).toEqual([lShape[0]]);
    expect(after).toEqual([]);
    expectNear(moved[0]!.from, pt(30, 0));
    expectNear(moved[0]!.to, pt(70, 0));
    expect(pathLength(moved)).toBeCloseTo(40, 9);
    expect(() => rotateSegmentAround(lShape, { fromMm: 10, toMm: 10 }, pt(0, 0), 1)).toThrow(
      expect.objectContaining({ code: "GEOMETRY_LENGTH_OUT_OF_RANGE" }),
    );
  });
});
