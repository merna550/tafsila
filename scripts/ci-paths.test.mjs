// Tests for the CI path filters (issue #86): which changes start Storybook and Docker.
import { describe, expect, it } from "vitest";
import { needsJob } from "./ci-paths.mjs";

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
  ])("is skipped for %s", (file) => expect(needsJob("docker", [file])).toBe(false));

  it("rejects an unknown target", () => {
    expect(() => needsJob("nope", [])).toThrow("Unknown target");
  });
});
