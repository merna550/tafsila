import { fabricOptionsSchema } from "@tafsila/schemas";
import { describe, expect, it } from "vitest";
import { fabricResult } from "./fabric-result";
import { type NESTING_DESIGNS, fixturePattern } from "./test-support/fixtures";

/**
 * Recorded strip lengths (mm) and lengths to buy (m, default 5 % shrinkage, no repeat) of the five fixture patterns,
 * nesting version 1.0.0. Merna compares them with her hand layouts in #322 (docs/test-cases/engine/yardage-regression.md).
 * A change here must be deliberate: update the table, the test-case file and, when layouts move, NESTING_VERSION.
 */
const RECORDED: ReadonlyArray<
  readonly [
    keyof typeof NESTING_DESIGNS,
    string,
    number,
    "folded" | "open",
    number,
    number,
    number,
    number,
    number,
    number,
  ]
> = [
  ["seedDress", "M", 1400, "folded", 1301, 0, 180, 1.4, 0, 0.2],
  ["seedDress", "M", 1400, "open", 1212, 0, 180, 1.3, 0, 0.2],
  ["seedDress", "M", 1150, "folded", 1793, 0, 180, 1.9, 0, 0.2],
  ["seedDress", "M", 1150, "open", 1572, 0, 180, 1.7, 0, 0.2],
  ["seedDress", "XXL", 1400, "folded", 1805, 0, 189, 1.9, 0, 0.2],
  ["seedDress", "XXL", 1400, "open", 1568, 0, 189, 1.7, 0, 0.2],
  ["seedDress", "XXL", 1150, "folded", 2327, 0, 189, 2.5, 0, 0.2],
  ["seedDress", "XXL", 1150, "open", 1877, 0, 189, 2, 0, 0.2],
  ["vNeckHalfCircleDress", "M", 1400, "folded", 1859, 0, 427, 2, 0, 0.5],
  ["vNeckHalfCircleDress", "M", 1400, "open", 1846, 0, 427, 2, 0, 0.5],
  ["vNeckHalfCircleDress", "M", 1150, "folded", 898, 0, 427, 1, 0, 0.5],
  ["vNeckHalfCircleDress", "M", 1150, "open", 1601, 0, 427, 1.7, 0, 0.5],
  ["vNeckHalfCircleDress", "XXL", 1400, "folded", 1661, 0, 401, 1.8, 0, 0.5],
  ["vNeckHalfCircleDress", "XXL", 1400, "open", 2195, 0, 401, 2.4, 0, 0.5],
  ["vNeckHalfCircleDress", "XXL", 1150, "folded", 1109, 0, 401, 1.2, 0, 0.5],
  ["vNeckHalfCircleDress", "XXL", 1150, "open", 1880, 0, 401, 2, 0, 0.5],
  ["setInSleeveBlouse", "M", 1400, "folded", 917, 0, 180, 1, 0, 0.2],
  ["setInSleeveBlouse", "M", 1400, "open", 887, 0, 180, 1, 0, 0.2],
  ["setInSleeveBlouse", "M", 1150, "folded", 1073, 0, 180, 1.2, 0, 0.2],
  ["setInSleeveBlouse", "M", 1150, "open", 1045, 0, 180, 1.1, 0, 0.2],
  ["setInSleeveBlouse", "XXL", 1400, "folded", 1103, 0, 189, 1.2, 0, 0.2],
  ["setInSleeveBlouse", "XXL", 1400, "open", 1105, 0, 189, 1.2, 0, 0.2],
  ["setInSleeveBlouse", "XXL", 1150, "folded", 1433, 0, 189, 1.6, 0, 0.2],
  ["setInSleeveBlouse", "XXL", 1150, "open", 1164, 0, 189, 1.3, 0, 0.2],
  ["gatheredKneeSkirt", "M", 1400, "folded", 1240, 0, 854, 1.4, 0, 0.9],
  ["gatheredKneeSkirt", "M", 1400, "open", 1240, 0, 854, 1.4, 0, 0.9],
  ["gatheredKneeSkirt", "M", 1150, "folded", 1240, 0, 854, 1.4, 0, 0.9],
  ["gatheredKneeSkirt", "M", 1150, "open", 1240, 0, 854, 1.4, 0, 0.9],
  ["gatheredKneeSkirt", "XXL", 1400, "folded", 1259, 0, 1094, 1.4, 0, 1.2],
  ["gatheredKneeSkirt", "XXL", 1400, "open", 1259, 0, 1094, 1.4, 0, 1.2],
  ["gatheredKneeSkirt", "XXL", 1150, "folded", 2354, 0, 1094, 2.5, 0, 1.2],
  ["gatheredKneeSkirt", "XXL", 1150, "open", 1259, 0, 1094, 1.4, 0, 1.2],
  ["linedSidePocketDress", "M", 1400, "folded", 1536, 1065, 180, 1.7, 1.2, 0.2],
  ["linedSidePocketDress", "M", 1400, "open", 1391, 1065, 180, 1.5, 1.2, 0.2],
  ["linedSidePocketDress", "M", 1150, "folded", 1824, 1578, 180, 2, 1.7, 0.2],
  ["linedSidePocketDress", "M", 1150, "open", 1668, 1271, 180, 1.8, 1.4, 0.2],
  ["linedSidePocketDress", "XXL", 1400, "folded", 1860, 1606, 189, 2, 1.7, 0.2],
  ["linedSidePocketDress", "XXL", 1400, "open", 1698, 1307, 189, 1.8, 1.4, 0.2],
  ["linedSidePocketDress", "XXL", 1150, "folded", 2327, 1978, 189, 2.5, 2.1, 0.2],
  ["linedSidePocketDress", "XXL", 1150, "open", 2043, 1687, 189, 2.2, 1.8, 0.2],
];

/** Largest drift of a strip length from the recorded value, in mm (rounding of the record). */
const RECORD_TOLERANCE_MM = 1;

/** One recorded row. */
type Row = (typeof RECORDED)[number];

/**
 * Checks one recorded row against a fresh calculation.
 *
 * @param row - The recorded row.
 */
function expectRecorded(row: Row): void {
  const [name, size, widthMm, layout, mainMm, liningMm, interfacingMm, ...metres] = row;
  const result = fabricResult(fixturePattern(name, size), fabricOptionsSchema.parse({ widthMm, layout }));
  const strips = [result.main, result.lining, result.interfacing].map((r) => r.stripLengthMm);
  [mainMm, liningMm, interfacingMm].forEach((mm, i) => {
    expect(Math.abs(strips[i]! - mm)).toBeLessThanOrEqual(RECORD_TOLERANCE_MM);
  });
  expect([result.main.lengthM, result.lining.lengthM, result.interfacing.lengthM]).toEqual(metres);
}

describe("recorded lengths of the five fixture patterns", () => {
  for (const row of RECORDED) {
    it(`${row[0]} ${row[1]} ${row[2]} mm ${row[3]}`, () => expectRecorded(row));
  }
});
