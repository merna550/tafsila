import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { createFakeClient } from "./deliver-client.mjs";
import { issueOf, planPrLink, runPrLink } from "./pr-link.mjs";

const event = (name) =>
  JSON.parse(readFileSync(`scripts/fixtures/pr-link/${name}.event.json`, "utf8")).pull_request;
const pr = (extra = {}) => ({
  number: 5,
  title: "chore: x",
  body: "",
  labels: [],
  head: { ref: "chore/186-x" },
  base: { ref: "main" },
  ...extra,
});

describe("issueOf", () => {
  it("reads the branch name first, then a (#N) title suffix", () => {
    expect(issueOf(pr())).toBe(186);
    expect(issueOf(pr({ head: { ref: "claude/lucid" }, title: "feat: y (#42)" }))).toBe(42);
    expect(issueOf(pr({ head: { ref: "claude/lucid" } }))).toBeNull();
  });
});

describe("planPrLink", () => {
  it("adds Closes #N as the first line when no closing keyword exists", () => {
    const plan = planPrLink(pr({ body: "What changed" }));
    expect(plan.actions).toEqual([{ type: "set-body", body: "Closes #186\n\nWhat changed" }]);
    expect(plan.failure).toBeNull();
  });

  it("adds Closes #N to an empty body", () => {
    expect(planPrLink(pr()).actions).toEqual([{ type: "set-body", body: "Closes #186" }]);
  });

  it("comments and labels a PR that only says Part of #N", () => {
    const plan = planPrLink(pr({ body: "Part of #186" }));
    expect(plan.actions.map((a) => a.type)).toEqual(["comment", "label"]);
    expect(plan.actions[1].name).toBe("needs:link");
  });

  it("does not repeat the note when needs:link is already set", () => {
    expect(planPrLink(pr({ body: "Part of #186", labels: ["needs:link"] })).actions).toEqual([]);
  });

  it("removes needs:link once the body closes the issue and changes nothing else", () => {
    const plan = planPrLink(pr({ body: "Closes #186", labels: [{ name: "needs:link" }] }));
    expect(plan.actions).toEqual([{ type: "unlabel", name: "needs:link" }]);
  });

  it("leaves a body that closes another issue alone", () => {
    const plan = planPrLink(pr({ body: "Fixes #12" }));
    expect(plan.actions).toEqual([]);
    expect(plan.notice).toContain("another issue");
  });

  it("passes with a notice when no issue is named", () => {
    const plan = planPrLink(pr({ head: { ref: "dependabot/npm" } }));
    expect(plan).toMatchObject({ issue: null, failure: null, actions: [] });
    expect(plan.notice).toBeTruthy();
  });

  it("fails when the base is not main, unless the PR is labelled stacked", () => {
    const stacked = pr({ body: "Closes #186", base: { ref: "feat/x" } });
    expect(planPrLink(stacked).failure).toContain("base must be main");
    expect(planPrLink({ ...stacked, labels: ["stacked"] }).failure).toBeNull();
  });
});

describe("runPrLink with fixtures", () => {
  it("rewrites the body of a PR without a keyword with one PATCH", () => {
    const client = createFakeClient({ routes: {} });
    const result = runPrLink(client, event("no-keyword"));
    expect(result.exitCode).toBe(0);
    expect(client.writes).toEqual([
      { method: "PATCH", path: "repos/o/r/pulls/7", body: { body: "Closes #186\n\nWhat changed" } },
    ]);
  });

  it("comments and labels the Part of PR", () => {
    const client = createFakeClient({ routes: {} });
    runPrLink(client, event("part-of"));
    expect(client.writes.map((w) => `${w.method} ${w.path}`)).toEqual([
      "POST repos/o/r/issues/8/comments",
      "POST repos/o/r/issues/8/labels",
    ]);
  });

  it("fails a PR whose base is a branch, without writing", () => {
    const client = createFakeClient({ routes: {} });
    const result = runPrLink(client, event("stacked-base"));
    expect(result.exitCode).toBe(1);
    expect(result.lines.join("\n")).toContain("base must be main");
    expect(client.writes).toEqual([]);
  });

  it("does not write on a fork", () => {
    const client = createFakeClient({ routes: {} });
    const fork = { ...event("no-keyword"), head: { ref: "chore/186-x", repo: { full_name: "someone/r" } } };
    fork.base = { ref: "main", repo: { full_name: "o/r" } };
    expect(runPrLink(client, fork).exitCode).toBe(0);
    expect(client.writes).toEqual([]);
  });
});

describe("CLI", () => {
  const run = (name) =>
    spawnSync(
      process.execPath,
      [
        "scripts/pr-link.mjs",
        "--event",
        `scripts/fixtures/pr-link/${name}.event.json`,
        "--fixture",
        "scripts/fixtures/pr-link/empty.fixture.json",
      ],
      { encoding: "utf8" },
    );

  it("exits 1 with an error annotation for a wrong base", () => {
    const out = run("stacked-base");
    expect(out.status).toBe(1);
    expect(out.stdout).toContain("::error::");
  });

  it("exits 0 for the ordinary cases", () => {
    for (const name of ["no-keyword", "part-of", "linked"]) expect(run(name).status).toBe(0);
  });
});
