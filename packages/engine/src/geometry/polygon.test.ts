import { describe, expect, it } from "vitest";
import { pt } from "./point";
import { bbox, bboxOverlap, pointInPolygon, signedArea } from "./polygon";

const unit = [pt(0, 0), pt(1, 0), pt(1, 1), pt(0, 1)];

describe("polygon helpers", () => {
  it("gives the unit square signed area +1 anticlockwise and −1 clockwise", () => {
    expect(signedArea(unit)).toBe(1);
    expect(signedArea([...unit].reverse())).toBe(-1);
    expect(signedArea([...unit, unit[0]!])).toBe(1);
    expect(signedArea([pt(0, 0), pt(1, 1)])).toBe(0);
  });

  it("finds the bounding box and overlaps", () => {
    const box = bbox([pt(3, -2), pt(-1, 5), pt(2, 2)]);
    expect(box).toEqual({ minX: -1, minY: -2, maxX: 3, maxY: 5 });
    expect(bboxOverlap(box, { minX: 3, minY: 5, maxX: 9, maxY: 9 })).toBe(true);
    expect(bboxOverlap(box, { minX: 3.1, minY: 0, maxX: 9, maxY: 9 })).toBe(false);
  });

  it("tests points inside with the even–odd rule", () => {
    expect(pointInPolygon(pt(0.5, 0.5), unit)).toBe(true);
    expect(pointInPolygon(pt(1.5, 0.5), unit)).toBe(false);
    const ring = [
      pt(0, 0),
      pt(4, 0),
      pt(4, 4),
      pt(0, 4),
      pt(0, 0),
      pt(1, 1),
      pt(1, 3),
      pt(3, 3),
      pt(3, 1),
      pt(1, 1),
    ];
    expect(pointInPolygon(pt(2, 2), ring)).toBe(false);
    expect(pointInPolygon(pt(0.5, 2), ring)).toBe(true);
  });
});
