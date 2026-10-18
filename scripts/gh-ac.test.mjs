// Tests for gh-ac.sh with GraphQL blocked: the REST path runs against a recorded issue body (issue #183).
import { execFileSync, spawnSync } from "node:child_process";
import { chmodSync, mkdtempSync, readFileSync, symlinkSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { columnFor } from "./board-column.mjs";

const fixtures = new URL("./fixtures/gh-rest/", import.meta.url).pathname;
const script = new URL("./gh-ac.sh", import.meta.url).pathname;

/**
 * Runs gh-ac.sh with a fake `gh` first on PATH.
 *
 * @param args CLI arguments.
 * @returns Output text and the body that was PATCHed.
 */
function run(...args) {
  const dir = mkdtempSync(join(tmpdir(), "gh-ac-"));
  symlinkSync(join(fixtures, "fake-gh.sh"), join(dir, "gh"));
  chmodSync(join(fixtures, "fake-gh.sh"), 0o755);
  const out = join(dir, "patched.md");
  const env = { ...process.env, PATH: `${dir}:${process.env.PATH}`, FAKE_GH_OUT: out };
  // eslint-disable-next-line sonarjs/no-os-command-from-path -- test-only PATH with a fake gh
  const result = spawnSync("bash", [script, ...args], { env, encoding: "utf8" });
  let patched = "";
  try {
    patched = readFileSync(out, "utf8");
  } catch {
    // nothing was patched
  }
  return { status: result.status, stdout: result.stdout, stderr: result.stderr, patched };
}

describe("gh-ac.sh without GraphQL", () => {
  it("lists and counts criteria through REST", () => {
    expect(run("list", "1").stdout).toContain(" 2. ✔ Second criterion.");
    expect(run("progress", "1").stdout.trim()).toBe("1/3 acceptance criteria met");
  });

  it("ticks criteria 1 and 3 with a PATCH and leaves other sections alone", () => {
    const { status, patched } = run("check", "1", "1", "3");
    expect(status).toBe(0);
    expect(patched).toContain("- [x] First criterion.");
    expect(patched).toContain("- [x] Third criterion.");
    expect(patched).toContain("- [ ] not a criterion");
  });

  it("unticks a criterion", () => {
    expect(run("uncheck", "1", "2").patched).toContain("- [ ] Second criterion.");
  });
});

describe("gh-project.sh in a cloud session", () => {
  it("is a no-op with a clear message", () => {
    const out = execFileSync(
      // eslint-disable-next-line sonarjs/no-os-command-from-path -- inherits PATH only
      "bash",
      [new URL("./gh-project.sh", import.meta.url).pathname, "status", "u", "Ready"],
      {
        env: { ...process.env, CLAUDE_CODE_REMOTE: "true" },
        encoding: "utf8",
      },
    );
    expect(out).toContain("board move skipped");
  });
});

describe("columnFor", () => {
  it("maps status labels and closed state to columns", () => {
    expect(columnFor(["type:chore", "status:ready"], false)).toBe("Ready");
    expect(columnFor(["status:in-review"], false)).toBe("In review");
    expect(columnFor(["status:in-progress"], false)).toBe("In progress");
    expect(columnFor(["status:ready"], true)).toBe("Done");
    expect(columnFor(["type:chore"], false)).toBeNull();
  });
});
