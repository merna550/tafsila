// Tests for scripts/agent-model.mjs: label → model/subagent and PR → linked issue (issue #40).
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { resolveModel, linkedIssue, parseArgs } from "./agent-model.mjs";

describe("resolveModel", () => {
  it("maps build:* labels to the matching builder subagent", () => {
    for (const model of ["haiku", "sonnet", "opus"]) {
      expect(resolveModel("build", ["type:bug", `build:${model}`])).toEqual({
        model,
        agent: `builder-${model}`,
        note: "",
      });
    }
  });

  it("maps plan:* labels to the matching planner subagent", () => {
    expect(resolveModel("plan", ["plan:opus"]).agent).toBe("planner-opus");
    expect(resolveModel("plan", ["plan:sonnet"]).agent).toBe("planner-sonnet");
  });

  it("skips planning for plan:none", () => {
    expect(resolveModel("plan", ["plan:none"])).toMatchObject({ model: "none", agent: null });
  });

  it("falls back to sonnet and says so when the label is missing or unknown", () => {
    expect(resolveModel("build", ["type:bug"])).toEqual({
      model: "sonnet",
      agent: "builder-sonnet",
      note: "No build:* label on the issue; using sonnet.",
    });
    expect(resolveModel("plan", ["plan:haiku"]).note).toBe("Unknown label plan:haiku; using sonnet.");
  });
});

describe("linkedIssue", () => {
  it("prefers GitHub's closing references", () => {
    expect(linkedIssue({ body: "Closes #3", closingIssuesReferences: [{ number: 7 }] })).toBe(7);
  });

  it("falls back to a closing keyword in the body", () => {
    expect(linkedIssue({ body: "Some text\nFixes #12", closingIssuesReferences: [] })).toBe(12);
    expect(linkedIssue({ body: "resolved #5" })).toBe(5);
  });

  it("returns null when the PR links no issue", () => {
    expect(linkedIssue({ body: "See #4 for context", closingIssuesReferences: [] })).toBeNull();
  });
});

describe("parseArgs", () => {
  it("reads the step, the number, --pr and --model", () => {
    expect(parseArgs(["build", "18"])).toEqual({
      step: "build",
      number: "18",
      isPr: false,
      override: undefined,
    });
    expect(parseArgs(["build", "--pr", "39", "--model", "opus"])).toEqual({
      step: "build",
      number: "39",
      isPr: true,
      override: "opus",
    });
  });

  it("rejects an unknown step", () => {
    expect(() => parseArgs(["ship", "1"])).toThrow(/Unknown step/);
  });
});

describe("subagent files", () => {
  const turns = {
    "builder-haiku": 50,
    "builder-sonnet": 80,
    "builder-opus": 120,
    "planner-sonnet": 50,
    "planner-opus": 50,
  };
  const agents = Object.keys(turns);

  it("exist for every model the resolver can return, with that model and a turn cap", () => {
    for (const name of agents) {
      const text = readFileSync(new URL(`../.claude/agents/${name}.md`, import.meta.url), "utf8");
      expect(text).toContain(`name: ${name}\n`);
      expect(text).toContain(`model: ${name.split("-")[1]}\n`);
      expect(text).toContain(`maxTurns: ${turns[name]}\n`);
    }
  });
});
