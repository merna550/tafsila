// Safety net run by `predev` (issue #95): reinstall when node_modules is out of date, fail fast on missing Supabase keys.
import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const REQUIRED_KEYS = ["SUPABASE_URL", "SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY"];

/**
 * Lists the folders holding a package.json: the root and every apps/* and packages/* workspace.
 *
 * @param {string} rootDir Repository root.
 * @returns {string[]} Absolute package folders.
 */
function packageDirs(rootDir) {
  const dirs = [rootDir];
  for (const group of ["apps", "packages"]) {
    const groupDir = join(rootDir, group);
    if (!existsSync(groupDir)) continue;
    for (const entry of readdirSync(groupDir, { withFileTypes: true })) {
      if (entry.isDirectory() && existsSync(join(groupDir, entry.name, "package.json"))) {
        dirs.push(join(groupDir, entry.name));
      }
    }
  }
  return dirs;
}

/**
 * Tells whether every declared dependency resolves under its package's node_modules (scoped names included).
 *
 * @param {string} rootDir Repository root.
 * @returns {boolean} false when any dependency or devDependency folder or link is missing.
 */
export function allDepsInstalled(rootDir) {
  return packageDirs(rootDir).every((dir) => {
    const file = join(dir, "package.json");
    if (!existsSync(file)) return true;
    const manifest = JSON.parse(readFileSync(file, "utf8"));
    const names = [
      ...Object.keys(manifest.dependencies ?? {}),
      ...Object.keys(manifest.devDependencies ?? {}),
    ];
    return names.every((name) => existsSync(join(dir, "node_modules", name)));
  });
}

/**
 * Tells whether node_modules is up to date: installed from the current lockfile and nothing deleted since.
 *
 * @param {string} rootDir Repository root.
 * @returns {boolean} true when node_modules/.pnpm/lock.yaml equals pnpm-lock.yaml and every declared dependency exists.
 */
export function depsAreCurrent(rootDir) {
  const installed = join(rootDir, "node_modules", ".pnpm", "lock.yaml");
  const wanted = join(rootDir, "pnpm-lock.yaml");
  if (!existsSync(installed) || !existsSync(wanted)) return false;
  if (readFileSync(installed, "utf8") !== readFileSync(wanted, "utf8")) return false;
  return allDepsInstalled(rootDir);
}

/**
 * Parses KEY=value lines of a dotenv file (comments and blank lines ignored, quotes stripped).
 *
 * @param {string} text File content.
 * @returns {Record<string, string>} Parsed variables.
 */
export function parseEnv(text) {
  const vars = {};
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.trim().replace(/^export /, "");
    const eq = line.indexOf("=");
    if (line.startsWith("#") || eq < 1) continue;
    const value = line.slice(eq + 1).trim();
    const quoted = value.length > 1 && "\"'".includes(value[0]) && value.endsWith(value[0]);
    vars[line.slice(0, eq).trim()] = quoted ? value.slice(1, -1) : value;
  }
  return vars;
}

/**
 * Lists the required keys that are missing, empty or still a `<from supabase status>` placeholder.
 *
 * @param {string | null} fileText Content of the root .env.local, or null when the file is missing.
 * @param {Record<string, string | undefined>} shellEnv Variables already set in the shell.
 * @returns {string[]} Key names to fix (never their values).
 */
export function badEnvKeys(fileText, shellEnv = {}) {
  const fromFile = fileText === null ? {} : parseEnv(fileText);
  return REQUIRED_KEYS.filter((key) => {
    const value = shellEnv[key] || fromFile[key];
    return !value || (value.includes("<") && value.includes(">"));
  });
}

/**
 * Runs both checks: reinstall when needed, then validate the env file. Skips entirely in CI.
 *
 * @returns {number} Process exit code.
 */
export function main() {
  if (process.env.CI === "true") return 0;
  if (!depsAreCurrent(root)) {
    console.log("Dependencies changed, running pnpm install…");
    // eslint-disable-next-line sonarjs/no-os-command-from-path -- dev-only script: must use the developer's own pnpm
    const result = spawnSync("pnpm", ["install", "--frozen-lockfile"], { cwd: root, stdio: "inherit" });
    if (result.status !== 0) {
      console.error("pnpm install failed. Run it by hand: pnpm install");
      return 1;
    }
  }
  const envFile = join(root, ".env.local");
  const bad = badEnvKeys(existsSync(envFile) ? readFileSync(envFile, "utf8") : null, process.env);
  if (bad.length > 0) {
    console.error(
      `Missing or placeholder values in .env.local: ${bad.join(", ")}.\n` +
        "Copy .env.example to .env.local and fill them from `pnpm exec supabase status`.\n" +
        "See docs/backend/tutorials/run-locally.md",
    );
    return 1;
  }
  return 0;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) process.exit(main());
