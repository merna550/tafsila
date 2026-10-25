import { describe, expect, it } from "vitest";
import {
  closestPointOnPolyline,
  distancePointToPolyline,
  distancePointToSegment,
  distanceSegmentToRect,
  rectContains,
  segmentTouchesRect,
} from "./proximity";

const rect = { minX: 0, minY: 0, maxX: 10, maxY: 10 };

describe("distancePointToSegment", () => {
  it("measures to the foot of the perpendicular and to the nearer end", () => {
    expect(distancePointToSegment({ x: 5, y: 3 }, { x: 0, y: 0 }, { x: 10, y: 0 })).toBeCloseTo(3);
    expect(distancePointToSegment({ x: 13, y: 4 }, { x: 0, y: 0 }, { x: 10, y: 0 })).toBeCloseTo(5);
    expect(distancePointToSegment({ x: 3, y: 4 }, { x: 0, y: 0 }, { x: 0, y: 0 })).toBeCloseTo(5);
  });
});

describe("rectangle helpers", () => {
  it("detects a segment through, inside or beside the rectangle", () => {
    expect(segmentTouchesRect(rect, { x: -5, y: 5 }, { x: 15, y: 5 })).toBe(true);
    expect(segmentTouchesRect(rect, { x: 2, y: 2 }, { x: 3, y: 3 })).toBe(true);
    expect(segmentTouchesRect(rect, { x: -5, y: -1 }, { x: 15, y: -1 })).toBe(false);
    expect(segmentTouchesRect(rect, { x: 12, y: 0 }, { x: 12, y: 10 })).toBe(false);
  });

  it("gives the gap between a segment and the rectangle", () => {
    expect(distanceSegmentToRect(rect, { x: 14, y: 0 }, { x: 14, y: 10 })).toBeCloseTo(4);
    expect(distanceSegmentToRect(rect, { x: 13, y: 14 }, { x: 20, y: 14 })).toBeCloseTo(5);
    expect(distanceSegmentToRect(rect, { x: -5, y: 5 }, { x: 15, y: 5 })).toBe(0);
  });

  it("tells whether a point is inside", () => {
    expect(rectContains(rect, { x: 10, y: 0 })).toBe(true);
    expect(rectContains(rect, { x: 10.1, y: 0 })).toBe(false);
  });
});

describe("distancePointToPolyline", () => {
  it("takes the nearest of the segments", () => {
    const line = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 10, y: 10 },
    ];
    expect(distancePointToPolyline({ x: 8, y: 6 }, line)).toBeCloseTo(2);
  });
});

describe("closestPointOnPolyline", () => {
  const line = [
    { x: 0, y: 0 },
    { x: 10, y: 0 },
    { x: 10, y: 10 },
  ];

  it("drops a perpendicular onto the nearest piece", () => {
    expect(closestPointOnPolyline({ x: 5, y: 3 }, line)).toEqual({ x: 5, y: 0 });
    expect(closestPointOnPolyline({ x: 14, y: 6 }, line)).toEqual({ x: 10, y: 6 });
  });

  it("stops at the ends and copes with a repeated point", () => {
    expect(closestPointOnPolyline({ x: -4, y: -1 }, line)).toEqual({ x: 0, y: 0 });
    expect(
      closestPointOnPolyline({ x: 3, y: 3 }, [
        { x: 1, y: 1 },
        { x: 1, y: 1 },
      ]),
    ).toEqual({ x: 1, y: 1 });
  });
});
