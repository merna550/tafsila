// Tests for scripts/hooks/read-hook-input.mjs: reading one field from Claude Code hook input.
import { describe, expect, it } from "vitest";
import { pick } from "./read-hook-input.mjs";

describe("pick", () => {
  it("follows a dotted path", () => {
    expect(pick({ tool_input: { file_path: "a.ts" } }, "tool_input.file_path")).toBe("a.ts");
    expect(pick({ stop_hook_active: true }, "stop_hook_active")).toBe(true);
  });

  it("returns undefined when a step is missing", () => {
    expect(pick({}, "tool_input.file_path")).toBeUndefined();
    expect(pick({ tool_input: null }, "tool_input.file_path")).toBeUndefined();
  });
});
