import { describe, expect, it } from "vitest";
import { nest, nestShapes } from "./nest";
import { rectShape } from "./test-support/shapes";
import type { PreparedFabrics } from "./types";

const open = { usableWidthMm: 1000, folded: false };
const folded = { usableWidthMm: 1000, folded: true };
const three = [
  rectShape({ id: "a#1", lengthMm: 300, widthMm: 600 }),
  rectShape({ id: "b#1", lengthMm: 300, widthMm: 400 }),
  rectShape({ id: "c#1", lengthMm: 200, widthMm: 300 }),
];

/**
 * Positions by shape id.
 *
 * @param result - A kind's placement.
 * @param result.placements - Its placements.
 * @returns `[id, x, y, rotation]` per shape.
 */
function positions(result: ReturnType<typeof nestShapes>): [string, number, number, number][] {
  return result.placements.map((p) => [p.shapeId, p.xMm, p.yMm, p.rotation]);
}

describe("nestShapes", () => {
  it("places three rectangles bottom-left on an open strip", () => {
    const result = nestShapes(three, "main", open);
    expect(positions(result)).toEqual([
      ["a#1", 0, 0, 0],
      ["b#1", 0, 600, 0],
      ["c#1", 300, 0, 0],
    ]);
    expect(result.stripLengthMm).toBe(500);
    expect(result.rows).toBe(2); // a and b share 0..300; c starts at 300
    expect(result.order).toBe("area");
    expect(result.placements[0]).toMatchObject({ pieceId: "a", copyIndex: 1, mirrored: false });
  });

  it("puts ordinary pieces at the selvedge in a folded layout", () => {
    expect(positions(nestShapes(three, "main", folded))).toEqual([
      ["a#1", 0, 400, 0],
      ["b#1", 0, 0, 0],
      ["c#1", 300, 700, 0],
    ]);
  });

  it("keeps fold shapes on the fold", () => {
    const shapes = [
      rectShape({ id: "f#1", lengthMm: 300, widthMm: 200, fold: true }),
      rectShape({ id: "f#2", lengthMm: 300, widthMm: 200, fold: true }),
    ];
    const result = nestShapes(shapes, "main", folded);
    expect(positions(result)).toEqual([
      ["f#1", 0, 0, 0],
      ["f#2", 300, 0, 0],
    ]);
    expect(result.stripLengthMm).toBe(600);
  });

  it("reports a shape wider than the strip and places the rest", () => {
    const result = nestShapes(
      [...three, rectShape({ id: "w#1", lengthMm: 100, widthMm: 1200 })],
      "lining",
      open,
    );
    expect(result.placements.map((p) => p.shapeId)).toEqual(["a#1", "b#1", "c#1"]);
    expect(result.doesNotFit).toEqual([
      { pieceId: "w", fabric: "lining", widthMm: 1200, usableWidthMm: 1000, fitsOpen: false },
    ]);
  });

  it("uses a half turn when it fits earlier, and never with nap", () => {
    // an L whose notch takes a small square once turned
    const l = {
      ...rectShape({ id: "l#1", lengthMm: 600, widthMm: 600 }),
      polygon: [
        { x: 0, y: 0 },
        { x: 600, y: 0 },
        { x: 600, y: 300 },
        { x: 300, y: 300 },
        { x: 300, y: 600 },
        { x: 0, y: 600 },
      ],
    };
    const square = rectShape({ id: "s#1", lengthMm: 300, widthMm: 300 });
    const turned = nestShapes([l, { ...square, polygon: square.polygon }], "main", {
      usableWidthMm: 600,
      folded: false,
    });
    expect(turned.stripLengthMm).toBe(600);
    const napL = { ...l, allowedTurns: [0] as const };
    const napped = nestShapes([napL, { ...square, allowedTurns: [0] as const }], "main", {
      usableWidthMm: 600,
      folded: false,
    });
    expect(napped.placements.every((p) => p.rotation === 0)).toBe(true);
    expect(napped.stripLengthMm).toBe(600);
  });

  it("gives the same result for any input order", () => {
    expect(nestShapes([...three].reverse(), "main", open)).toEqual(nestShapes(three, "main", open));
  });

  it("is empty for no shapes", () => {
    expect(nestShapes([], "interfacing", open)).toMatchObject({ placements: [], stripLengthMm: 0, rows: 0 });
  });
});

describe("nest", () => {
  it("places each kind apart and lists each kind's too-wide pieces", () => {
    const prepared: PreparedFabrics = {
      layout: "folded",
      usableWidthMm: 1000,
      main: three,
      lining: [rectShape({ id: "l#1", lengthMm: 400, widthMm: 100 })],
      interfacing: [],
      doesNotFit: [{ pieceId: "skirt", fabric: "main", widthMm: 1100, usableWidthMm: 1000, fitsOpen: true }],
      suggestOpen: true,
    };
    const result = nest(prepared);
    expect(result.main.stripLengthMm).toBe(500);
    expect(result.lining.stripLengthMm).toBe(400);
    expect(result.interfacing.placements).toEqual([]);
    expect(result.main.doesNotFit.map((d) => d.pieceId)).toEqual(["skirt"]);
    expect(result.lining.doesNotFit).toEqual([]);
    expect(result).toMatchObject({ layout: "folded", usableWidthMm: 1000, suggestOpen: true });
  });
});
