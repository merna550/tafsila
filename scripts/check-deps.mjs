// Safety net run by `predev` (issue #95): reinstall when node_modules is out of date, fail fast on missing Supabase keys.
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const REQUIRED_KEYS = ["SUPABASE_URL", "SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY"];

/**
 * Tells whether node_modules was installed from the current lockfile.
 *
 * @param {string} rootDir Repository root.
 * @returns {boolean} true when node_modules/.pnpm/lock.yaml is identical to pnpm-lock.yaml.
 */
export function depsAreCurrent(rootDir) {
  const installed = join(rootDir, "node_modules", ".pnpm", "lock.yaml");
  const wanted = join(rootDir, "pnpm-lock.yaml");
  if (!existsSync(installed) || !existsSync(wanted)) return false;
  return readFileSync(installed, "utf8") === readFileSync(wanted, "utf8");
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
