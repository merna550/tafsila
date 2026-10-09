// Tests for the weekly agent usage report (issue #36), with fixture records.
import { describe, expect, it } from "vitest";
import {
  buildReport,
  findFlags,
  inWindow,
  isoWeek,
  median,
  parseRecords,
  suggest,
  topExpensive,
  totals,
} from "./agent-report.mjs";

const now = new Date("2026-10-11T12:00:00Z"); // Sunday
let id = 0;
/**
 * Builds a fixture record.
 *
 * @param over Fields to override.
 * @returns A record.
 */
const rec = (over = {}) => ({
  run_id: String(++id),
  issue: 1,
  pr: 10,
  source: "action",
  model: "sonnet",
  size: "M",
  areas: ["api"],
  type: "feature",
  started_at: "2026-10-08T10:00:00Z",
  duration_s: 600,
  num_turns: 20,
  input_tokens: 1000,
  output_tokens: 1000,
  cache_read_tokens: 8000,
  cache_write_tokens: 1000,
  cache_hit_ratio: 0.8,
  est_cost_usd: 1,
  outcome: "pr_opened",
  git_sha: "a",
  ...over,
});

describe("helpers", () => {
  it("computes medians and ISO weeks", () => {
    expect(median([])).toBe(0);
    expect(median([3, 1, 2])).toBe(2);
    expect(median([1, 2, 3, 4])).toBe(2.5);
    expect(isoWeek(new Date("2026-10-10T00:00:00Z"))).toEqual({ year: 2026, week: 41 });
  });

  it("parses JSON lines and skips broken ones", () => {
    expect(parseRecords('{"a":1}\nbroken\n\n{"b":2}')).toHaveLength(2);
    expect(parseRecords(undefined)).toEqual([]);
  });

  it("splits records into this week and the week before", () => {
    const records = [
      rec(),
      rec({ started_at: "2026-10-01T10:00:00Z" }),
      rec({ started_at: "2026-09-01T10:00:00Z" }),
    ];
    expect(inWindow(records, now)).toHaveLength(1);
    expect(inWindow(records, now, 1)).toHaveLength(1);
    expect(totals(inWindow(records, now)).runs).toBe(1);
  });

  it("ranks the most expensive runs", () => {
    const top = topExpensive([
      rec({ est_cost_usd: 1 }),
      rec({ est_cost_usd: 5 }),
      rec({ est_cost_usd: 3 }),
      rec({ est_cost_usd: 2 }),
    ]);
    expect(top.map((r) => r.est_cost_usd)).toEqual([5, 3, 2]);
  });
});

describe("flags", () => {
  it("flags cost, cache, turns, outcome and repeated change requests", () => {
    const week = [
      ...Array.from({ length: 4 }, () => rec()),
      rec({ est_cost_usd: 9 }),
      rec({ cache_hit_ratio: 0.3 }),
      rec({ num_turns: 61 }),
      rec({ outcome: "blocked" }),
      rec({ issue: 7, pr: 70 }),
      rec({ issue: 7, pr: 70 }),
      rec({ issue: 7, pr: 70 }),
    ];
    const text = findFlags(week).join("\n");
    expect(text).toContain("above 3x the median");
    expect(text).toContain("below 50%");
    expect(text).toContain("61 turns");
    expect(text).toContain("outcome blocked");
    expect(text).toContain("#7: 2 follow-up runs");
  });

  it("flags nothing for healthy runs", () => {
    expect(findFlags([rec({ issue: 1 }), rec({ issue: 2 }), rec({ issue: 3 })])).toEqual([]);
  });
});

describe("suggestions", () => {
  it("suggests haiku for cheap first-time sonnet areas and docs work for turn-heavy areas", () => {
    const cheap = Array.from({ length: 3 }, () => rec({ areas: ["api"], num_turns: 15 }));
    const heavy = [rec({ areas: ["ui"], num_turns: 55 })];
    const tips = suggest([...cheap, ...heavy]).join("\n");
    expect(tips).toContain("area:api sonnet runs are cheap");
    expect(tips).toContain("area:ui runs use many turns");
  });
});

describe("buildReport", () => {
  it("renders every section from fixture data", () => {
    const records = [
      rec(),
      rec({ size: "S", areas: ["ui"], model: "haiku" }),
      rec({ started_at: "2026-10-02T10:00:00Z" }),
    ];
    const { title, body } = buildReport(records, now);
    expect(title).toBe("Agent usage report — week 41 (2026)");
    for (const heading of [
      "## Totals",
      "Median by size",
      "Median by area",
      "Median by model",
      "## Top 3 most expensive",
      "## Flags",
      "## Suggestions",
    ]) {
      expect(body).toContain(heading);
    }
    expect(body).toContain("| Runs | 2 | 1 | +100% |");
  });

  it("does not crash without records or with missing fields", () => {
    expect(buildReport([], now).body).toContain("No runs.");
    expect(() => buildReport([{ started_at: "2026-10-08T10:00:00Z" }], now)).not.toThrow();
  });
});
