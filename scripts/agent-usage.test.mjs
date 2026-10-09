/* eslint-disable sonarjs/no-os-command-from-path -- tests run git and node from the runner PATH */
// Tests for the agent usage collector (issue #36). Fixtures are tiny hand-written execution files and transcripts.
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  RECORD_FIELDS,
  appendToMetrics,
  cacheHitRatio,
  estimateCost,
  modelFamily,
  outcomeOf,
  parseExecution,
  parseTranscript,
  prBlock,
  summaryLine,
  toRecord,
} from "./agent-usage.mjs";

const SECRET = "ghp_SECRET_TOKEN_123 console.log('code') /home/user/file.ts";
const execution = JSON.stringify([
  { type: "system", model: "claude-sonnet-5-5", prompt: SECRET },
  { type: "assistant", message: { content: [{ type: "text", text: SECRET }] } },
  {
    type: "result",
    subtype: "success",
    is_error: false,
    num_turns: 42,
    duration_ms: 1_380_000,
    total_cost_usd: 2.1,
    result: SECRET,
    usage: {
      input_tokens: 100_000,
      output_tokens: 50_000,
      cache_read_input_tokens: 1_500_000,
      cache_creation_input_tokens: 150_000,
    },
  },
]);

const assistantLine = (id, time, usage) =>
  JSON.stringify({
    type: "assistant",
    timestamp: time,
    message: { id, model: "claude-sonnet-5-5", usage, content: [{ type: "text", text: SECRET }] },
  });
const transcript = [
  JSON.stringify({ type: "user", timestamp: "2026-10-08T10:00:00Z", message: { content: SECRET } }),
  assistantLine("m1", "2026-10-08T10:01:00Z", {
    input_tokens: 10,
    output_tokens: 20,
    cache_read_input_tokens: 30,
  }),
  assistantLine("m1", "2026-10-08T10:01:01Z", {
    input_tokens: 10,
    output_tokens: 20,
    cache_read_input_tokens: 30,
  }),
  assistantLine("m2", "2026-10-08T10:11:00Z", {
    input_tokens: 5,
    output_tokens: 5,
    cache_creation_input_tokens: 10,
  }),
  "not json",
].join("\n");

describe("parseExecution", () => {
  it("reads usage, turns, duration and status from the result message", () => {
    const parsed = parseExecution(execution);
    expect(parsed).toMatchObject({
      input_tokens: 100_000,
      output_tokens: 50_000,
      cache_read_tokens: 1_500_000,
      cache_write_tokens: 150_000,
      num_turns: 42,
      duration_s: 1380,
      status: "success",
    });
  });

  it("does not crash on missing fields, bad JSON or empty input", () => {
    for (const bad of ["", "nope", "[]", "[{}]", '[{"type":"result"}]', undefined]) {
      const parsed = parseExecution(bad);
      expect(parsed.num_turns).toBe(0);
      expect(parsed.input_tokens).toBe(0);
    }
  });
});

describe("parseTranscript", () => {
  it("sums usage once per message id and measures the duration", () => {
    const parsed = parseTranscript(transcript);
    expect(parsed).toMatchObject({
      num_turns: 2,
      input_tokens: 15,
      output_tokens: 25,
      cache_read_tokens: 30,
      cache_write_tokens: 10,
      duration_s: 660,
      started_at: "2026-10-08T10:00:00.000Z",
    });
  });

  it("returns zeros for an empty or unreadable transcript", () => {
    expect(parseTranscript("").num_turns).toBe(0);
    expect(parseTranscript(undefined).duration_s).toBe(0);
  });
});

describe("estimates", () => {
  it("maps model ids to price families", () => {
    expect(modelFamily("claude-opus-4")).toBe("opus");
    expect(modelFamily("haiku")).toBe("haiku");
    expect(modelFamily("")).toBe("sonnet");
  });

  it("computes the cost and the cache ratio", () => {
    const tokens = parseExecution(execution);
    expect(estimateCost("sonnet", tokens)).toBeCloseTo(2.06, 2);
    expect(cacheHitRatio(tokens)).toBeCloseTo(0.86, 2);
    expect(cacheHitRatio({ input_tokens: 0, cache_read_tokens: 0, cache_write_tokens: 0 })).toBe(0);
  });
});

describe("toRecord", () => {
  const context = {
    runId: "123",
    issue: 36,
    pr: 41,
    source: "action",
    labels: ["size:M", "type:feature", "area:infra", "area:api", "status:in-review"],
    gitSha: "abc",
  };

  it("fills every field from labels and usage", () => {
    const record = toRecord(parseExecution(execution), context);
    expect(Object.keys(record)).toEqual(RECORD_FIELDS);
    expect(record).toMatchObject({
      issue: 36,
      pr: 41,
      model: "sonnet",
      size: "M",
      type: "feature",
      areas: ["infra", "api"],
      outcome: "pr_opened",
      num_turns: 42,
    });
  });

  it("never contains prompt text, code or secrets", () => {
    const record = toRecord(parseExecution(execution), context);
    const fromTranscript = toRecord(parseTranscript(transcript), context);
    for (const r of [record, fromTranscript]) {
      const json = JSON.stringify(r);
      expect(json).not.toContain("SECRET");
      expect(json).not.toContain("console.log");
      expect(json).not.toContain("/home/user");
    }
  });

  it("works with nothing but defaults", () => {
    const record = toRecord({});
    expect(record.num_turns).toBe(0);
    expect(record.areas).toEqual([]);
    expect(record.outcome).toBe("failed");
  });

  it("derives the outcome", () => {
    expect(outcomeOf({ status: "success" }, { pr: 1 })).toBe("pr_opened");
    expect(outcomeOf({ status: "success" }, { pr: 1, labels: ["status:blocked"] })).toBe("blocked");
    expect(outcomeOf({ status: "error_max_turns" }, {})).toBe("timeout");
    expect(outcomeOf({ status: "failed" }, { pr: 1 })).toBe("failed");
  });
});

describe("summary", () => {
  const record = toRecord(parseExecution(execution), { issue: 36, pr: 41, labels: [], source: "action" });

  it("formats the one-line comment", () => {
    expect(summaryLine(record)).toBe(
      "🤖 Run · sonnet · 42 turns · 1.8M tokens (86% cache) · ~$2.06 est. · 23 min · PR #41",
    );
  });

  it("wraps the record in a collapsed block", () => {
    const block = prBlock(record);
    expect(block).toContain("<details><summary>Agent usage</summary>");
    expect(block).toContain('"num_turns":42');
  });
});

describe("appendToMetrics", () => {
  /**
   * Runs git in a directory.
   *
   * @param cwd Directory.
   * @returns A runner `(args, input) => output`.
   */
  const runner = (cwd) => (args, input) =>
    execFileSync("git", args, { cwd, input, encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] });

  it("creates the branch, appends, and retries after a push conflict", () => {
    const root = mkdtempSync(join(tmpdir(), "usage-"));
    const remote = join(root, "remote.git");
    const clone = join(root, "clone");
    execFileSync("git", ["init", "-q", "--bare", remote]);
    execFileSync("git", ["init", "-q", clone]);
    const git = runner(clone);
    git(["remote", "add", "origin", remote]);
    git(["config", "user.email", "t@example.com"]);
    git(["config", "user.name", "t"]);

    appendToMetrics('{"a":1}', git);
    let rejected = 0;
    const flaky = (args, input) => {
      // Another writer pushes between our fetch and our push on the first attempt.
      if (args[0] === "push" && rejected++ === 0) {
        const other = runner(clone);
        const parent = other(["rev-parse", "FETCH_HEAD"]).trim();
        const tree = other(["rev-parse", `${parent}^{tree}`]).trim();
        const sha = other(["commit-tree", tree, "-p", parent, "-m", "race"]).trim();
        other(["push", "-q", "origin", `${sha}:refs/heads/metrics`]);
      }
      return git(args, input);
    };
    appendToMetrics('{"b":2}', flaky);

    const content = execFileSync("git", ["-C", remote, "show", "metrics:agent-runs.jsonl"], {
      encoding: "utf8",
    });
    expect(content).toBe('{"a":1}\n{"b":2}\n');
    expect(rejected).toBe(2);
  });

  it("gives up after the last attempt", () => {
    const failing = (args) => {
      if (args[0] === "push") throw new Error("rejected");
      if (args[0] === "fetch") throw new Error("no branch");
      return "x";
    };
    expect(() => appendToMetrics("{}", failing, 2)).toThrow("rejected");
  });
});

describe("CLI", () => {
  it("skips quietly when the usage file is missing", () => {
    const dir = mkdtempSync(join(tmpdir(), "cli-"));
    const out = execFileSync(
      "node",
      [join(process.cwd(), "scripts/agent-usage.mjs"), "record", "--execution", join(dir, "none.json")],
      { cwd: dir, encoding: "utf8", stdio: ["pipe", "pipe", "pipe"] },
    );
    expect(out).toBe("");
  });

  it("writes .agent-usage.json from a transcript", () => {
    const dir = mkdtempSync(join(tmpdir(), "cli-"));
    writeFileSync(join(dir, "t.jsonl"), transcript);
    execFileSync(
      "node",
      [join(process.cwd(), "scripts/agent-usage.mjs"), "local", "--transcript", "t.jsonl"],
      {
        cwd: dir,
      },
    );
    expect(JSON.parse(readFileSync(join(dir, ".agent-usage.json"), "utf8")).num_turns).toBe(2);
  });
});
