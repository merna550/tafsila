import fc from "fast-check";
import { describe, expect, it } from "vitest";
import type { Segment } from "@tafsila/schemas";
import { deepFreeze } from "../test-utils/deep-freeze";
import { cubicLength } from "./bezier";
import { offsetPath } from "./offset";
import { pathLength, reversePath, splitAtLength } from "./path";
import { pt } from "./point";
import { cubicSeg, lineSeg } from "./segment";
import { mirrorAcross, rotateAbout, translate } from "./transform";

const coord = fc.double({ min: -500, max: 500, noNaN: true });
const point = fc.record({ x: coord, y: coord });
const cubic = fc
  .tuple(point, point, point, point)
  .filter(([a, , , d]) => Math.hypot(a.x - d.x, a.y - d.y) > 1)
  .map(([a, b, c, d]) => cubicSeg(a, b, c, d));

/** A continuous path of 1–4 segments (lines and cubics) built from a start point and steps. */
const path = fc
  .tuple(point, fc.array(fc.tuple(fc.boolean(), point, point, point), { minLength: 1, maxLength: 4 }))
  .map(([start, steps]) => {
    const segments: Segment[] = [];
    let from = start;
    for (const [isLine, c1, c2, to] of steps) {
      segments.push(isLine ? lineSeg(from, to) : cubicSeg(from, c1, c2, to));
      from = to;
    }
    return segments;
  })
  .filter((p) => p.every((s) => Math.hypot(s.to.x - s.from.x, s.to.y - s.from.y) > 1));

/** A convex polygon (anticlockwise, maths axes) with every exterior angle under 150° (inside the mitre limit). */
const convexPolygon = fc
  .array(fc.double({ min: 1, max: 2, noNaN: true }), { minLength: 4, maxLength: 10 })
  .map((weights) => {
    const total = weights.reduce((a, b) => a + b, 0);
    let angle = 0;
    const corners = weights.map((w) => {
      const corner = pt(100 * Math.cos(angle), 100 * Math.sin(angle));
      angle += (2 * Math.PI * w) / total;
      return corner;
    });
    return corners.map((c, i) => lineSeg(c, corners[(i + 1) % corners.length]!));
  });

describe("geometry properties", () => {
  it("split parts add up to the whole", () => {
    fc.assert(
      fc.property(path, fc.double({ min: 0.05, max: 0.95, noNaN: true }), (p, f) => {
        const whole = pathLength(deepFreeze(p));
        const [a, b] = splitAtLength(p, whole * f);
        expect(Math.abs(pathLength(a) + pathLength(b) - whole)).toBeLessThan(0.01);
      }),
      { numRuns: 60 },
    );
  });

  it("mirroring twice is the identity", () => {
    fc.assert(
      fc.property(path, point, point, (p, a, b) => {
        fc.pre(Math.hypot(a.x - b.x, a.y - b.y) > 1);
        const back = mirrorAcross(mirrorAcross(deepFreeze(p), a, b), a, b);
        back.forEach((s, i) => {
          expect(Math.abs(s.to.x - p[i]!.to.x)).toBeLessThan(0.01);
          expect(Math.abs(s.to.y - p[i]!.to.y)).toBeLessThan(0.01);
        });
      }),
    );
  });

  it("rotation and translation keep the length", () => {
    fc.assert(
      fc.property(cubic, point, fc.double({ min: -7, max: 7, noNaN: true }), (c, centre, angle) => {
        const length = cubicLength(deepFreeze(c));
        const moved = translate(rotateAbout(c, centre, angle), centre);
        expect(Math.abs(pathLength([moved]) - length)).toBeLessThan(0.01);
      }),
      { numRuns: 60 },
    );
  });

  it("reversing twice is the identity", () => {
    fc.assert(
      fc.property(path, (p) => {
        expect(reversePath(reversePath(deepFreeze(p)))).toEqual(p);
      }),
    );
  });

  it("mitre offset of a convex polygon adds 2d·Σ tan(θ/2)", () => {
    fc.assert(
      fc.property(convexPolygon, fc.double({ min: 1, max: 30, noNaN: true }), (poly, d) => {
        const exterior = poly.map((s, i) => {
          const next = poly[(i + 1) % poly.length]!;
          const a1 = Math.atan2(s.to.y - s.from.y, s.to.x - s.from.x);
          const a2 = Math.atan2(next.to.y - next.from.y, next.to.x - next.from.x);
          return (((a2 - a1) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
        });
        const growth = 2 * d * exterior.reduce((sum, t) => sum + Math.tan(t / 2), 0);
        const out = offsetPath(deepFreeze(poly), d);
        expect(Math.abs(pathLength(out) - (pathLength(poly) + growth))).toBeLessThan(0.01);
      }),
      { numRuns: 80 },
    );
  });
});
