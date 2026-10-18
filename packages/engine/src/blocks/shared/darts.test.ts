/** Tests of the shared dart helpers (issue #128). */
import { describe, expect, it } from "vitest";
import { cross, distance, lineSeg, pt, sub } from "../../geometry";
import { dartMouthIndex, trueDartLegs } from "./darts";

describe("trueDartLegs", () => {
  it("extends the shorter leg along its own line to the longer length", () => {
    const apex = pt(0, 0);
    const a = pt(-10, 100);
    const b = pt(10, 105);
    const [ta, tb] = trueDartLegs(apex, a, b);
    expect(distance(apex, ta)).toBeCloseTo(distance(apex, tb), 9);
    expect(tb).toEqual(b);
    expect(cross(sub(ta, apex), sub(a, apex))).toBeCloseTo(0, 9);
    expect(ta.y).toBeGreaterThan(a.y);
  });

  it("works with the legs the other way round and does not mutate", () => {
    const a = Object.freeze(pt(10, 105));
    const b = Object.freeze(pt(-10, 100));
    const [ta, tb] = trueDartLegs(pt(0, 0), a, b);
    expect(ta).toEqual(a);
    expect(distance(pt(0, 0), tb)).toBeCloseTo(distance(pt(0, 0), a), 9);
  });
});

describe("dartMouthIndex", () => {
  const path = [lineSeg(pt(0, 0), pt(10, 0)), lineSeg(pt(10, 0), pt(20, 0)), lineSeg(pt(20, 0), pt(0, 0))];
  it("finds the segment joining the legs, in either direction", () => {
    expect(dartMouthIndex(path, { legs: [pt(10, 0), pt(20, 0)] })).toBe(1);
    expect(dartMouthIndex(path, { legs: [pt(20, 0), pt(10, 0)] })).toBe(1);
    expect(dartMouthIndex(path, { legs: [pt(5, 5), pt(20, 0)] })).toBe(-1);
  });
});
