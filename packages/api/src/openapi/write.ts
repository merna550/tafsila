/** Writes packages/api/openapi.json (run by `pnpm api:openapi`); with `--stdout` prints it instead (used by `pnpm api:check`). */
import { writeFileSync } from "node:fs";
import { renderOpenApiDocument } from "./document";

if (process.argv.includes("--stdout")) {
  process.stdout.write(renderOpenApiDocument());
} else {
  writeFileSync(new URL("../../openapi.json", import.meta.url), renderOpenApiDocument());
  console.warn("packages/api/openapi.json updated");
}
