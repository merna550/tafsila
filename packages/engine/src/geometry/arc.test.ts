/** Tests for the circular-arc helper (issue #136). */
import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { DraftingError } from "../errors/drafting-error";
import { expectNear } from "../test-utils/expect-near";
import { arcToCubics, pointOnCircle } from "./arc";
import { sampleCubic } from "./bezier";
import { pathLength } from "./path";
import { distance, pt } from "./point";

const centre = pt(10, -20);

describe("arcToCubics", () => {
  it("draws a quarter circle as two cubics that start and end on the circle", () => {
    const cubics = arcToCubics({ center: centre, radiusMm: 100, fromRad: 0, toRad: Math.PI / 2 });
    expect(cubics).toHaveLength(2);
    expectNear(cubics[0]!.from, pt(110, -20));
    expectNear(cubics[1]!.to, pt(10, 80));
    expect(cubics[0]!.to).toEqual(cubics[1]!.from);
  });

  it("draws a clockwise arc when the end angle is smaller", () => {
    const cubics = arcToCubics({ center: centre, radiusMm: 50, fromRad: Math.PI / 2, toRad: 0 });
    expectNear(cubics[0]!.from, pointOnCircle(centre, 50, Math.PI / 2));
    expectNear(cubics.at(-1)!.to, pointOnCircle(centre, 50, 0));
    expect(cubics[0]!.c1.x).toBeGreaterThan(cubics[0]!.from.x);
  });

  it("stays within 0.01 mm of the circle and within 0.05 mm of the arc length r·sweep", () => {
    fc.assert(
      fc.property(
        fc.double({ min: 50, max: 2000, noNaN: true }),
        fc.double({ min: -Math.PI * 2, max: Math.PI * 2, noNaN: true }),
        fc.double({ min: 0.05, max: Math.PI * 2, noNaN: true }),
        (radiusMm, fromRad, sweepRad) => {
          const cubics = arcToCubics({ center: centre, radiusMm, fromRad, toRad: fromRad + sweepRad });
          for (const p of cubics.flatMap((c) => sampleCubic(c, 16))) {
            expect(Math.abs(distance(p, centre) - radiusMm)).toBeLessThan(0.01);
          }
          expect(Math.abs(pathLength(cubics) - radiusMm * sweepRad)).toBeLessThan(0.05);
        },
      ),
    );
  });

  it("refuses a zero radius or a zero sweep", () => {
    expect(() => arcToCubics({ center: centre, radiusMm: 0, fromRad: 0, toRad: 1 })).toThrow(DraftingError);
    expect(() => arcToCubics({ center: centre, radiusMm: 10, fromRad: 1, toRad: 1 })).toThrow(DraftingError);
    expect(() => arcToCubics({ center: centre, radiusMm: Number.NaN, fromRad: 0, toRad: 1 })).toThrow(
      DraftingError,
    );
  });
});
