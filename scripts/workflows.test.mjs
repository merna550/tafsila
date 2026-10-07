// Tests for the agent workflows (issue #38): guards the job conditions that let the dispatcher reach Claude.
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { parse } from "yaml";

/**
 * Reads and parses a workflow file from .github/workflows.
 *
 * @param name Workflow file name.
 * @returns Parsed workflow.
 */
const workflow = (name) =>
  parse(readFileSync(new URL(`../.github/workflows/${name}`, import.meta.url), "utf8"));

const claude = workflow("claude.yml");
const dispatch = workflow("dispatch.yml");
const allWorkflows = ["claude.yml", "dispatch.yml", "quality.yml", "docker.yml", "docs-links.yml"];

describe("claude.yml", () => {
  it("never tests github.event_name for workflow_call (it holds the caller's event)", () => {
    const conditions = [claude.jobs.claude.if, ...claude.jobs.claude.steps.map((s) => s.if ?? "")];
    for (const condition of conditions) expect(condition).not.toContain("workflow_call");
  });

  it("lets a dispatcher call run the job and the build step", () => {
    expect(claude.jobs.claude.if).toContain("inputs.issue != ''");
    const build = claude.jobs.claude.steps.find((s) => s.name === "Build issue (dispatcher)");
    expect(build.if).toBe("inputs.issue != ''");
  });
});

describe("dispatch.yml", () => {
  it("maps the pick step outputs to the select job outputs", () => {
    expect(dispatch.jobs.select.outputs).toEqual({
      issue: "${{ steps.pick.outputs.issue }}",
      model: "${{ steps.pick.outputs.model }}",
    });
  });

  it("offers a dry run that skips the build and prints the pick", () => {
    expect(dispatch.on.workflow_dispatch.inputs.dry_run.type).toBe("boolean");
    expect(dispatch.jobs.build.if).toContain("!inputs.dry_run");
    expect(dispatch.jobs["dry-run"].if).toBe("inputs.dry_run");
    expect(dispatch.jobs["dry-run"].steps[0].env).toMatchObject({
      ISSUE: "${{ needs.select.outputs.issue }}",
      MODEL: "${{ needs.select.outputs.model }}",
    });
  });
});

describe("action versions", () => {
  it("uses checkout and setup-node majors that run on Node 24", () => {
    for (const name of allWorkflows) {
      const text = readFileSync(new URL(`../.github/workflows/${name}`, import.meta.url), "utf8");
      expect(text).not.toMatch(/actions\/(checkout|setup-node)@v[1-4]\b/);
    }
  });
});
