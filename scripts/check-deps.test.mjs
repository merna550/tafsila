// Tests for the predev safety net (issue #95): lockfile comparison and env key validation.
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { badEnvKeys, depsAreCurrent, parseEnv } from "./check-deps.mjs";

/**
 * Creates a fake repo root with the given lockfile and installed copy.
 *
 * @param {string} lock Content of pnpm-lock.yaml.
 * @param {string | null} installed Content of node_modules/.pnpm/lock.yaml, or null when not installed.
 * @returns {string} Root directory.
 */
function fakeRoot(lock, installed) {
  const dir = mkdtempSync(join(tmpdir(), "check-deps-"));
  writeFileSync(join(dir, "pnpm-lock.yaml"), lock);
  if (installed !== null) {
    mkdirSync(join(dir, "node_modules", ".pnpm"), { recursive: true });
    writeFileSync(join(dir, "node_modules", ".pnpm", "lock.yaml"), installed);
  }
  return dir;
}

describe("depsAreCurrent", () => {
  it("is true when the installed lockfile matches", () => {
    expect(depsAreCurrent(fakeRoot("a", "a"))).toBe(true);
  });

  it("is false when the lockfile changed", () => {
    expect(depsAreCurrent(fakeRoot("b", "a"))).toBe(false);
  });

  it("is false when node_modules is missing", () => {
    expect(depsAreCurrent(fakeRoot("a", null))).toBe(false);
  });
});

describe("parseEnv", () => {
  it("reads keys, ignores comments and strips quotes", () => {
    expect(parseEnv('# c\nA=1\nexport B="two"\n\nC = x')).toEqual({ A: "1", B: "two", C: "x" });
  });
});

describe("badEnvKeys", () => {
  const ok = "SUPABASE_URL=http://x\nSUPABASE_ANON_KEY=a\nSUPABASE_SERVICE_ROLE_KEY=b";

  it("returns nothing when all keys are set", () => {
    expect(badEnvKeys(ok)).toEqual([]);
  });

  it("names every key when the file is missing", () => {
    expect(badEnvKeys(null)).toHaveLength(3);
  });

  it("flags placeholders by key name only", () => {
    const text = ok.replace("ANON_KEY=a", "ANON_KEY=<from `supabase status`>");
    expect(badEnvKeys(text)).toEqual(["SUPABASE_ANON_KEY"]);
  });

  it("accepts keys set in the shell", () => {
    const shell = { SUPABASE_URL: "u", SUPABASE_ANON_KEY: "a", SUPABASE_SERVICE_ROLE_KEY: "s" };
    expect(badEnvKeys(null, shell)).toEqual([]);
  });
});
