import { cutPlanFixture } from "@tafsila/test-fixtures";
import { describe, expect, it } from "vitest";
import { CUT_SETTINGS_KEY, parseCurveStep } from "./settings";
import { clearTicks, parseTicks, pieceProgress, ticksKey, toStoredTicks, toggleTick } from "./ticks";

const steps = cutPlanFixture.pieces[0].steps;

describe("ticks", () => {
  it("keys by version and curve step", () => {
    expect(ticksKey("v1", 25)).toBe("tafsila.cut.ticks.v1.25");
    expect(ticksKey("v1", 30)).not.toBe(ticksKey("v1", 25));
  });

  it("round-trips a stored entry and ignores other engine versions", () => {
    const stored = toStoredTicks("1.4.0", new Set(["a", "b"]));
    expect([...parseTicks(stored, "1.4.0")]).toEqual(["a", "b"]);
    expect(parseTicks(stored, "1.5.0").size).toBe(0);
  });

  it("rejects junk and unknown shapes", () => {
    for (const raw of [
      null,
      3,
      "x",
      {},
      { v: 2, engineVersion: "1", ticked: [] },
      { v: 1, engineVersion: "1", ticked: [1] },
    ]) {
      expect(parseTicks(raw, "1").size).toBe(0);
    }
  });

  it("toggling twice is the identity", () => {
    const start = new Set(["a"]);
    expect([...toggleTick(toggleTick(start, "b"), "b")]).toEqual(["a"]);
  });

  it("clears", () => {
    expect(clearTicks().size).toBe(0);
  });

  it("counts only ids that exist in the steps", () => {
    const ticked = new Set([steps[0].id, "gone#9"]);
    expect(pieceProgress(steps, ticked)).toEqual({ done: 1, total: 3 });
  });
});

describe("curve step setting", () => {
  it("accepts 20, 25 and 30 and falls back to 25", () => {
    expect(parseCurveStep({ curveStepMm: 30 })).toBe(30);
    expect(parseCurveStep({ curveStepMm: 21 })).toBe(25);
    expect(parseCurveStep(null)).toBe(25);
    expect(CUT_SETTINGS_KEY).toBe("tafsila.cut.settings");
  });
});
