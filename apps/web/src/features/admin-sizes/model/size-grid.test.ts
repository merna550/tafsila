import type { Measurements, SizeChart } from "@tafsila/schemas";
import { describe, expect, it } from "vitest";
import { cellKey, chartToTexts, judgeGrid, setCell } from "./size-grid";

/**
 * A plausible size in millimetres.
 *
 * @param bust - Bust in mm.
 * @returns Measurements.
 */
const size = (bust: number): Measurements => ({
  unit: "mm",
  height: 1650,
  bust,
  highBust: bust - 40,
  waist: bust - 180,
  hip: bust + 80,
  hipDepth: 200,
  neck: 360,
  shoulderWidth: 380,
  backLength: 400,
  frontLength: 440,
  bustPointDistance: 180,
  bustHeight: 260,
  armLength: 580,
  upperArm: 290,
  wrist: 160,
  waistToKnee: 600,
  waistToFloor: 1020,
});

const CHART: SizeChart = { M: size(920), S: size(840) };

describe("chartToTexts", () => {
  it("writes centimetres with one decimal at most, sizes in reading order", () => {
    const texts = chartToTexts({ ...CHART, L: { ...size(1000), shoulderWidth: 375 } });
    expect(Object.keys(texts)).toEqual(["S", "M", "L"]);
    expect(texts.S?.bust).toBe("84");
    expect(texts.L?.shoulderWidth).toBe("37.5");
    expect(texts.S?.underBust).toBe("");
  });
});

describe("judgeGrid", () => {
  const saved = chartToTexts(CHART);

  it("starts clean and cannot be saved", () => {
    const verdict = judgeGrid(saved, saved, "en");
    expect(verdict.dirty.size).toBe(0);
    expect(verdict.problems).toEqual([]);
    expect(verdict.canSave).toBe(false);
    expect(verdict.chart?.M?.bust).toBe(920);
  });

  it("marks an edited cell dirty and allows saving", () => {
    const verdict = judgeGrid(saved, setCell(saved, "M", "waist", "75"), "en");
    expect([...verdict.dirty]).toEqual([cellKey("M", "waist")]);
    expect(verdict.canSave).toBe(true);
    expect(verdict.chart?.M?.waist).toBe(750);
  });

  it("does not count the same value written differently as a change", () => {
    const verdict = judgeGrid(saved, setCell(saved, "M", "bust", "92,0"), "en");
    expect(verdict.dirty.size).toBe(0);
  });

  it("marks an unreadable cell invalid and blocks saving", () => {
    const verdict = judgeGrid(saved, setCell(saved, "S", "hip", "abc"), "en");
    expect(verdict.invalid.has(cellKey("S", "hip"))).toBe(true);
    expect(verdict.problems[0]).toMatchObject({
      size: "S",
      field: "hip",
      problem: { kind: "unreadable", error: "notANumber" },
    });
    expect(verdict.chart).toBeUndefined();
    expect(verdict.canSave).toBe(false);
  });

  it("flags an empty required cell and accepts an empty optional one", () => {
    const empty = judgeGrid(saved, setCell(saved, "S", "neck", ""), "en");
    expect(empty.problems[0]).toMatchObject({ field: "neck", problem: { error: "required" } });
    const optional = judgeGrid(saved, setCell(saved, "S", "underBust", ""), "en");
    expect(optional.problems).toEqual([]);
  });

  it("uses the engine: a high bust above the bust marks both cells in the size", () => {
    const verdict = judgeGrid(saved, setCell(saved, "M", "highBust", "99"), "en");
    expect(verdict.canSave).toBe(false);
    const engine = verdict.problems.filter((entry) => entry.problem.kind === "engine");
    expect(engine.length).toBeGreaterThan(0);
    expect(verdict.invalid.has(cellKey("M", "highBust"))).toBe(true);
    expect(engine.every((entry) => entry.size === "M")).toBe(true);
  });

  it("returns the engine message in the chosen language", () => {
    const ar = judgeGrid(saved, setCell(saved, "M", "highBust", "99"), "ar");
    const text = ar.problems.find((entry) => entry.problem.kind === "engine")?.problem;
    expect(text && "text" in text ? text.text : "").toMatch(/[؀-ۿ]/);
  });
});
