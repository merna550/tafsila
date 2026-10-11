// Regenerates the Storybook visual snapshots of packages/ui on Linux, inside the official Playwright Docker image (issue #99).
// Usage: node scripts/ui-snapshots-docker.mjs [--check] [--dry-run]
//   --dry-run  print the docker command and exit (no Docker needed)
//   --check    compare instead of update (runs `test:visual` rather than `test:visual:update`)
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

/** Folder (inside the repo) that is the only thing the container may write back. */
export const SNAPSHOT_DIR = "packages/ui/e2e/__snapshots__";

/** Message printed when the docker CLI or daemon cannot be used. */
export const DOCKER_MISSING_MESSAGE =
  "Docker is not available. Install Docker Desktop (or start it) and run this command again. " +
  "Snapshots must never be generated outside Linux: other systems render fonts differently and CI would fail.";

/**
 * Reads the version of the Playwright test package that packages/ui resolves to, from the text of pnpm-lock.yaml.
 *
 * @param {string} lockfile Text of pnpm-lock.yaml.
 * @returns {string} Exact version such as "1.64.0".
 * @throws {Error} When packages/ui does not list the Playwright test package.
 */
export function playwrightVersionFromLockfile(lockfile) {
  const lines = lockfile.split("\n");
  const start = lines.indexOf("  packages/ui:");
  const rest = lines.slice(start + 1);
  const next = rest.findIndex((line) => /^ {2}\S/.test(line));
  const length = next === -1 ? rest.length : next;
  const block = start === -1 ? [] : rest.slice(0, length);
  const at = block.findIndex((line) => line.trim() === "'@playwright/test':");
  const versionLine = block.slice(at + 1, at + 3).find((line) => line.trim().startsWith("version:"));
  const version = at === -1 ? undefined : versionLine?.trim().slice("version:".length).trim();
  if (!version || !/^\d+\.\d+\.\d+/.test(version)) {
    throw new Error("Could not find the Playwright test package for packages/ui in pnpm-lock.yaml");
  }
  return version.split("(")[0];
}

/**
 * Builds the name of the official Playwright image for a version (Ubuntu 24.04, like CI's ubuntu-latest).
 *
 * @param {string} version Exact Playwright version.
 * @returns {string} Image reference with a pinned tag.
 */
export function imageFor(version) {
  return `mcr.microsoft.com/playwright:v${version}-noble`;
}

/**
 * Builds the shell script that runs inside the container: copy the repo (without node_modules) to a scratch folder,
 * install, run the visual test, and copy only the snapshot folder back to /out.
 *
 * @param {boolean} check True to compare snapshots instead of updating them.
 * @returns {string} The script text for `bash -c`.
 */
export function containerScript(check) {
  const task = check ? "test:visual" : "test:visual:update";
  return [
    "set -euo pipefail",
    "mkdir /work",
    "cd /src && tar --exclude=node_modules --exclude=.git --exclude=.next --exclude=storybook-static --exclude=test-results -cf - . | tar -xf - -C /work",
    "cd /work",
    "corepack enable",
    "export NPM_CONFIG_ENGINE_STRICT=false CI=true",
    "pnpm install --frozen-lockfile",
    `pnpm --filter @tafsila/ui ${task}`,
    `cp -r ${SNAPSHOT_DIR}/. /out/`,
  ].join(" && ");
}

/**
 * Builds the arguments of `docker run`. The repo is mounted read-only; only the snapshot folder is writable.
 *
 * @param {object} options Run options.
 * @param {string} options.version Playwright version from the lockfile.
 * @param {string} options.repoRoot Absolute path of the repo on the host.
 * @param {boolean} [options.check] Compare only.
 * @returns {string[]} Arguments for the docker CLI.
 */
export function dockerArgs({ version, repoRoot, check = false }) {
  return [
    "run",
    "--rm",
    "--ipc=host",
    "-v",
    `${repoRoot}:/src:ro`,
    "-v",
    `${resolve(repoRoot, SNAPSHOT_DIR)}:/out`,
    imageFor(version),
    "bash",
    "-c",
    containerScript(check),
  ];
}

/**
 * Parses the command line.
 *
 * @param {string[]} argv Arguments after the script name.
 * @returns {{ check: boolean, dryRun: boolean }} Flags.
 * @throws {Error} On an unknown argument.
 */
export function parseArgs(argv) {
  const known = new Set(["--check", "--dry-run"]);
  const unknown = argv.filter((arg) => !known.has(arg));
  if (unknown.length > 0)
    throw new Error(`Unknown argument: ${unknown.join(" ")}. Use --check or --dry-run.`);
  return { check: argv.includes("--check"), dryRun: argv.includes("--dry-run") };
}

/**
 * Tells whether the Docker daemon answers.
 *
 * @param {typeof spawnSync} run Process runner (replaced in tests).
 * @returns {boolean} True when `docker info` succeeds.
 */
export function dockerAvailable(run = spawnSync) {
  const result = run("docker", ["info"], { stdio: "ignore" });
  return !result.error && result.status === 0;
}

/**
 * Runs the whole flow.
 *
 * @param {string[]} argv Command line arguments.
 * @param {string} repoRoot Absolute repo path.
 * @param {typeof spawnSync} run Process runner (replaced in tests).
 * @returns {number} Exit code.
 */
export function main(argv, repoRoot, run = spawnSync) {
  let flags;
  let version;
  try {
    flags = parseArgs(argv);
    version = playwrightVersionFromLockfile(readFileSync(resolve(repoRoot, "pnpm-lock.yaml"), "utf8"));
  } catch (error) {
    console.error(error.message);
    return 2;
  }
  const args = dockerArgs({ version, repoRoot, check: flags.check });
  if (flags.dryRun) {
    console.log(["docker", ...args].join(" "));
    return 0;
  }
  if (!dockerAvailable(run)) {
    console.error(DOCKER_MISSING_MESSAGE);
    return 1;
  }
  console.log(`Using ${imageFor(version)}; only ${SNAPSHOT_DIR} is written.`);
  return run("docker", args, { stdio: "inherit" }).status ?? 1;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  process.exit(main(process.argv.slice(2), resolve(dirname(fileURLToPath(import.meta.url)), "..")));
}
