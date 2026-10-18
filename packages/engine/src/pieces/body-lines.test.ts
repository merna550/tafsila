/** Tests of the body-line measurement, including the polyline kind (issue #135). */
import { describe, expect, it } from "vitest";
import { lineSeg, pt } from "../geometry";
import { bodyLineLengthMm, probeLengthMm } from "./body-lines";

/** A 100 × 50 mm rectangle, clockwise on the y-down sheet. */
const rectangle = [
  lineSeg(pt(0, 0), pt(100, 0)),
  lineSeg(pt(100, 0), pt(100, 50)),
  lineSeg(pt(100, 50), pt(0, 50)),
  lineSeg(pt(0, 50), pt(0, 0)),
];
const piece = {
  cut: { quantity: 1, onFold: false, mirror: false, fabric: "main" as const },
  stitchPath: rectangle,
  edges: [],
  darts: [],
};

describe("bodyLineLengthMm", () => {
  it("measures a horizontal line from outline to outline", () => {
    expect(
      bodyLineLengthMm(piece, { id: "h", measurement: "hip", kind: "horizontal", atMm: 20 }),
    ).toBeCloseTo(100, 9);
  });

  it("measures a polyline along its bend, its end legs extended to the outline", () => {
    const line = {
      id: "p",
      measurement: "hip" as const,
      kind: "polyline" as const,
      points: [pt(10, 20), pt(50, 20), pt(80, 40)],
    };
    const tail = Math.hypot(30, 20);
    const toEdge = (tail * (100 - 50)) / 30;
    expect(bodyLineLengthMm(piece, line)).toBeCloseTo(50 + Math.min(toEdge, ((50 - 20) * tail) / 20), 9);
  });

  it("gives undefined for a line that misses the piece", () => {
    expect(
      bodyLineLengthMm(piece, { id: "h", measurement: "hip", kind: "horizontal", atMm: 80 }),
    ).toBeUndefined();
  });
});

describe("probeLengthMm", () => {
  it("is undefined with fewer than two crossings", () => {
    expect(probeLengthMm(rectangle, [pt(50, 20), pt(200, 20)])).toBeUndefined();
  });
});
