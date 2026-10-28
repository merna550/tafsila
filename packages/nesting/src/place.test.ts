import { pt } from "@tafsila/engine/geometry";
import { describe, expect, it } from "vitest";
import { turnedPolygon, turnsOf } from "./place";
import { rectShape } from "./test-support/shapes";

const triangle = {
  ...rectShape({ id: "t#1", lengthMm: 30, widthMm: 60 }),
  polygon: [pt(0, 0), pt(30, 0), pt(0, 60)],
};

describe("turnedPolygon", () => {
  it("keeps the outline at 0", () => {
    expect(turnedPolygon(triangle, 0)).toEqual(triangle.polygon);
  });

  it("spins an ordinary shape about its box centre at 180", () => {
    expect(turnedPolygon(triangle, 180)).toEqual([pt(30, 60), pt(0, 60), pt(30, 0)]);
  });

  it("flips a fold shape along x at 180 so its fold stays on y = 0", () => {
    expect(turnedPolygon({ ...triangle, fold: true }, 180)).toEqual([pt(30, 0), pt(0, 0), pt(30, 60)]);
  });
});

describe("turnsOf", () => {
  it("gives one profile per allowed turn", () => {
    expect(turnsOf(triangle).map((t) => t.turn)).toEqual([0, 180]);
    expect(turnsOf({ ...triangle, allowedTurns: [0] })).toHaveLength(1);
    expect(turnsOf(triangle)[0]!.profile).toHaveLength(10);
  });
});
