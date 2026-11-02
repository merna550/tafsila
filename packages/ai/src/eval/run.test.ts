/**
 * Evaluation run tests (issue #338): the CI run with the fake provider on the 3 sample labels, failures, timeout,
 * photo cap and budget guard. No network: the fake provider and scripted answers only.
 */
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { describe, expect, it } from "vitest";
import { analyzeDesign, type AnalyzeDesignInput, type AnalyzeDesignOutput } from "../analyze-design";
import { createFakeAi } from "../index";
import { scriptedDeps, scriptedModel } from "../test-models";
import { parseLabels } from "./labels";
import { toMarkdown } from "./markdown";
import { buildReport, DEFAULT_CHAT_ALLOWANCE_EGP, DEFAULT_USD_EGP, type ReportMeta } from "./report";
import { DEFAULT_TIMEOUT_MS, runEval, type RunDeps, type RunLimits } from "./run";

/** The 3 sample labels, sorted by id. */
const labels = parseLabels(
  readFileSync(
    createRequire(import.meta.url).resolve("@tafsila/test-fixtures/ai-eval/labels.sample.json"),
    "utf8",
  ),
);

/** Report details of a fake run. */
const meta: ReportMeta = {
  startedAt: "2026-11-02T00:00:00.000Z",
  provider: "fake",
  model: "fake",
  usdEgp: DEFAULT_USD_EGP,
  chatAllowanceEgp: DEFAULT_CHAT_ALLOWANCE_EGP,
};

/** The CI limits: hint on, so the fake provider answers per category. */
const limits: RunLimits = { hint: true, timeoutMs: DEFAULT_TIMEOUT_MS };

/** Clock step of the fake runs, in ms. */
const TICK_MS = 1_000;

/**
 * Run dependencies with the fake provider and a fixed clock, so two runs are identical.
 *
 * @param failId - A label whose photo cannot be loaded.
 * @returns The dependencies.
 */
function fakeDeps(failId?: string): RunDeps {
  let tick = 0;
  const deps = { ...createFakeAi(), now: () => (tick += TICK_MS) };
  return {
    analyze: (input) => analyzeDesign(input, deps),
    photoFor: (label) =>
      label.id === failId
        ? Promise.reject(new Error(`photo ${label.photo} not found`))
        : Promise.resolve({
            url: `https://example.test/${label.photo}`,
            mediaType: "image/jpeg",
            view: "front",
          }),
  };
}

/**
 * Dependencies whose every call costs the same and takes a fixed time.
 *
 * @param costUsd - Cost per call, or undefined for a model with no price.
 * @returns The dependencies and the list of analysed calls.
 */
function pricedDeps(costUsd: number | undefined): RunDeps & { calls: AnalyzeDesignInput[] } {
  const base = fakeDeps();
  const calls: AnalyzeDesignInput[] = [];
  return {
    calls,
    photoFor: base.photoFor,
    analyze: async (input): Promise<AnalyzeDesignOutput> => {
      calls.push(input);
      const output = await base.analyze(input);
      return { ...output, usage: { ...output.usage, costUsd } };
    },
  };
}

describe("runEval with the fake provider (the CI run)", () => {
  it("writes a report with every section", async () => {
    const report = buildReport(await runEval(labels, limits, fakeDeps()), limits, meta);
    expect(report.photos).toEqual({ analysed: 3, failed: [] });
    expect(report.accuracy.micro.compared).toBeGreaterThan(0);
    expect(report.accuracy.perFeature.map((row) => row.path)).toContain("neckline.front");
    expect(report.latency).toMatchObject({ p50Ms: TICK_MS, p95Ms: TICK_MS, withinBound: true });
    expect(report.cost).toMatchObject({
      totalUsd: 0,
      perPatternEgp: DEFAULT_CHAT_ALLOWANCE_EGP,
      withinTarget: true,
    });
    expect(report.unsupported).toEqual({ labelled: 1, matched: 0, recall: 0 });
    const markdown = toMarkdown(report);
    for (const heading of [
      "Accuracy per feature",
      "Confidence flag",
      "Latency and cost",
      "Most common wrong answers",
    ]) {
      expect(markdown).toContain(`## ${heading}`);
    }
  });

  it("lists a failing photo without stopping the run", async () => {
    const report = buildReport(await runEval(labels, limits, fakeDeps("sample-02")), limits, meta);
    expect(report.photos.analysed).toBe(3);
    expect(report.photos.failed).toEqual([{ id: "sample-02", error: "photo sample-02.jpg not found" }]);
    expect(report.runs[1]?.features.every((score) => !score.correct)).toBe(true);
    expect(toMarkdown(report)).toContain("- sample-02: photo sample-02.jpg not found");
  });

  it("gives byte-identical JSON on two runs apart from the timestamp", async () => {
    const first = buildReport(await runEval(labels, limits, fakeDeps()), limits, meta);
    const second = buildReport(await runEval(labels, limits, fakeDeps()), limits, {
      ...meta,
      startedAt: "2026-11-03T00:00:00.000Z",
    });
    expect(JSON.stringify({ ...second, meta: first.meta })).toBe(JSON.stringify(first));
  });

  it("sends no category hint when the hint is off", async () => {
    const deps = pricedDeps(0);
    await runEval(labels, { ...limits, hint: false }, deps);
    expect(deps.calls.every((call) => call.hint === undefined)).toBe(true);
  });
});

describe("runEval failures and limits", () => {
  it("records the usage of a refused answer", async () => {
    const model = scriptedModel([{ text: "not json" }, { text: '{"spec":{}}' }]);
    const deps: RunDeps = { ...fakeDeps(), analyze: (input) => analyzeDesign(input, scriptedDeps(model)) };
    const run = await runEval(labels.slice(0, 1), limits, deps);
    expect(run.photos[0]).toMatchObject({ result: undefined, usage: { attempts: 2 } });
    expect(run.photos[0]?.error).toMatch(/invalid after one retry/);
  });

  it("times out a slow call", async () => {
    const deps: RunDeps = { ...fakeDeps(), analyze: () => new Promise<never>(() => undefined) };
    const run = await runEval(labels.slice(0, 1), { ...limits, timeoutMs: 5 }, deps);
    expect(run.photos[0]).toMatchObject({ error: "timed out after 5 ms", usage: undefined });
  });

  it("stops at the photo cap", async () => {
    const run = await runEval(labels, { ...limits, maxPhotos: 2 }, fakeDeps());
    expect(run.stopped).toEqual({ reason: "max-photos", afterPhotos: 2 });
  });

  it("stops before the call that would pass the budget, and says so", async () => {
    const deps = pricedDeps(0.004);
    const run = await runEval(labels, { ...limits, budgetUsd: 0.01 }, deps);
    expect(deps.calls).toHaveLength(2);
    expect(run.stopped).toEqual({ reason: "budget", afterPhotos: 2 });
    expect(toMarkdown(buildReport(run, limits, meta))).toContain("Stopped early (budget) after 2 photos.");
  });

  it("stops when a budget is set but the model has no price", async () => {
    const deps = pricedDeps(undefined);
    const run = await runEval(labels, { ...limits, budgetUsd: 1 }, deps);
    expect(run.stopped).toEqual({ reason: "cost-unknown", afterPhotos: 1 });
    expect(buildReport(run, limits, meta).cost).toMatchObject({ totalUsd: null, withinTarget: null });
  });
});

describe("buildReport", () => {
  it("reports no latency and unknown cost for an empty run", () => {
    const report = buildReport({ photos: [], stopped: undefined }, limits, meta);
    expect(report.latency).toMatchObject({ p50Ms: null, withinBound: null });
    expect(report.cost.totalUsd).toBeNull();
    expect(toMarkdown(report)).toContain("p95 unknown ms");
  });
});
