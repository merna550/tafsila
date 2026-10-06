import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { DraftingError } from "../errors/drafting-error";
import { capLength, solveSleeveCapHeight } from "./sleeve-cap";

describe("solveSleeveCapHeight", () => {
  it("gives the cap exactly the requested ease over the armhole (size M)", () => {
    const input = { armholeLengthMm: 420, bicepWidthMm: 340, capEaseMm: 20 };
    const height = solveSleeveCapHeight(input);
    expect(capLength(170, height) - input.armholeLengthMm).toBeCloseTo(20, 0);
  });

  it("throws a DraftingError when the armhole is impossible for the sleeve width", () => {
    expect(() => solveSleeveCapHeight({ armholeLengthMm: 5000, bicepWidthMm: 340, capEaseMm: 20 })).toThrow(
      DraftingError,
    );
  });

  it("always lands within 0.1 mm of the target ease for realistic bodies (property test)", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 360, max: 520 }),
        fc.integer({ min: 300, max: 420 }),
        fc.integer({ min: 10, max: 40 }),
        (armholeLengthMm, bicepWidthMm, capEaseMm) => {
          const half = bicepWidthMm / 2;
          const target = armholeLengthMm + capEaseMm;
          fc.pre(target > capLength(half, 50) && target < capLength(half, 250));
          const height = solveSleeveCapHeight({ armholeLengthMm, bicepWidthMm, capEaseMm });
          expect(Math.abs(capLength(half, height) - target)).toBeLessThanOrEqual(0.1);
        },
      ),
    );
  });
});
