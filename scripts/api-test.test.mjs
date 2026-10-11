import { spawnSync } from "node:child_process";
import { copyFileSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

const run = (script, args = []) =>
  spawnSync(process.execPath, [script, ...args], {
    encoding: "utf8",
    env: { ...process.env, NPM_CONFIG_ENGINE_STRICT: "false" },
  });

describe("pnpm api:test", () => {
  it("passes against the local throwaway API", () => {
    expect(run("scripts/api-test.mjs").status).toBe(0);
  }, 120_000);

  it("fails when a route is deliberately broken", () => {
    expect(run("scripts/api-test.mjs", ["--break=health"]).status).not.toBe(0);
  }, 120_000);
});

describe("pnpm api:check", () => {
  it("passes on the committed files", () => {
    expect(run("scripts/api-check.mjs").status).toBe(0);
  }, 120_000);

  it("fails and names the commands when the document is stale", () => {
    const dir = mkdtempSync(join(tmpdir(), "api-check-"));
    const stale = join(dir, "openapi.json");
    copyFileSync("packages/api/openapi.json", stale);
    writeFileSync(stale, "{}\n");
    const result = run("scripts/api-check.mjs", ["--openapi", stale]);
    expect(result.status).toBe(1);
    expect(result.stderr).toContain("pnpm api:openapi && pnpm api:postman");
  }, 120_000);
});
