import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import {
  baseVerdict,
  block,
  createFakeClient,
  doctorProblems,
  fixBody,
  gate,
  gateVerdict,
  merge,
  orderQueue,
  preflightVerdict,
  REQUIRED_CHECKS,
  sameCause,
  start,
  summary,
  summaryLine,
} from "./deliver.mjs";

const fixture = (name) => JSON.parse(readFileSync(`scripts/fixtures/deliver/${name}.json`, "utf8"));
const timers = { sleep: async () => {}, now: () => 0 };
const issue = (number, labels, extra = {}) => ({ number, state: "open", labels, body: "", ...extra });
const ready = ["status:ready", "build:sonnet"];

describe("preflightVerdict", () => {
  it("builds a ready issue with the model of its label", () => {
    expect(preflightVerdict(issue(1, ready), [])).toMatchObject({ action: "build", agent: "builder-sonnet" });
  });

  it.each([
    [["status:plan-review"], "not status:ready (status:plan-review)"],
    [[...ready, "needs:decision"], "needs:decision is open"],
    [[...ready, "agent:auto"], "owned by the dispatcher (agent:auto)"],
    [["status:in-progress"], "already being built by another session"],
  ])("refuses %j", (labels, reason) => {
    expect(preflightVerdict(issue(1, labels), [])).toMatchObject({ action: "refuse", reason });
  });

  it("refuses a closed issue", () => {
    expect(preflightVerdict(issue(1, ready, { state: "closed" }), []).reason).toBe("closed");
  });

  it("resumes with an own open PR, but not when blocked", () => {
    const prs = [{ number: 9, body: "Closes #1" }];
    expect(preflightVerdict(issue(1, ["status:in-progress"]), prs).action).toBe("resume");
    expect(preflightVerdict(issue(1, ["status:blocked"]), prs).action).toBe("refuse");
  });
});

describe("orderQueue", () => {
  const entry = (number, body = "", labels = ["priority:P2"]) => ({ number, body, labels, action: "build" });

  it("puts a dependency first", () => {
    const ordered = orderQueue([entry(3, "Depends on #2"), entry(2)], new Set());
    expect(ordered.map((e) => e.number)).toEqual([2, 3]);
  });

  it("refuses an open dependency outside the queue", () => {
    const [first] = orderQueue([entry(3, "Depends on #9")], new Set());
    expect(first).toMatchObject({ action: "refuse", reason: "depends on #9 (open)" });
  });

  it("accepts a closed dependency and orders by priority", () => {
    const ordered = orderQueue([entry(5, "Depends on #9"), entry(6, "", ["priority:P0"])], new Set([9]));
    expect(ordered.map((e) => e.number)).toEqual([6, 5]);
  });
});

const base = () => {
  const s = fixture("green").routes;
  const names = REQUIRED_CHECKS.map((name, i) => ({
    id: i,
    name,
    status: "completed",
    conclusion: "success",
  }));
  return {
    issue: issue(185, ["status:in-progress"]),
    pr: s["repos/o/r/pulls/210"],
    checks: names,
    statuses: [],
    criteria: { met: 1, total: 1 },
  };
};
const verdictOf = (patch) => gateVerdict({ ...base(), ...patch }).verdict;
const withPr = (patch) => ({ pr: { ...base().pr, ...patch } });
const withCheck = (name, patch) => ({
  checks: base().checks.map((c) => (c.name === name ? { ...c, ...patch } : c)),
});

describe("gateVerdict", () => {
  it("row 1 to 5: refuses and fixes the PR itself", () => {
    expect(verdictOf(withPr({ state: "closed" }))).toBe("refuse");
    expect(verdictOf(withPr({ base: { ref: "develop" } }))).toBe("refuse");
    expect(verdictOf({ issue: issue(185, ["needs:decision"]) })).toBe("refuse");
    expect(verdictOf(withPr({ body: "Part of #185" }))).toBe("fix-body");
    expect(verdictOf(withPr({ draft: true }))).toBe("draft");
  });

  it("row 6: waits for pending, missing, unknown", () => {
    expect(verdictOf(withCheck("e2e", { status: "in_progress" }))).toBe("wait");
    expect(verdictOf({ checks: base().checks.filter((c) => c.name !== "db-reset") })).toBe("wait");
    expect(verdictOf({ statuses: [{ context: "Vercel", state: "pending" }] })).toBe("wait");
    expect(verdictOf(withPr({ mergeable: null }))).toBe("wait");
  });

  it("row 7: red check or Vercel failure means fix", () => {
    expect(gateVerdict({ ...base(), ...withCheck("e2e", { conclusion: "failure" }) }).failed).toEqual([
      { name: "e2e" },
    ]);
    expect(gateVerdict({ ...base(), statuses: [{ context: "Vercel", state: "failure" }] })).toMatchObject({
      verdict: "fix",
      failed: [{ name: "Vercel" }],
    });
  });

  it("rows 8 and 9: conflict and protection", () => {
    expect(verdictOf(withPr({ mergeable_state: "dirty" }))).toBe("conflict");
    expect(verdictOf(withPr({ mergeable_state: "blocked" }))).toBe("wait");
  });

  it("row 10: unticked criteria need an explanation", () => {
    const criteria = { met: 1, total: 2 };
    expect(verdictOf({ criteria })).toBe("refuse");
    expect(
      verdictOf({ criteria, ...withPr({ body: "Closes #185\n\n## Unticked criteria\n- 2: later" }) }),
    ).toBe("merge");
  });

  it("row 11: needs:interactive asks Merna, unless confirmed", () => {
    const interactive = issue(185, ["needs:interactive"]);
    expect(verdictOf({ issue: interactive })).toBe("confirm");
    expect(verdictOf({ issue: interactive, confirmed: true })).toBe("merge");
  });

  it("row 12: merges when clean, behind, unstable or all required checks are skipped", () => {
    expect(verdictOf({})).toBe("merge");
    expect(verdictOf(withPr({ mergeable_state: "behind" }))).toBe("merge");
    expect(verdictOf(withPr({ mergeable_state: "unstable" }))).toBe("merge");
    const skipped = base().checks.map((c) => ({ ...c, conclusion: "skipped" }));
    expect(verdictOf({ checks: skipped })).toBe("merge");
    const twice = [...base().checks, { id: 99, name: "build", status: "completed", conclusion: "skipped" }];
    expect(verdictOf({ checks: twice })).toBe("merge");
  });
});

describe("sameCause", () => {
  it("compares check name and first failure line", () => {
    const a = [{ name: "e2e", line: "x" }];
    expect(sameCause(a, [{ name: "e2e", line: "x" }])).toBe(true);
    expect(sameCause(a, [{ name: "e2e", line: "y" }])).toBe(false);
    expect(sameCause(a, [{ name: "quality", line: "x" }])).toBe(false);
  });
});

describe("baseVerdict", () => {
  const ok = REQUIRED_CHECKS.map((name) => ({ name, status: "completed", conclusion: "success" }));

  it("is green, pending or red", () => {
    expect(baseVerdict(ok, null).state).toBe("green");
    expect(baseVerdict([{ name: "quality", status: "queued" }], null).state).toBe("pending");
    expect(baseVerdict([{ name: "quality", status: "completed", conclusion: "failure" }], null)).toEqual({
      state: "red",
      names: ["quality"],
    });
    expect(baseVerdict(ok, { status: "completed", conclusion: "failure" }).names).toEqual(["Staging"]);
  });
});

describe("doctorProblems and summary", () => {
  it("lists problems", () => {
    expect(doctorProblems({ ghOk: true, repoOk: true, dirty: false, branch: "feat/x" })).toEqual([]);
    expect(doctorProblems({ ghOk: true, repoOk: true, dirty: true, branch: "main" })).toHaveLength(2);
  });

  it("formats the Arabic lines", () => {
    expect(summaryLine({ kind: "merged", issue: 185, pr: 210, sha: "a1b2c3d" })).toBe(
      "#185: PR #210، CI أخضر، دُمج (a1b2c3d)، والـ issue مغلقة.",
    );
    expect(summaryLine({ kind: "blocked", issue: 186, pr: 211, reason: "CI أحمر مرتين (e2e)" })).toBe(
      "#186: PR #211، CI أحمر مرتين (e2e)، لم يُدمج: status:blocked.",
    );
    expect(
      summaryLine({ kind: "refused", issue: 190, reason: "ليست status:ready (status:plan-review)" }),
    ).toBe("#190: رُفضت: ليست status:ready (status:plan-review).");
    const lines = summary([
      { kind: "merged", issue: 1, pr: 2, sha: "abc" },
      { kind: "refused", issue: 3, reason: "x" },
    ]);
    expect(lines.split("\n")[0]).toBe("/deliver: دُمجت 1 من 2.");
  });
});

describe("fake client flows", () => {
  it("merges the green fixture with exactly one pinned PUT", async () => {
    const client = createFakeClient(fixture("green"));
    const result = await merge(client, 185, 210, timers);
    const puts = client.writes.filter((w) => w.method === "PUT");
    expect(puts).toHaveLength(1);
    expect(puts[0].body).toMatchObject({ merge_method: "squash", sha: "abc1234def" });
    expect(result).toMatchObject({ merged: true, sha: "1a2b3c4" });
    expect(client.writes.map((w) => w.method)).toEqual(["PUT", "POST", "PATCH", "DELETE"]);
  });

  it("does not retry when the head moved (409)", async () => {
    const client = createFakeClient(fixture("head-moved"));
    const result = await merge(client, 185, 210, timers);
    expect(result.merged).toBe(false);
    expect(client.writes).toHaveLength(1);
  });

  it("does not merge when the gate says no", async () => {
    for (const name of ["red-twice", "conflict", "missing-closes"]) {
      const client = createFakeClient(fixture(name));
      expect((await merge(client, 185, 210, timers)).merged).toBe(false);
      expect(client.writes).toHaveLength(0);
    }
  });

  it("reports fix with the first failure line", async () => {
    const result = await gate(createFakeClient(fixture("red-twice")), 185, 210, { wait: false, ...timers });
    expect(result).toMatchObject({
      verdict: "fix",
      failed: [{ name: "e2e", line: "AssertionError: expected 1 to be 2" }],
    });
  });

  it("start swaps ready for in-progress and nothing else", () => {
    const client = createFakeClient({
      routes: { "repos/o/r/issues/7": { labels: [{ name: "status:ready" }, { name: "agent:x" }] } },
    });
    start(client, 7);
    expect(client.writes.map((w) => `${w.method} ${w.path}`)).toEqual([
      "POST repos/o/r/issues/7/labels",
      "DELETE repos/o/r/issues/7/labels/status%3Aready",
    ]);
    expect(client.writes[0].body).toEqual({ labels: ["status:in-progress"] });
  });

  it("block keeps needs labels and sets only status:blocked", () => {
    const client = createFakeClient({
      routes: {
        "repos/o/r/issues/7": { labels: [{ name: "status:in-progress" }, { name: "needs:interactive" }] },
      },
    });
    block(client, 7, "e2e: boom");
    expect(client.writes[1].body).toEqual({ labels: ["needs:interactive", "status:blocked"] });
  });

  it("fix-body adds Closes only when missing", () => {
    const missing = createFakeClient(fixture("missing-closes"));
    expect(fixBody(missing, 185, 210).changed).toBe(true);
    expect(missing.writes[0].body.body.startsWith("Closes #185\n")).toBe(true);
    const fine = createFakeClient(fixture("green"));
    expect(fixBody(fine, 185, 210).changed).toBe(false);
  });
});

describe("CLI", () => {
  const cli = (...args) =>
    spawnSync(process.execPath, ["scripts/deliver.mjs", ...args], { encoding: "utf8" });

  it("prints the verdict as one JSON line", () => {
    const r = cli("gate", "185", "--pr", "210", "--fixture", "scripts/fixtures/deliver/red-twice.json");
    expect(r.status).toBe(0);
    expect(JSON.parse(r.stdout).verdict).toBe("fix");
  });

  it("prints would: lines and writes nothing in dry-run", () => {
    const r = cli(
      "fix-body",
      "185",
      "--pr",
      "210",
      "--fixture",
      "scripts/fixtures/deliver/missing-closes.json",
    );
    expect(r.stdout).toContain("would: PATCH repos/o/r/pulls/210");
  });

  it("exits 2 with usage on an unknown command", () => {
    const r = cli("bogus");
    expect(r.status).toBe(2);
    expect(r.stderr).toContain("usage:");
  });

  it("stops when main is red (fixture)", () => {
    const r = cli("base", "--fixture", "scripts/fixtures/deliver/main-red.json");
    expect(JSON.parse(r.stdout)).toMatchObject({ state: "red", names: ["quality"] });
  });
});
