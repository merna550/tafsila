import { describe, expect, it } from "vitest";
import { grainAngleRad, mirrorAcrossGrain, toOrigin, toSelvedge } from "./grain";

const directions = {
  down: [
    { x: 0, y: 0 },
    { x: 0, y: 10 },
  ],
  up: [
    { x: 0, y: 10 },
    { x: 0, y: 0 },
  ],
  right: [
    { x: 0, y: 0 },
    { x: 10, y: 0 },
  ],
  left: [
    { x: 10, y: 0 },
    { x: 0, y: 0 },
  ],
  slanted: [
    { x: 0, y: 0 },
    { x: 3, y: 4 },
  ],
} as const;

describe("toSelvedge", () => {
  it.each(Object.entries(directions))("turns a grain line pointing %s to +x", (_, line) => {
    const turn = toSelvedge(line);
    const [a, b] = line.map(turn);
    expect(b!.y - a!.y).toBeCloseTo(0, 9);
    expect(b!.x - a!.x).toBeGreaterThan(0);
  });
});

describe("grainAngleRad", () => {
  it("reads a downward grain on the sheet as a quarter turn", () => {
    expect(grainAngleRad(directions.down)).toBeCloseTo(Math.PI / 2);
  });
});

describe("mirrorAcrossGrain", () => {
  it("flips y and keeps x", () => {
    expect(mirrorAcrossGrain({ x: 3, y: 4 })).toEqual({ x: 3, y: -4 });
  });
});

describe("toOrigin", () => {
  it("moves the box corner to the origin", () => {
    const map = toOrigin([
      { x: 5, y: -2 },
      { x: 9, y: 7 },
    ]);
    expect(map({ x: 5, y: -2 })).toEqual({ x: 0, y: 0 });
  });
});
