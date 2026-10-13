import type { Measurements, SizeChart } from "@tafsila/schemas";
import { describe, expect, it } from "vitest";
import { exportChartCsv, importChartCsv, parseCsvRows } from "./size-chart-csv";

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
  shoulderWidth: 375,
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
const CHART: SizeChart = { L: size(1000), M: size(920), S: size(840) };

describe("parseCsvRows", () => {
  it("handles quotes, doubled quotes, a BOM and every kind of line break", () => {
    const rows = parseCsvRows('﻿a,"b,1","say ""hi"""\r\nc,d,e\rf,g,h\n');
    expect(rows).toEqual([
      ["a", "b,1", 'say "hi"'],
      ["c", "d", "e"],
      ["f", "g", "h"],
    ]);
  });

  it("keeps a line break inside quotes and a last row without a final newline", () => {
    expect(parseCsvRows('"a\nb",c\nd,e')).toEqual([
      ["a\nb", "c"],
      ["d", "e"],
    ]);
  });

  it("splits on semicolons when the header has no comma", () => {
    expect(parseCsvRows("measurement;S;M\nbust;84,5;92")).toEqual([
      ["measurement", "S", "M"],
      ["bust", "84,5", "92"],
    ]);
  });
});

describe("exportChartCsv", () => {
  it("writes the header in reading order and one row per measurement in cm", () => {
    const lines = exportChartCsv(CHART).trimEnd().split("\r\n");
    expect(lines[0]).toBe("measurement,S,M,L");
    expect(lines).toContain("bust,84,92,100");
    expect(lines).toContain("shoulderWidth,37.5,37.5,37.5");
    expect(lines).toContain("underBust,,,");
    expect(lines).toHaveLength(19);
  });
});

describe("importChartCsv", () => {
  it("round-trips an exported chart", () => {
    const result = importChartCsv(exportChartCsv(CHART), "en");
    expect(result.problems).toEqual([]);
    expect(result.chart).toEqual(CHART);
  });

  it("accepts Arabic-Indic digits, a decimal comma in a semicolon file and a BOM", () => {
    const csv = exportChartCsv({ S: size(840) }).replaceAll(",", ";");
    const result = importChartCsv(`\uFEFF${csv.replace("bust;84", "bust;٨٤٫٥")}`, "en");
    expect(result.problems).toEqual([]);
    expect(result.chart?.S?.bust).toBe(845);
  });

  it("reports a missing key header", () => {
    expect(importChartCsv("name,S\nbust,84", "en").problems).toContainEqual({ kind: "header" });
  });

  it("reports an empty file", () => {
    expect(importChartCsv("  \r\n\r\n", "en").problems).toEqual([{ kind: "empty" }]);
  });

  it("reports unknown and duplicate rows with their line numbers, and missing rows", () => {
    const csv = "measurement,S\nbust,84\nbust,85\nshoeSize,38\n";
    const { problems } = importChartCsv(csv, "en");
    expect(problems).toContainEqual({ kind: "duplicateRow", line: 3, key: "bust" });
    expect(problems).toContainEqual({ kind: "unknownRow", line: 4, key: "shoeSize" });
    expect(problems).toContainEqual({ kind: "missingRow", field: "waist" });
  });

  it("reports unreadable and missing cells per size and measurement", () => {
    const csv = exportChartCsv({ S: size(840), M: size(920) }).replace("bust,84,92", "bust,abc,");
    const { problems, chart } = importChartCsv(csv, "en");
    expect(chart).toBeUndefined();
    expect(problems).toContainEqual({ kind: "cell", line: 2, size: "S", field: "bust", error: "notANumber" });
    expect(problems).toContainEqual({ kind: "cell", line: 2, size: "M", field: "bust", error: "required" });
  });

  it("reports duplicate size columns and a file without sizes", () => {
    expect(importChartCsv("measurement,S,S\n", "en").problems).toContainEqual({
      kind: "duplicateSize",
      size: "S",
    });
    expect(importChartCsv("measurement\n", "en").problems).toContainEqual({ kind: "noSizes" });
  });

  it("reports the engine's errors for a well-formed file with impossible values", () => {
    const bad = exportChartCsv({ S: size(840) }).replace("highBust,80", "highBust,99");
    const { problems, chart } = importChartCsv(bad, "en");
    expect(chart).toBeUndefined();
    expect(problems.some((p) => p.kind === "engine" && p.size === "S")).toBe(true);
  });

  it("lets underBust stay empty", () => {
    const result = importChartCsv(exportChartCsv({ S: size(840) }), "en");
    expect(result.chart?.S?.underBust).toBeUndefined();
  });
});
