// Tests for the PR CI waiter and its deliberately small failure output (issue #178).
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { classifyChecks, extractFailureLines, stripAnsi, waitForCi } from "./ci-wait.mjs";

const fixture = readFileSync(new URL("./fixtures/ci-failure.log.txt", import.meta.url), "utf8");
const green = { id: 1, name: "Quality", status: "completed", conclusion: "success" };
const red = { id: 2, name: "Tests", status: "completed", conclusion: "failure" };

describe("extractFailureLines", () => {
  it("strips ANSI and selects Vitest, assertion, TypeScript and threshold failures", () => {
    const lines = extractFailureLines(fixture);
    expect(lines).toEqual([
      " FAIL  scripts/example.test.mjs > example",
      "AssertionError: expected 1 to be 2",
      "src/example.ts(4,2): error TS2322: Type 'number' is not assignable to type 'string'.",
      "✘ one browser test failed",
      "× another test failed",
      "ERROR: Coverage for lines (79%) does not meet global threshold (80%)",
    ]);
    expect(lines.join("\n")).not.toContain("\u001b");
    expect(stripAnsi(fixture)).not.toContain("\u001b");
  });

  it("returns at most forty failure lines", () => {
    const longLog = Array.from({ length: 45 }, (_, index) => `FAIL test ${index + 1}`).join("\n");
    expect(extractFailureLines(longLog)).toHaveLength(40);
  });
});

describe("waitForCi", () => {
  it("returns zero after pending checks become green", async () => {
    const snapshots = [
      { mergeableState: "unknown", checks: [{ ...green, status: "in_progress", conclusion: null }] },
      { mergeableState: "clean", checks: [green] },
    ];
    const lines = [];
    const code = await waitForCi({
      snapshot: async () => snapshots.shift(),
      readLog: async () => "",
      sleep: async () => {},
      writeLine: (line) => lines.push(line),
    });
    expect(code).toBe(0);
    expect(lines).toContain("mergeable_state: clean");
    expect(lines).toContain("check pending: Quality (in_progress)");
  });

  it("returns one and prints only filtered lines for a red job", async () => {
    const lines = [];
    const code = await waitForCi({
      snapshot: async () => ({ mergeableState: "dirty", checks: [red] }),
      readLog: async () => fixture,
      writeLine: (line) => lines.push(line),
    });
    expect(code).toBe(1);
    expect(lines).toContain("mergeable_state: dirty");
    expect(lines).toContain("check failed: Tests (failure)");
    expect(lines.filter((line) => line.startsWith("failure log: Tests:"))).toHaveLength(6);
    expect(lines.join("\n")).not.toContain("ordinary setup output");
  });

  it("returns two when no checks appear before the timeout", async () => {
    const times = [0, 0, 25];
    const lines = [];
    const code = await waitForCi({
      snapshot: async () => ({ mergeableState: "unknown", checks: [] }),
      readLog: async () => "",
      sleep: async () => {},
      now: () => times.shift(),
      timeoutMs: 20,
      pollMs: 20,
      writeLine: (line) => lines.push(line),
    });
    expect(code).toBe(2);
    expect(lines).toContain("check pending: no checks found");
  });
});

describe("classifyChecks", () => {
  const run = (name, status, conclusion) => ({ name, status, conclusion });

  it("is pending without checks or while one runs", () => {
    expect(classifyChecks([]).state).toBe("pending");
    expect(classifyChecks([run("a", "in_progress", null)]).state).toBe("pending");
  });

  it("is green for success, neutral and skipped", () => {
    const checks = [run("a", "completed", "success"), run("b", "completed", "skipped")];
    expect(classifyChecks(checks)).toEqual({ state: "green", failed: [] });
  });

  it("is red and lists the failed runs", () => {
    const bad = run("b", "completed", "failure");
    expect(classifyChecks([run("a", "completed", "success"), bad])).toEqual({ state: "red", failed: [bad] });
  });
});
