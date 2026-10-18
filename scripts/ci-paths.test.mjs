// Tests for the CI path filters (issues #86, #188): which changes start each job and each gated quality step.
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { parse } from "yaml";
import { QUALITY_STEPS, RULES, needsJob, ruleTable, shouldRun } from "./ci-paths.mjs";

describe("storybook job", () => {
  it.each([
    ["packages/ui/src/Button.tsx"],
    ["packages/ui/.storybook/main.ts"],
    ["packages/ui/e2e/button.spec.ts-snapshots/a.png"],
    [".github/workflows/quality.yml"],
    ["pnpm-lock.yaml"],
  ])("runs for %s", (file) => expect(needsJob("storybook", [file])).toBe(true));

  it.each([
    ["docs/SRS.md"],
    ["packages/api/src/app.ts"],
    ["apps/web/src/page.tsx"],
    ["packages/engine/x.ts"],
  ])("is skipped for %s", (file) => expect(needsJob("storybook", [file])).toBe(false));

  it("runs when only one of many files matters, skipped for an empty change", () => {
    expect(needsJob("storybook", ["docs/a.md", "packages/ui/src/a.ts"])).toBe(true);
    expect(needsJob("storybook", [])).toBe(false);
  });
});

describe("docker job", () => {
  it.each([
    ["apps/web/src/app/page.tsx"],
    ["packages/api/src/app.ts"],
    ["packages/ui/src/Button.tsx"],
    ["apps/web/Dockerfile"],
    ["pnpm-lock.yaml"],
    [".dockerignore"],
    [".github/workflows/docker.yml"],
  ])("runs for %s", (file) => expect(needsJob("docker", [file])).toBe(true));

  it.each([
    ["docs/SRS.md"],
    ["packages/ui/src/Button.stories.tsx"],
    ["packages/api/src/app.test.ts"],
    ["packages/ui/e2e/button.spec.ts-snapshots/a.png"],
    ["packages/engine/README.md"],
    ["apps/web/e2e/home.spec.ts"],
    ["scripts/dispatch.mjs"],
    ["packages/test-fixtures/src/garments.ts"],
    ["packages/engine/scripts/print.ts"],
    ["packages/engine/src/a/__snapshots__/x.snap"],
    ["packages/engine/src/a/shape.svg"],
  ])("is skipped for %s", (file) => expect(needsJob("docker", [file])).toBe(false));

  it("still runs for engine source, which the web app imports", () => {
    expect(needsJob("docker", ["packages/engine/src/bodice.ts"])).toBe(true);
    expect(needsJob("docker", ["packages/ui/src/icon.svg"])).toBe(true);
  });

  it("rejects an unknown target", () => {
    expect(() => needsJob("nope", [])).toThrow("Unknown target");
  });
});

describe("e2e job", () => {
  it.each([
    ["apps/web/src/app/[locale]/page.tsx"],
    ["apps/web/messages/ar.json"],
    ["apps/web/e2e/home.spec.ts"],
    ["packages/ui/src/Button.tsx"],
    ["packages/api/src/app.ts"],
    ["supabase/migrations/1_x.sql"],
    ["pnpm-lock.yaml"],
    [".github/workflows/e2e.yml"],
  ])("runs for %s", (file) => expect(needsJob("e2e", [file])).toBe(true));

  it.each([
    ["docs/SRS.md"],
    ["apps/web/CLAUDE.md"],
    ["apps/web/src/shared/i18n/messages.test.ts"],
    ["packages/ui/src/Button.stories.tsx"],
    ["packages/engine/src/a.ts"],
    ["scripts/dispatch.mjs"],
    ["packages/schemas/src/pattern.ts"],
    ["packages/schemas/src/pattern-json-schema.ts"],
    ["packages/schemas/src/engine-options.ts"],
    ["packages/schemas/json/pattern-result.schema.json"],
  ])("is skipped for %s", (file) => expect(needsJob("e2e", [file])).toBe(false));

  it("still runs for the schemas the web app uses", () => {
    expect(needsJob("e2e", ["packages/schemas/src/me.ts"])).toBe(true);
    expect(needsJob("e2e", ["packages/utils/src/a.ts"])).toBe(true);
  });
});

describe("api checks (issue #94)", () => {
  it.each([
    ["packages/api/src/routes/me.ts"],
    ["packages/api/openapi.json"],
    ["postman/err-cases.json"],
    ["packages/schemas/src/me.ts"],
    ["scripts/gen-postman.mjs"],
    [".github/workflows/quality.yml"],
  ])("runs for %s", (file) => expect(needsJob("api", [file])).toBe(true));

  it.each([
    ["packages/api/src/app.test.ts"],
    ["docs/x.md"],
    ["postman/README.md"],
    ["apps/web/src/x.tsx"],
    ["packages/ui/src/Button.tsx"],
  ])("is skipped for %s", (file) => expect(needsJob("api", [file])).toBe(false));
});

describe("supabase job (issue #83)", () => {
  it.each([
    ["supabase/migrations/0001_init.sql"],
    ["supabase/seed.sql"],
    ["pnpm-lock.yaml"],
    [".github/workflows/supabase.yml"],
  ])("runs for %s", (file) => expect(needsJob("supabase", [file])).toBe(true));

  it.each([
    ["docs/SRS.md"],
    ["apps/web/src/page.tsx"],
    ["packages/ui/src/Button.tsx"],
    ["supabase/README.md"],
  ])("is skipped for %s", (file) => expect(needsJob("supabase", [file])).toBe(false));
});

describe.each(["jscpd", "depcruise"])("%s step (issue #188)", (target) => {
  it.each([
    ["apps/web/src/page.tsx"],
    ["packages/engine/src/a.ts"],
    ["packages/ui/src/Button.tsx"],
    [".jscpd.json"],
    [".dependency-cruiser.cjs"],
    [".github/workflows/quality.yml"],
    ["pnpm-lock.yaml"],
  ])("runs for %s", (file) => expect(needsJob(target, [file])).toBe(true));

  it.each([
    ["docs/SRS.md"],
    ["packages/engine/README.md"],
    ["packages/api/src/app.test.ts"],
    ["packages/ui/src/Button.stories.tsx"],
    ["packages/engine/src/__snapshots__/a.snap.ts"],
    ["scripts/dispatch.mjs"],
    ["supabase/seed.sql"],
  ])("is skipped for %s", (file) => expect(needsJob(target, [file])).toBe(false));
});

describe("docs step (issue #188)", () => {
  it.each([
    ["docs/SRS.md"],
    ["README.md"],
    ["packages/engine/CLAUDE.md"],
    ["apps/web/package.json"],
    ["packages/api/package.json"],
    ["scripts/check-handbook.mjs"],
    ["pnpm-lock.yaml"],
  ])("runs for %s", (file) => expect(needsJob("docs", [file])).toBe(true));

  it.each([["apps/web/src/page.tsx"], ["packages/engine/src/a.ts"], ["supabase/seed.sql"]])(
    "is skipped for %s",
    (file) => expect(needsJob("docs", [file])).toBe(false),
  );
});

describe("tokens step (issue #188)", () => {
  it.each([
    ["packages/ui/src/tokens.css"],
    ["packages/ui/src/Button.tsx"],
    ["docs/design-system/tokens.json"],
    ["apps/web/src/app/globals.css"],
    ["scripts/gen-tokens.mjs"],
    ["turbo.json"],
  ])("runs for %s", (file) => expect(needsJob("tokens", [file])).toBe(true));

  it.each([
    ["docs/SRS.md"],
    ["apps/web/src/page.tsx"],
    ["packages/engine/src/a.ts"],
    ["packages/api/src/app.ts"],
  ])("is skipped for %s", (file) => expect(needsJob("tokens", [file])).toBe(false));
});

describe("scripts step (issue #188)", () => {
  it.each([
    ["scripts/dispatch.mjs"],
    ["scripts/check-handbook.test.mjs"],
    [".github/workflows/e2e.yml"],
    ["docs/handbook/glossary.md"],
    ["pnpm-lock.yaml"],
  ])("runs for %s", (file) => expect(needsJob("scripts", [file])).toBe(true));

  it.each([["packages/engine/src/a.ts"], ["apps/web/src/page.tsx"], ["docs/SRS.md"]])(
    "is skipped for %s",
    (file) => expect(needsJob("scripts", [file])).toBe(false),
  );
});

describe("whole-repo changes and the unknown-change fallback (issue #188)", () => {
  it.each(Object.keys(RULES))("%s runs for package.json, the lockfile and turbo.json", (target) => {
    for (const file of ["package.json", "pnpm-lock.yaml", "turbo.json"])
      expect(needsJob(target, [file])).toBe(true);
  });

  it.each(Object.keys(RULES))("%s runs when the change is unknown (null)", (target) => {
    expect(shouldRun(target, null)).toBe(true);
  });

  it("follows the rules for a known change and rejects an unknown target", () => {
    expect(shouldRun("tokens", ["docs/a.md"])).toBe(false);
    expect(shouldRun("tokens", ["packages/ui/src/a.tsx"])).toBe(true);
    expect(() => shouldRun("nope", null)).toThrow("Unknown target");
  });

  it("a docs-only change runs only the docs and scripts-free checks", () => {
    const files = ["docs/plans/1-x.md"];
    const run = Object.keys(RULES).filter((t) => needsJob(t, files));
    expect(run).toEqual(["docs"]);
  });

  it("an engine-only change skips e2e, storybook, db-reset, tokens, docs and api", () => {
    const run = Object.keys(RULES).filter((t) => needsJob(t, ["packages/engine/src/bodice.ts"]));
    expect(run).toEqual(["docker", "jscpd", "depcruise"]);
  });

  it("a packages/ui change runs storybook, tokens and e2e", () => {
    const run = Object.keys(RULES).filter((t) => needsJob(t, ["packages/ui/src/Button.tsx"]));
    expect(run).toEqual(expect.arrayContaining(["storybook", "tokens", "e2e"]));
  });
});

describe("rule table and workflow wiring (issue #188)", () => {
  it("lists every rule in the generated table", () => {
    const table = ruleTable();
    for (const target of Object.keys(RULES)) expect(table).toContain(`| \`${target}\` |`);
  });

  it("keeps every gated quality step behind an if on its own output", () => {
    const quality = parse(readFileSync(new URL("../.github/workflows/quality.yml", import.meta.url), "utf8"));
    const steps = quality.jobs.quality.steps;
    for (const target of QUALITY_STEPS) {
      const gated = steps.filter((s) => s.if?.includes(`steps.paths.outputs.${target} == 'true'`));
      expect(gated.length, target).toBeGreaterThan(0);
    }
  });

  it("keeps the required check names and a nightly schedule", () => {
    const read = (f) => parse(readFileSync(new URL(`../.github/workflows/${f}`, import.meta.url), "utf8"));
    const quality = read("quality.yml");
    expect(Object.keys(quality.jobs)).toEqual(expect.arrayContaining(["quality", "storybook"]));
    expect(quality.on.schedule[0].cron).toBe("0 3 * * *");
    expect(quality.on.push.branches).toEqual(["main"]);
    expect(Object.keys(read("docker.yml").jobs)).toContain("build");
    expect(Object.keys(read("e2e.yml").jobs)).toContain("e2e");
    expect(Object.keys(read("supabase.yml").jobs)).toContain("db-reset");
  });
});
