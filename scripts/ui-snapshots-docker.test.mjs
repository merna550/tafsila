import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import {
  DOCKER_MISSING_MESSAGE,
  containerScript,
  dockerArgs,
  imageFor,
  main,
  parseArgs,
  playwrightVersionFromLockfile,
} from "./ui-snapshots-docker.mjs";

const LOCK = `importers:

  packages/api:
    dependencies:
      '@playwright/test':
        specifier: ^1.0.0
        version: 1.0.0

  packages/ui:
    devDependencies:
      '@playwright/test':
        specifier: ^1.64.0
        version: 1.64.0
      vitest:
        specifier: ^4
        version: 4.1.11

  packages/utils:
    dependencies: {}
`;

describe("playwrightVersionFromLockfile", () => {
  it("reads the version of packages/ui, not of another package", () => {
    expect(playwrightVersionFromLockfile(LOCK)).toBe("1.64.0");
  });

  it("reads the real lockfile", () => {
    const real = readFileSync(new URL("../pnpm-lock.yaml", import.meta.url), "utf8");
    expect(playwrightVersionFromLockfile(real)).toMatch(/^\d+\.\d+\.\d+$/);
  });

  it("fails clearly when packages/ui has no Playwright", () => {
    expect(() =>
      playwrightVersionFromLockfile("importers:\n\n  packages/ui:\n    dependencies: {}\n"),
    ).toThrow(/Playwright test package/);
  });
});

describe("docker command", () => {
  it("pins the image tag to the version", () => {
    expect(imageFor("1.64.0")).toBe("mcr.microsoft.com/playwright:v1.64.0-noble");
  });

  it("mounts the repo read-only and only the snapshot folder writable", () => {
    const args = dockerArgs({ version: "1.64.0", repoRoot: "/repo" });
    expect(args).toContain("/repo:/src:ro");
    expect(args).toContain("/repo/packages/ui/e2e/__snapshots__:/out");
    expect(args.filter((arg) => arg.endsWith(":/out") || arg.includes(":/src"))).toHaveLength(2);
  });

  it("updates by default and only compares with --check", () => {
    expect(containerScript(false)).toContain("test:visual:update");
    expect(containerScript(true)).not.toContain("test:visual:update");
    expect(containerScript(true)).toContain("test:visual");
  });
});

describe("parseArgs", () => {
  it("accepts the two flags and rejects others", () => {
    expect(parseArgs(["--check", "--dry-run"])).toEqual({ check: true, dryRun: true });
    expect(parseArgs([])).toEqual({ check: false, dryRun: false });
    expect(() => parseArgs(["--force"])).toThrow(/Unknown argument/);
  });
});

describe("main", () => {
  const root = new URL("..", import.meta.url).pathname.replace(/\/$/, "");

  it("prints the command on --dry-run without calling docker", () => {
    const run = vi.fn();
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    expect(main(["--dry-run"], root, run)).toBe(0);
    expect(run).not.toHaveBeenCalled();
    expect(log.mock.calls[0][0]).toContain("mcr.microsoft.com/playwright:v");
    log.mockRestore();
  });

  it("explains clearly when Docker is missing", () => {
    const err = vi.spyOn(console, "error").mockImplementation(() => {});
    const run = vi.fn(() => ({ error: new Error("ENOENT"), status: null }));
    expect(main([], root, run)).toBe(1);
    expect(err).toHaveBeenCalledWith(DOCKER_MISSING_MESSAGE);
    expect(run).toHaveBeenCalledTimes(1);
    err.mockRestore();
  });

  it("explains clearly when the Docker daemon is stopped", () => {
    const err = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(
      main(
        [],
        root,
        vi.fn(() => ({ status: 1 })),
      ),
    ).toBe(1);
    err.mockRestore();
  });

  it("returns the docker exit code when Docker works", () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => {});
    const run = vi.fn().mockReturnValueOnce({ status: 0 }).mockReturnValueOnce({ status: 3 });
    expect(main([], root, run)).toBe(3);
    expect(run.mock.calls[1][0]).toBe("docker");
    log.mockRestore();
  });

  it("rejects an unknown argument with exit code 2", () => {
    const err = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(main(["--nope"], root, vi.fn())).toBe(2);
    err.mockRestore();
  });
});
