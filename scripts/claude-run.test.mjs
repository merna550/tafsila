// Tests for scripts/claude-run.mjs: failure reason, refused commands and the block label change (issue #58).
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  blockLabels,
  failureComment,
  failureReason,
  readExecution,
  refusals,
  sanitizeInput,
} from "./claude-run.mjs";

/**
 * Builds an execution message list ending with one result message.
 *
 * @param result Fields of the result message.
 * @returns Messages in the shape claude-code-action writes.
 */
const run = (result) => [
  { type: "system", subtype: "init" },
  { type: "result", ...result },
];

const refused = run({
  subtype: "success",
  is_error: false,
  num_turns: 3,
  permission_denials: [
    { tool_name: "Bash", tool_input: { command: "jq '.permissions' .claude/settings.json > /tmp/s.json" } },
    { tool_name: "Edit", tool_input: { file_path: ".claude/settings.json" } },
    { tool_name: "WebFetch", tool_input: {} },
  ],
});

describe("readExecution", () => {
  it("returns null for a missing, invalid or non-list file", () => {
    const dir = mkdtempSync(join(tmpdir(), "claude-run-"));
    writeFileSync(join(dir, "bad.json"), "{not json");
    writeFileSync(join(dir, "object.json"), "{}");
    writeFileSync(join(dir, "ok.json"), JSON.stringify(refused));
    expect(readExecution(undefined)).toBeNull();
    expect(readExecution(join(dir, "missing.json"))).toBeNull();
    expect(readExecution(join(dir, "bad.json"))).toBeNull();
    expect(readExecution(join(dir, "object.json"))).toBeNull();
    expect(readExecution(join(dir, "ok.json"))).toHaveLength(2);
  });
});

describe("refusals", () => {
  it("lists each refused tool with its command or file path", () => {
    expect(refusals(refused)).toEqual([
      { tool: "Bash", input: "jq '.permissions' .claude/settings.json > /tmp/s.json" },
      { tool: "Edit", input: ".claude/settings.json" },
      { tool: "WebFetch", input: "" },
    ]);
  });

  it("is empty without a result or without denials", () => {
    expect(refusals(null)).toEqual([]);
    expect(refusals(run({ subtype: "success" }))).toEqual([]);
  });
});

describe("sanitizeInput", () => {
  it("redacts token-shaped values and shortens long commands", () => {
    const token = `ghp_${"a".repeat(36)}`;
    expect(sanitizeInput(`curl -H "Authorization: ${token}" x`)).toBe(
      'curl -H "Authorization: [redacted]" x',
    );
    expect(sanitizeInput(`echo github_pat_${"B1_".repeat(10)}`)).toBe("echo [redacted]");
    expect(sanitizeInput(`key sk-ant-${"x-".repeat(15)}`)).toBe("key [redacted]");
    const long = sanitizeInput("x".repeat(500));
    expect(long).toHaveLength(201);
    expect(long.endsWith("…")).toBe(true);
    expect(sanitizeInput("a\n  b")).toBe("a b");
  });
});

describe("failureReason", () => {
  it("explains each kind of failure", () => {
    expect(failureReason(null)).toContain("no result");
    expect(failureReason(refused)).toBe("Claude was refused 3 tool call(s) after 3 turn(s).");
    expect(failureReason(run({ subtype: "error_max_turns", num_turns: 50 }))).toContain("turn limit (50");
    expect(failureReason(run({ subtype: "error_during_execution", is_error: true }))).toContain(
      "error_during_execution",
    );
    expect(failureReason(run({ subtype: "success", is_error: false }))).toContain("later step");
  });
});

describe("failureComment", () => {
  it("states the reason, the run link, the refused commands and how to unblock", () => {
    const body = failureComment(refused, "https://github.com/o/r/actions/runs/1");
    expect(body).toContain("Dispatcher build failed: Claude was refused 3 tool call(s)");
    expect(body).toContain("https://github.com/o/r/actions/runs/1");
    expect(body).toContain("- Bash: `jq '.permissions' .claude/settings.json > /tmp/s.json`");
    expect(body).toContain("- WebFetch: `(no input)`");
    expect(body).toContain("`status:blocked`");
    expect(body).toContain("`needs:interactive`");
  });

  it("has no refused list when nothing was refused", () => {
    expect(failureComment(null, "u")).not.toContain("Refused tool calls");
  });
});

describe("blockLabels", () => {
  it("removes every status that lets the issue be picked again and adds status:blocked", () => {
    expect(blockLabels(["status:ready", "status:in-progress", "priority:P1"])).toEqual({
      remove: ["status:ready", "status:in-progress"],
      add: ["status:blocked"],
    });
    expect(blockLabels(["status:changes-requested"]).remove).toEqual(["status:changes-requested"]);
  });

  it("does nothing more for an issue the build already blocked", () => {
    expect(blockLabels(["status:blocked", "type:chore"])).toEqual({ remove: [], add: [] });
  });
});
