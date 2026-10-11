// Generates postman/tafsila.postman_collection.json from the API's OpenAPI document
// (packages/api/openapi.json, itself generated from the Zod route schemas), then injects auth,
// the shared scripts and the ERR cases from postman/err-cases.json.
// Run: pnpm api:postman   (pnpm api:check fails when the committed collection is stale)
// The output is deterministic: random ids are removed, folders and requests are sorted.
import { createHash } from "node:crypto";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import Converter from "openapi-to-postmanv2";

const OPENAPI_PATH = "packages/api/openapi.json";
const COLLECTION_PATH = "postman/tafsila.postman_collection.json";
/** Folders that are never called by Newman (a call would throw a 500 and use the Sentry quota). */
const SKIPPED_FOLDERS = new Set(["debug"]);

/**
 * Removes every `id` and `_postman_id` key (they are random UUIDs) at any depth.
 *
 * @param node - Any JSON value.
 * @returns The same value without those keys.
 */
function stripIds(node) {
  if (Array.isArray(node)) return node.map(stripIds);
  if (node && typeof node === "object") {
    return Object.fromEntries(
      Object.entries(node)
        .filter(([key]) => key !== "id" && key !== "_postman_id")
        .map(([key, value]) => [key, stripIds(value)]),
    );
  }
  return node;
}

/**
 * Makes generated requests inherit the collection auth and drops the converter's random example
 * responses (their content changes between runs).
 *
 * @param items - Postman items (folders or requests).
 * @returns A cleaned copy.
 */
function normalizeItems(items) {
  return items.map((item) => {
    if (item.item) return { ...item, item: normalizeItems(item.item) };
    const request = { ...item.request };
    delete request.auth;
    return { ...item, request, response: [] };
  });
}

/**
 * Sorts items by name so the order never depends on the converter.
 *
 * @param items - Postman items (folders or requests).
 * @returns A sorted copy, folders sorted recursively.
 */
function sortItems(items) {
  return items
    .map((item) => (item.item ? { ...item, item: sortItems(item.item) } : item))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Builds one ERR request that expects an error status and the standard error body.
 *
 * @param errCase - An entry of postman/err-cases.json.
 * @returns A Postman request item.
 */
function errItem(errCase) {
  const segments = errCase.path.split("/").filter(Boolean);
  const exec = [
    `pm.test("status is ${errCase.status}", () => pm.response.to.have.status(${errCase.status}));`,
    `pm.test("error code is ${errCase.code}", () => pm.expect(pm.response.json().code).to.eql("${errCase.code}"));`,
  ];
  return {
    name: errCase.name,
    event: [{ listen: "test", script: { type: "text/javascript", exec } }],
    request: {
      method: errCase.method,
      ...(errCase.auth ? {} : { auth: { type: "noauth" } }),
      header: [],
      url: { raw: `{{baseUrl}}${errCase.path}`, host: ["{{baseUrl}}"], path: segments },
    },
    response: [],
  };
}

/**
 * Converts an OpenAPI document text into the Tafsila Postman collection object.
 *
 * @param specText - The contents of packages/api/openapi.json.
 * @returns A promise of the collection object.
 */
export function buildCollection(specText) {
  return new Promise((resolve, reject) => {
    Converter.convert(
      { type: "string", data: specText },
      { folderStrategy: "Tags", parametersResolution: "Example" },
      (err, out) => {
        if (err || !out.result) return reject(new Error(String(err || out.reason)));
        const col = stripIds(out.output[0].data);
        col.info.name = "Tafsila API";
        col.info._postman_id = createHash("sha256").update(specText).digest("hex");
        col.item = normalizeItems(col.item.filter((item) => !SKIPPED_FOLDERS.has(item.name)));
        const errCases = JSON.parse(readFileSync("postman/err-cases.json", "utf8"));
        col.item.push({ name: "Errors", item: errCases.map(errItem) });
        col.item = sortItems(col.item);
        col.variable = [{ key: "baseUrl", value: "{{baseUrl}}" }];
        col.auth = { type: "bearer", bearer: [{ key: "token", value: "{{accessToken}}", type: "string" }] };
        col.event = ["prerequest", "test"].map((listen) => ({
          listen,
          script: {
            type: "text/javascript",
            exec: readFileSync(
              `postman/collection-${listen === "test" ? "tests" : "prerequest"}.js`,
              "utf8",
            ).split("\n"),
          },
        }));
        resolve(col);
      },
    );
  });
}

/**
 * Renders the collection exactly as it is committed.
 *
 * @param col - Collection object.
 * @returns Pretty-printed JSON ending with a newline.
 */
export function renderCollection(col) {
  return JSON.stringify(col, null, 2) + "\n";
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const col = await buildCollection(readFileSync(OPENAPI_PATH, "utf8"));
  writeFileSync(COLLECTION_PATH, renderCollection(col));
  console.warn(`${COLLECTION_PATH} updated`);
}
