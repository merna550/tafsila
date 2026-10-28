import { signedArea } from "@tafsila/engine/geometry";
import { describe, expect, it } from "vitest";
import { clipAtFold, foldLineY, toFoldFrame, unfoldAtFold } from "./fold";
import { toSelvedge } from "./grain";
import { rectPiece } from "./test-support/pieces";

const half = [
  { x: 0, y: 0 },
  { x: 100, y: 0 },
  { x: 100, y: 40 },
  { x: 0, y: 50 },
];

describe("foldLineY", () => {
  it("reads the fold from the piece's fold edge", () => {
    const piece = rectPiece({ cut: { onFold: true } });
    const turn = toSelvedge(piece.grainLine);
    expect(foldLineY(piece, turn, [])).toBeCloseTo(0, 9);
  });
  it("falls back to the cut line's smallest x on the sheet without a fold edge", () => {
    const piece = { ...rectPiece({ cut: { onFold: true } }), edges: [] };
    const turn = toSelvedge(piece.grainLine);
    expect(foldLineY(piece, turn, [])).toBeCloseTo(0, 9);
  });
});

describe("toFoldFrame", () => {
  it("flips a body that lies below the fold to the positive side", () => {
    const below = half.map((p) => ({ x: p.x, y: 10 - p.y }));
    const map = toFoldFrame(below, 10);
    expect(Math.min(...below.map(map).map((p) => p.y))).toBeCloseTo(0, 9);
    expect(Math.max(...below.map(map).map((p) => p.y))).toBeCloseTo(50, 9);
  });
  it("only moves a body that lies above the fold", () => {
    expect(toFoldFrame(half, 0)({ x: 1, y: 2 })).toEqual({ x: 1, y: 2 });
  });
});

describe("clipAtFold", () => {
  it("cuts a piece crossing the fold by 9 mm back to the fold line", () => {
    const crossing = [
      { x: 0, y: -9 },
      { x: 100, y: 0 },
      { x: 100, y: 40 },
      { x: 0, y: 50 },
    ];
    const clipped = clipAtFold(crossing);
    expect(Math.min(...clipped.map((p) => p.y))).toBe(0);
  });
  it("leaves a piece on the fold unchanged", () => {
    expect(clipAtFold(half)).toEqual(half);
  });
});

describe("unfoldAtFold", () => {
  it("joins the half and its mirror image into one outline of twice the area", () => {
    const whole = unfoldAtFold(half);
    expect(Math.abs(signedArea(whole))).toBeCloseTo(2 * Math.abs(signedArea(half)), 6);
    expect(Math.min(...whole.map((p) => p.y))).toBe(-50);
  });
  it("mirrors a half that only touches the fold at a point", () => {
    const touching = [
      { x: 0, y: 0 },
      { x: 100, y: 30 },
      { x: 0, y: 50 },
    ];
    expect(unfoldAtFold(touching)).toHaveLength(6);
  });
});
