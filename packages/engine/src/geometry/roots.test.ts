import { describe, expect, it } from "vitest";
import { solveCubic, solveQuadratic } from "./roots";

describe("polynomial roots", () => {
  it("solves quadratics and the linear fallback", () => {
    expect(solveQuadratic(1, -3, 2)).toEqual([1, 2]);
    expect(solveQuadratic(1, 0, 1)).toEqual([]);
    expect(solveQuadratic(0, 2, -4)).toEqual([2]);
    expect(solveQuadratic(0, 0, 1)).toEqual([]);
    expect(solveQuadratic(0, 0, 0)).toEqual([]);
    expect(solveQuadratic(1, 0, 0)).toEqual([0]);
  });

  it("solves cubics with three, one and repeated roots", () => {
    const three = solveCubic(1, -6, 11, -6);
    [1, 2, 3].forEach((r, i) => expect(three[i]).toBeCloseTo(r, 10));
    const one = solveCubic(1, 0, 1, -2);
    expect(one).toHaveLength(1);
    expect(one[0]).toBeCloseTo(1, 10);
    expect(solveCubic(1, -3, 3, -1)[0]).toBeCloseTo(1, 5);
    expect(solveCubic(2, 0, 0, -16)[0]).toBeCloseTo(2, 10);
    expect(solveCubic(0, 1, -3, 2)).toEqual([1, 2]);
    expect(solveCubic(0, 0, 0, 0)).toEqual([]);
  });
});
