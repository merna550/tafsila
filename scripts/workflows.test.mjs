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
const allWorkflows = [
  "staging.yml",
  "claude.yml",
  "dispatch.yml",
  "quality.yml",
  "docker.yml",
  "docs-links.yml",
  "agent-report.yml",
];

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

  it("passes the issue number in the /build prompt (an unquoted ' #' is a YAML comment, issue #44)", () => {
    const build = claude.jobs.claude.steps.find((s) => s.name === "Build issue (dispatcher)");
    expect(build.with.prompt).toBe("/build #${{ steps.ctx.outputs.issue }}");
  });
});

describe("claude.yml tool permissions (issue #46)", () => {
  const steps = claude.jobs.claude.steps;
  const tools = claude.jobs.claude.env.CLAUDE_TOOLS.split(",");

  it("allows the tools /build needs in headless runs", () => {
    for (const tool of ["Bash", "Edit", "Write", "Agent"]) expect(tools).toContain(tool);
    for (const id of ["build", "answer"]) {
      expect(steps.find((s) => s.id === id).with.claude_args).toContain(
        "--allowedTools ${{ env.CLAUDE_TOOLS }}",
      );
    }
  });

  it("keeps Claude's transcript as an artifact even when the job fails (issue #48)", () => {
    const keep = steps.find((s) => s.uses?.startsWith("actions/upload-artifact@"));
    expect(keep.if).toBe("always()");
    expect(keep.with.path).toContain("claude-execution-output.json");
  });

  it("fails the job when Claude was refused a tool", () => {
    const check = steps.at(-1);
    expect(check.env.EXECUTION_FILE).toContain("steps.build.outputs.execution_file");
    expect(check.run).toContain("permission_denials");
    expect(check.run).toContain("exit 1");
  });
});

describe("claude.yml model resolution", () => {
  it("resolves the model from the issue label, or from the PR's linked issue (issue #40)", () => {
    const ctx = claude.jobs.claude.steps.find((s) => s.id === "ctx");
    expect(ctx.run).toContain("node scripts/agent-model.mjs build");
    expect(ctx.run).toContain('--pr "$EVENT_PR"');
    expect(ctx.env.EVENT_PR).toContain("github.event.issue.pull_request");
  });
});

describe("dispatch.yml triggers (issue #50)", () => {
  it("starts on events that may free or add work, with a 6-hour cron as a safety net", () => {
    expect(dispatch.on.issues.types).toEqual(["labeled", "closed"]);
    expect(dispatch.on.pull_request.types).toEqual(["closed"]);
    expect(dispatch.on.schedule).toEqual([{ cron: "0 */6 * * *" }]);
    expect(dispatch.concurrency).toEqual({ group: "dispatch", "cancel-in-progress": false });
  });

  it("selects only for status labels that change what can start", () => {
    const condition = dispatch.jobs.select.if;
    for (const label of ["status:ready", "status:in-review", "status:blocked"])
      expect(condition).toContain(`"${label}"`);
    expect(condition).toContain("github.event_name != 'issues'");
    expect(condition).toContain("github.event.action == 'closed'");
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

describe("/build and /plan wait for their subagent (issue #48)", () => {
  it("start the subagent in the foreground", () => {
    for (const name of ["build", "plan"]) {
      const text = readFileSync(new URL(`../.claude/commands/${name}.md`, import.meta.url), "utf8");
      expect(text).toContain("`run_in_background: false`");
    }
  });
});

describe("setup-node caching", () => {
  it("is turned off in jobs that do not install pnpm first (issue #42)", () => {
    for (const name of allWorkflows) {
      for (const job of Object.values(workflow(name).jobs)) {
        const steps = job.steps ?? [];
        const node = steps.findIndex((s) => s.uses?.startsWith("actions/setup-node@"));
        if (node < 0) continue;
        const pnpmFirst = steps.slice(0, node).some((s) => s.uses?.startsWith("pnpm/action-setup@"));
        if (!pnpmFirst) expect(steps[node].with?.["package-manager-cache"], `${name}`).toBe(false);
      }
    }
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

describe("staging.yml (issue #19)", () => {
  const staging = workflow("staging.yml");
  const steps = Object.values(staging.jobs).flatMap((job) => job.steps);

  it("runs migrate, then deploy, then smoke, one run at a time", () => {
    expect(staging.jobs.deploy.needs).toBe("migrate");
    expect(staging.jobs.smoke.needs).toBe("deploy");
    expect(staging.concurrency["cancel-in-progress"]).toBe(false);
  });

  it("starts on every push to main", () => {
    expect(staging.on.push.branches).toEqual(["main"]);
  });

  it("never pushes the seed and never writes a secret inside a run line", () => {
    for (const step of steps) {
      expect(step.run ?? "").not.toContain("--include-seed");
      expect(step.run ?? "").not.toContain("secrets.");
    }
  });

  it("adds [remotes.staging] at runtime, before config push, and not in git", () => {
    const run = staging.jobs.migrate.steps.map((s) => s.run ?? "");
    const append = run.findIndex((r) => r.includes("[remotes.staging]"));
    const push = run.findIndex((r) => r.includes("supabase config push"));
    expect(append).toBeGreaterThan(-1);
    expect(append).toBeLessThan(push);
    expect(run[append]).toContain("$SUPABASE_PROJECT_REF_STAGING");
    expect(readFileSync("supabase/config.toml", "utf8")).not.toContain("[remotes.staging]");
  });

  it("checks the merged commit on the staging environment", () => {
    const smoke = staging.jobs.smoke.steps.at(-1).run;
    expect(smoke).toContain('"$GITHUB_SHA" staging');
  });
});

describe("agent settings deny production commands (issue #58)", () => {
  const settings = JSON.parse(readFileSync(new URL("../.claude/settings.json", import.meta.url), "utf8"));
  const deny = settings.permissions.deny;

  it.each([
    "Bash(gh workflow run deploy*)",
    "Bash(gh workflow run *production*)",
    "Bash(gh release create*)",
    "Bash(*vercel*--prod*)",
    "Bash(*vercel*promote*)",
    "Bash(*vercel*rollback*)",
  ])("denies %s", (rule) => {
    expect(deny).toContain(rule);
  });
});

describe("agent usage metrics (issue #36)", () => {
  const record = claude.jobs.claude.steps.find((s) => s.name === "Record agent usage");
  const report = workflow("agent-report.yml");

  it("records usage after every run without failing the job", () => {
    expect(record.if).toBe("always()");
    expect(record["continue-on-error"]).toBe(true);
    expect(record.run).toContain("agent-usage.mjs append");
  });

  it("runs the weekly report on Sundays and by hand with issue-write access only", () => {
    expect(report.on.schedule[0].cron).toMatch(/ \* \* 0$/);
    expect(report.on).toHaveProperty("workflow_dispatch");
    expect(report.permissions).toEqual({ contents: "read", issues: "write" });
  });
});
