// Weekly agent usage report (issue #36): turns the records of `agent-runs.jsonl` into the markdown body of one
// GitHub issue (totals, medians, top 3, flags, suggestions). Pure and unit-tested in agent-report.test.mjs;
// the workflow `agent-report.yml` only reads the file from the `metrics` branch and posts the result.
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { totalTokens } from "./agent-usage.mjs";

const DAY_MS = 86_400_000;
export const LIMITS = { sizeMultiple: 3, minCacheRatio: 0.5, maxTurns: 60, maxChangeRequests: 1 };

/**
 * Median of a list of numbers.
 *
 * @param values Numbers.
 * @returns The median, or 0 for an empty list.
 */
export function median(values) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

/**
 * ISO 8601 week number and year of a date.
 *
 * @param date A Date.
 * @returns `{ year, week }`.
 */
export function isoWeek(date) {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const start = Date.UTC(d.getUTCFullYear(), 0, 1);
  return { year: d.getUTCFullYear(), week: Math.ceil(((d - start) / DAY_MS + 1) / 7) };
}

/**
 * Parses JSON Lines, skipping broken lines.
 *
 * @param text Content of agent-runs.jsonl.
 * @returns Records.
 */
export function parseRecords(text) {
  const records = [];
  for (const line of String(text ?? "").split("\n")) {
    try {
      const record = JSON.parse(line);
      if (record && typeof record === "object") records.push(record);
    } catch {
      /* ignore a broken line */
    }
  }
  return records;
}

/**
 * Keeps the records that started in the 7 days before `end`.
 *
 * @param records All records.
 * @param end End of the window (exclusive).
 * @param weeksBack 0 for the last 7 days, 1 for the 7 days before.
 * @returns Records in the window.
 */
export function inWindow(records, end, weeksBack = 0) {
  const to = end.getTime() - weeksBack * 7 * DAY_MS;
  return records.filter((r) => {
    const t = Date.parse(r.started_at);
    return t >= to - 7 * DAY_MS && t < to;
  });
}

/**
 * Totals of a set of records.
 *
 * @param records Records.
 * @returns `{ runs, tokens, cost, turns }`.
 */
export function totals(records) {
  return {
    runs: records.length,
    tokens: records.reduce((sum, r) => sum + totalTokens(r), 0),
    cost: records.reduce((sum, r) => sum + (r.est_cost_usd ?? 0), 0),
    turns: records.reduce((sum, r) => sum + (r.num_turns ?? 0), 0),
  };
}

/**
 * Median turns, tokens and cost grouped by a key.
 *
 * @param records Records.
 * @param keyOf Function returning the group names of a record (array).
 * @returns Rows `{ key, runs, turns, tokens, cost }` sorted by key.
 */
export function mediansBy(records, keyOf) {
  const groups = new Map();
  for (const record of records) {
    for (const key of keyOf(record)) groups.set(key, [...(groups.get(key) ?? []), record]);
  }
  return [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, rows]) => ({
      key,
      runs: rows.length,
      turns: median(rows.map((r) => r.num_turns ?? 0)),
      tokens: median(rows.map(totalTokens)),
      cost: median(rows.map((r) => r.est_cost_usd ?? 0)),
    }));
}

/**
 * The most expensive runs.
 *
 * @param records Records.
 * @param count How many to return.
 * @returns Records sorted by estimated cost, highest first.
 */
export const topExpensive = (records, count = 3) =>
  [...records].sort((a, b) => (b.est_cost_usd ?? 0) - (a.est_cost_usd ?? 0)).slice(0, count);

/**
 * Flags of one run.
 *
 * @param r A record.
 * @param base Median cost of runs of the same size.
 * @returns Flag sentences.
 */
function runFlags(r, base) {
  const label = `#${r.issue ?? "?"} (run ${r.run_id})`;
  const checks = [
    [
      base > 0 && r.est_cost_usd > base * LIMITS.sizeMultiple,
      `cost ~$${r.est_cost_usd.toFixed(2)} is above ${LIMITS.sizeMultiple}x the median for size ${r.size || "?"} (~$${base.toFixed(2)}).`,
    ],
    [
      r.cache_hit_ratio < LIMITS.minCacheRatio,
      `cache hit ratio ${Math.round(r.cache_hit_ratio * 100)}% is below 50%.`,
    ],
    [r.num_turns > LIMITS.maxTurns, `${r.num_turns} turns is above ${LIMITS.maxTurns}.`],
    [r.outcome === "blocked" || r.outcome === "timeout", `outcome ${r.outcome}.`],
  ];
  return checks.filter(([hit]) => hit).map(([, text]) => `${label}: ${text}`);
}

/**
 * Flags for issues whose PR needed more than one follow-up run.
 *
 * @param week Records of the report week.
 * @returns Flag sentences.
 */
function changeRequestFlags(week) {
  const runs = new Map();
  for (const r of week.filter((x) => x.pr)) runs.set(r.issue, (runs.get(r.issue) ?? 0) + 1);
  return [...runs]
    .filter(([, count]) => count - 1 > LIMITS.maxChangeRequests)
    .map(
      ([issue, count]) =>
        `#${issue}: ${count - 1} follow-up runs after the PR was opened (changes requested more than once).`,
    );
}

/**
 * Finds the runs and issues that need attention.
 *
 * @param week Records of the report week.
 * @param all Records of all weeks (used for the size medians).
 * @returns List of flag sentences.
 */
export function findFlags(week, all = week) {
  const sizeMedian = new Map(mediansBy(all, (r) => [r.size || "?"]).map((row) => [row.key, row.cost]));
  const perRun = week.flatMap((r) => runFlags(r, sizeMedian.get(r.size || "?") ?? 0));
  return [...perRun, ...changeRequestFlags(week)];
}

/**
 * Simple rule-based suggestions per area.
 *
 * @param week Records of the report week.
 * @returns List of suggestion sentences.
 */
export function suggest(week) {
  const out = [];
  for (const row of mediansBy(week, (r) => r.areas ?? [])) {
    const runs = week.filter((r) => (r.areas ?? []).includes(row.key));
    const sonnet = runs.filter((r) => r.model === "sonnet");
    if (
      sonnet.length >= 3 &&
      sonnet.length === runs.length &&
      sonnet.every((r) => r.outcome === "pr_opened") &&
      row.turns <= 25
    ) {
      out.push(`area:${row.key} sonnet runs are cheap and pass first time: try build:haiku.`);
    }
    if (row.turns > 40) {
      out.push(
        `area:${row.key} runs use many turns (median ${row.turns}): they read many files; improve the area CLAUDE.md and docs/CONTEXT_MAP.md.`,
      );
    }
  }
  return out;
}

/**
 * Formats a number of tokens.
 *
 * @param n Tokens.
 * @returns For example "1.8M" or "420k".
 */
const fmtTokens = (n) => (n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : `${Math.round(n / 1e3)}k`);

/**
 * Renders a markdown table of medians.
 *
 * @param title Heading text.
 * @param rows Output of `mediansBy`.
 * @returns Markdown section.
 */
function mediansTable(title, rows) {
  if (!rows.length) return `### ${title}\n\nNo runs.\n`;
  const lines = rows.map(
    (r) => `| ${r.key} | ${r.runs} | ${r.turns} | ${fmtTokens(r.tokens)} | $${r.cost.toFixed(2)} |`,
  );
  return `### ${title}\n\n| ${title.replace("Median by ", "")} | Runs | Turns | Tokens | Est. cost |\n| --- | --- | --- | --- | --- |\n${lines.join("\n")}\n`;
}

/**
 * Formats a week-over-week change.
 *
 * @param now This week value.
 * @param before Previous week value.
 * @returns For example "+20%", "-5%" or "n/a".
 */
function trend(now, before) {
  if (!before) return "n/a";
  const pct = Math.round(((now - before) / before) * 100);
  return `${pct >= 0 ? "+" : ""}${pct}%`;
}

/**
 * Fills missing numeric fields so a partial record cannot break the report.
 *
 * @param record A stored record.
 * @returns The record with numbers and lists defaulted.
 */
const withDefaults = (record) => ({
  input_tokens: 0,
  output_tokens: 0,
  cache_read_tokens: 0,
  cache_write_tokens: 0,
  num_turns: 0,
  est_cost_usd: 0,
  cache_hit_ratio: 1,
  areas: [],
  ...record,
});

/**
 * Builds the weekly report.
 *
 * @param rawRecords All stored records (missing fields are tolerated).
 * @param now Report date (the window is the 7 days before it).
 * @returns `{ title, body }` for the GitHub issue.
 */
export function buildReport(rawRecords, now = new Date()) {
  const records = rawRecords.map(withDefaults);
  const week = inWindow(records, now);
  const previous = inWindow(records, now, 1);
  const { year, week: number } = isoWeek(new Date(now.getTime() - DAY_MS));
  const cur = totals(week);
  const prev = totals(previous);
  const top = topExpensive(week)
    .map(
      (r) =>
        `- #${r.issue ?? "?"}: ~$${r.est_cost_usd.toFixed(2)}, ${r.num_turns} turns, ${Math.round(r.cache_hit_ratio * 100)}% cache`,
    )
    .join("\n");
  const flags = findFlags(week, records);
  const tips = suggest(week);
  const list = (items) => (items.length ? items.map((i) => `- ${i}`).join("\n") : "None.");
  const body = [
    `Records are numbers only (see docs/backend/tutorials/agent-usage.md). Window: the 7 days before ${now.toISOString().slice(0, 10)}.`,
    `## Totals\n\n| | This week | Previous | Trend |\n| --- | --- | --- | --- |\n| Runs | ${cur.runs} | ${prev.runs} | ${trend(cur.runs, prev.runs)} |\n| Tokens | ${fmtTokens(cur.tokens)} | ${fmtTokens(prev.tokens)} | ${trend(cur.tokens, prev.tokens)} |\n| Est. cost (API-equivalent) | $${cur.cost.toFixed(2)} | $${prev.cost.toFixed(2)} | ${trend(cur.cost, prev.cost)} |\n| Turns | ${cur.turns} | ${prev.turns} | ${trend(cur.turns, prev.turns)} |`,
    `## Medians\n\n${mediansTable(
      "Median by size",
      mediansBy(week, (r) => [r.size || "?"]),
    )}\n${mediansTable(
      "Median by area",
      mediansBy(week, (r) => r.areas ?? []),
    )}\n${mediansTable(
      "Median by model",
      mediansBy(week, (r) => [r.model || "?"]),
    )}`,
    `## Top 3 most expensive\n\n${top || "No runs."}`,
    `## Flags\n\n${list(flags)}`,
    `## Suggestions\n\n${list(tips)}`,
  ].join("\n\n");
  return { title: `Agent usage report — week ${number} (${year})`, body };
}

/**
 * CLI: `node scripts/agent-report.mjs FILE [--now ISO_DATE]` prints `{ title, body }` as JSON.
 */
function main() {
  const [file, flag, date] = process.argv.slice(2);
  const text = file ? readFileSync(file, "utf8") : "";
  const now = flag === "--now" ? new Date(date) : new Date();
  console.log(JSON.stringify(buildReport(parseRecords(text), now)));
}

if (process.argv[1] === fileURLToPath(import.meta.url)) main();
