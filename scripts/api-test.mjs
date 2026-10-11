// pnpm api:test: runs the Postman collection with Newman.
// Default: starts a throwaway local API (local key pair, no Docker, no Supabase) and a ready token.
// --base-url <url> [--environment <file>]: runs the same collection against a given API (real login).
// --break=health: local mode only; /api/health answers 500, so the run must fail (used by the tests).
import { spawn } from "node:child_process";
import { createInterface } from "node:readline";
import newman from "newman";

const COLLECTION = "postman/tafsila.postman_collection.json";
const DEFAULT_ENVIRONMENT = "postman/environments/local.postman_environment.json";
const ONE_HOUR_MS = 3_600_000;

/**
 * Reads the value that follows a flag.
 *
 * @param name - Flag name, e.g. "--base-url".
 * @returns The value, or undefined when the flag is absent.
 */
function option(name) {
  const index = process.argv.indexOf(name);
  return index === -1 ? undefined : process.argv[index + 1];
}

/**
 * Starts the throwaway API and waits for its ready line.
 *
 * @returns The child process, the base URL and a signed access token.
 */
async function startLocalApi() {
  const args = ["--import", "tsx", "src/dev/test-server.ts"];
  if (process.argv.includes("--break=health")) args.push("--break=health");
  const child = spawn(process.execPath, args, { cwd: "packages/api", stdio: ["ignore", "pipe", "inherit"] });
  const lines = createInterface({ input: child.stdout });
  for await (const line of lines) {
    try {
      const ready = JSON.parse(line);
      if (ready.baseUrl) return { child, ...ready };
    } catch {
      // not the ready line: ignore (pnpm banners)
    }
  }
  throw new Error("The test API exited before it was ready");
}

/**
 * Runs the collection once.
 *
 * @param environment - Postman environment file.
 * @param envVar - Variables that override the environment.
 * @returns A promise of the Newman summary.
 */
function runCollection(environment, envVar) {
  return new Promise((resolve, reject) => {
    newman.run({ collection: COLLECTION, environment, envVar, reporters: ["cli"] }, (error, summary) =>
      error ? reject(error) : resolve(summary),
    );
  });
}

const baseUrl = option("--base-url");
let local;
let failed = true;
try {
  let envVar;
  if (baseUrl) {
    envVar = [{ key: "baseUrl", value: baseUrl }];
  } else {
    local = await startLocalApi();
    envVar = [
      { key: "baseUrl", value: local.baseUrl },
      { key: "accessToken", value: local.accessToken },
      { key: "tokenExpiresAt", value: String(Date.now() + ONE_HOUR_MS) },
    ];
  }
  const summary = await runCollection(option("--environment") ?? DEFAULT_ENVIRONMENT, envVar);
  failed = summary.run.failures.length > 0;
} catch (error) {
  console.error(error);
} finally {
  local?.child.kill("SIGTERM");
}
process.exit(failed ? 1 : 0);
