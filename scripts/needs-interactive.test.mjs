// Tests for scripts/needs-interactive.mjs: which touched paths require an interactive build (issue #58).
import { describe, expect, it } from "vitest";
import { needsInteractive } from "./needs-interactive.mjs";

describe("needsInteractive", () => {
  it("is true for Claude settings, agents, commands and hooks", () => {
    expect(needsInteractive([".claude/settings.json"])).toBe(true);
    expect(needsInteractive(["docs/WORKFLOW.md", ".claude/agents/builder-sonnet.md"])).toBe(true);
    expect(needsInteractive(["./.claude/commands/plan.md"])).toBe(true);
    expect(needsInteractive(["scripts/hooks/verify-affected.sh"])).toBe(true);
    expect(needsInteractive([".claude"])).toBe(true);
  });

  it("is false for application code, docs and look-alike paths", () => {
    expect(needsInteractive([])).toBe(false);
    expect(needsInteractive(["packages/api/src/app.ts", "docs/handbook/tech/claude-code.md"])).toBe(false);
    expect(needsInteractive(["CLAUDE.md", "apps/web/CLAUDE.md", "docs/.claude-notes.md"])).toBe(false);
    expect(needsInteractive(["scripts/dispatch.mjs"])).toBe(false);
  });
});
