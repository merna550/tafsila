import { DEFAULT_FABRIC_OPTIONS, fabricOptionsSchema } from "@tafsila/schemas";
import { describe, expect, it } from "vitest";
import { fabricResult } from "./fabric-result";
import { NESTING_VERSION } from "./nesting-version";
import { fixturePattern } from "./test-support/fixtures";
import { patternOf, rectPiece } from "./test-support/pieces";
import { generatePattern } from "@tafsila/engine";
import { dartedBlouse, egyptianSizeChart } from "@tafsila/test-fixtures";

describe("fabricResult", () => {
  it("adds shrinkage and the repeat per row to each kind apart", () => {
    const pattern = patternOf(
      rectPiece({ id: "a", widthMm: 300, heightMm: 1000 }),
      rectPiece({ id: "b", widthMm: 300, heightMm: 500, cut: { fabric: "lining" } }),
    );
    const options = fabricOptionsSchema.parse({ layout: "open", shrinkagePercent: 10, patternRepeatMm: 150 });
    const result = fabricResult(pattern, options);
    // main: 1000 mm + 2 mm outline growth each side → 1004 mm strip, + 10 % + 150 → 1254.4 mm → 1.3 m
    expect(result.main.stripLengthMm).toBeCloseTo(1004, 6);
    expect(result.main.rows).toBe(1);
    expect(result.main.lengthM).toBeCloseTo(1.3, 9);
    expect(result.lining.lengthM).toBeCloseTo(0.8, 9);
    expect(result.interfacing).toMatchObject({ placements: [], lengthM: 0 });
    expect(result.nestingVersion).toBe(NESTING_VERSION);
  });

  it("gives the same output for the same input", () => {
    const pattern = fixturePattern("seedDress", "M");
    expect(fabricResult(pattern, DEFAULT_FABRIC_OPTIONS)).toEqual(
      fabricResult(pattern, DEFAULT_FABRIC_OPTIONS),
    );
  });

  it("keeps the placements of dartedBlouse M on 140 cm folded (snapshot)", () => {
    const pattern = generatePattern(dartedBlouse, egyptianSizeChart.M!);
    const result = fabricResult(pattern, DEFAULT_FABRIC_OPTIONS);
    const round = (n: number) => Math.round(n * 100) / 100;
    expect(
      (["main", "lining", "interfacing"] as const).map((kind) => ({
        kind,
        order: result[kind].order,
        stripLengthMm: round(result[kind].stripLengthMm),
        lengthM: result[kind].lengthM,
        placements: result[kind].placements.map((p) => ({ ...p, yMm: round(p.yMm) })),
      })),
    ).toMatchSnapshot();
  });
});
