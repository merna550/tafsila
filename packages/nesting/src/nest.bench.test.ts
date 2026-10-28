import { fabricOptionsSchema } from "@tafsila/schemas";
import { describe, expect, it } from "vitest";
import { nest } from "./nest";
import { preparePieces } from "./prepare-pieces";
import { type NESTING_DESIGNS, fixturePattern } from "./test-support/fixtures";

/** Time budget of one fabric kind, in ms (#313 target: 3 s in a worker on a mid laptop). */
const BUDGET_MS = 3000;

/** Timing is flaky on shared CI runners: run there only when NESTING_BENCH is set (decision 316 item 5). */
const skip = Boolean(process.env.CI) && !process.env.NESTING_BENCH;

/** The three slowest cases of ADR-313. */
const SLOWEST: ReadonlyArray<readonly [keyof typeof NESTING_DESIGNS, string]> = [
  ["vNeckHalfCircleDress", "XXL"],
  ["linedSidePocketDress", "M"],
  ["seedDress", "XXL"],
];

describe.skipIf(skip)("nesting time", () => {
  it.each(SLOWEST)("%s %s open on 140 cm stays under 3 s per fabric kind", (name, size) => {
    const prepared = preparePieces(
      fixturePattern(name, size),
      fabricOptionsSchema.parse({ layout: "open", widthMm: 1400 }),
    );
    const start = performance.now();
    const result = nest(prepared);
    const elapsedMs = performance.now() - start;
    expect(result.main.placements.length).toBeGreaterThan(0);
    // all three kinds together must fit in one kind's budget
    expect(elapsedMs).toBeLessThan(BUDGET_MS);
  });
});
