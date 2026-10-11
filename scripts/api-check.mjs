// pnpm api:check: fails when the committed OpenAPI document or Postman collection no longer matches the routes.
// Options (used by the tests): --openapi <file> and --collection <file> replace the committed files.
import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { buildCollection, renderCollection } from "./gen-postman.mjs";

/**
 * Reads the value that follows a flag.
 *
 * @param name - Flag name.
 * @param fallback - Value when the flag is absent.
 * @returns The flag value or the fallback.
 */
function option(name, fallback) {
  const index = process.argv.indexOf(name);
  return index === -1 ? fallback : process.argv[index + 1];
}

const fresh = spawnSync(process.execPath, ["--import", "tsx", "src/openapi/write.ts", "--stdout"], {
  cwd: "packages/api",
  encoding: "utf8",
  maxBuffer: 64 * 1024 * 1024,
});
if (fresh.status !== 0) {
  console.error(fresh.stderr);
  process.exit(1);
}
const freshCollection = renderCollection(await buildCollection(fresh.stdout));
const stale = [];
if (readFileSync(option("--openapi", "packages/api/openapi.json"), "utf8") !== fresh.stdout) {
  stale.push("packages/api/openapi.json");
}
if (
  readFileSync(option("--collection", "postman/tafsila.postman_collection.json"), "utf8") !== freshCollection
) {
  stale.push("postman/tafsila.postman_collection.json");
}
if (stale.length > 0) {
  console.error(`Stale: ${stale.join(", ")}\nRun: pnpm api:openapi && pnpm api:postman`);
  process.exit(1);
}
console.warn("OpenAPI document and Postman collection are up to date");
