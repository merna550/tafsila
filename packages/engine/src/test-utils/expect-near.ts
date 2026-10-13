/** Test helper shared by the geometry tests (not part of the engine API). */
import { expect } from "vitest";
import type { Point } from "../geometry/point";

/** Digits passed to `toBeCloseTo` for ± 0.01 mm (issue #124 acceptance tolerance). */
const MM_DIGITS = 2;

/**
 * Asserts two points are equal to ± 0.01 mm.
 *
 * @param actual - Point the code produced.
 * @param expected - Known answer.
 */
export function expectNear(actual: Point, expected: Point): void {
  expect(actual.x).toBeCloseTo(expected.x, MM_DIGITS);
  expect(actual.y).toBeCloseTo(expected.y, MM_DIGITS);
}
