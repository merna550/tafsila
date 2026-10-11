// Tests for the Actions usage report (issue #86), with fixture runs.
import { describe, expect, it } from "vitest";
import { aggregateUsage, billedMinutes, durationMs, formatTable } from "./actions-usage.mjs";

/**
 * Builds a fixture run.
 *
 * @param name Workflow name.
 * @param times Created, started and updated ISO times.
 * @param extra Extra fields.
 * @returns A run.
 */
const run = (name, times, extra = {}) => ({
  name,
  created_at: times[0],
  run_started_at: times[1],
  updated_at: times[2],
  ...extra,
});

describe("durationMs", () => {
  it("returns the difference, and 0 for missing or negative values", () => {
    expect(durationMs("2026-10-01T00:00:00Z", "2026-10-01T00:01:30Z")).toBe(90_000);
    expect(durationMs(null, "2026-10-01T00:01:30Z")).toBe(0);
    expect(durationMs("2026-10-01T00:02:00Z", "2026-10-01T00:01:00Z")).toBe(0);
  });
});

describe("billedMinutes", () => {
  it("rounds every job up to a whole minute", () => {
    const jobs = [
      { started_at: "2026-10-01T00:00:00Z", completed_at: "2026-10-01T00:00:03Z" },
      { started_at: "2026-10-01T00:00:00Z", completed_at: "2026-10-01T00:02:10Z" },
    ];
    expect(billedMinutes(jobs)).toBe(4);
  });
});

describe("aggregateUsage", () => {
  const runs = [
    run("Code quality", ["2026-10-05T00:00:00Z", "2026-10-05T00:00:00Z", "2026-10-05T00:06:00Z"]),
    run("Code quality", ["2026-10-06T00:00:00Z", "2026-10-06T00:00:00Z", "2026-10-06T00:04:00Z"]),
    run("Dispatch agent", ["2026-10-06T00:00:00Z", "2026-10-06T00:00:00Z", "2026-10-06T00:01:00Z"], {
      minutes: 16,
    }),
    run("Docker image", ["2026-08-01T00:00:00Z", "2026-08-01T00:00:00Z", "2026-08-01T01:00:00Z"]),
  ];

  it("sums per workflow, biggest first, ignoring runs before the start date", () => {
    expect(aggregateUsage(runs, "2026-09-11T00:00:00Z")).toEqual([
      { workflow: "Dispatch agent", runs: 1, minutes: 16 },
      { workflow: "Code quality", runs: 2, minutes: 10 },
    ]);
  });

  it("prints a Markdown table with a total", () => {
    const table = formatTable(aggregateUsage(runs, "2026-09-11T00:00:00Z"));
    expect(table).toContain("| Dispatch agent | 1 | 16.0 |");
    expect(table).toContain("| **Total** | **3** | **26.0** |");
  });
});
