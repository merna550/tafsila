/** Writes packages/api/openapi.json (run by `pnpm api:openapi`). */
import { writeFileSync } from "node:fs";
import { renderOpenApiDocument } from "./document";

const target = new URL("../../openapi.json", import.meta.url);
writeFileSync(target, renderOpenApiDocument());
console.warn("packages/api/openapi.json updated");
