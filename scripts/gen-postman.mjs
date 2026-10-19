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
/** Folders that are never called by Newman ("admin": Newman has no admin token, the ERR cases cover 401 and 403; a call would throw a 500 and use the Sentry quota; "account" deletes the signed-in account, so it is only called by hand on a throwaway account). */
const SKIPPED_FOLDERS = new Set(["debug", "phone", "account", "admin"]);
/** Folders replaced by a hand-written journey in postman/journey.json (they need ids from earlier steps). */
const JOURNEY_FOLDERS = new Set(["clients", "measurements", "profile", "designs", "versions"]);

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
 * Lists the documented 200 response fields of each GET route, keyed by URL path.
 *
 * @param spec - Parsed OpenAPI document.
 * @returns A map from "/api/x" to the property names of its 200 JSON schema.
 */
function responseFields(spec) {
  const fields = {};
  for (const [path, methods] of Object.entries(spec.paths)) {
    const schema = methods.get?.responses?.["200"]?.content?.["application/json"]?.schema;
    if (schema?.properties) fields[path] = Object.keys(schema.properties);
  }
  return fields;
}

/**
 * Builds a test event asserting that the 200 body has every documented field.
 *
 * @param keys - Documented property names.
 * @returns A Postman event.
 */
function fieldsEvent(keys) {
  const exec = [
    `pm.test("response has the documented fields", () => {`,
    `  const body = pm.response.json();`,
    `  for (const key of ${JSON.stringify(keys)}) pm.expect(body).to.have.property(key);`,
    `});`,
  ];
  return { listen: "test", script: { type: "text/javascript", exec } };
}

/**
 * Makes generated requests inherit the collection auth and drops the converter's random example
 * responses (their content changes between runs).
 *
 * @param items - Postman items (folders or requests).
 * @param fields - Documented 200 fields by URL path.
 * @returns A cleaned copy.
 */
function normalizeItems(items, fields) {
  return items.map((item) => {
    if (item.item) return { ...item, item: normalizeItems(item.item, fields) };
    const request = { ...item.request };
    delete request.auth;
    const keys = fields[`/${request.url.path.join("/")}`];
    return { ...item, request, response: [], event: keys ? [fieldsEvent(keys)] : [] };
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
 * Builds the JSON body of a request item, if the step has one.
 *
 * @param body - JSON value or undefined.
 * @returns The Postman body object, or an empty object.
 */
function bodyOf(body) {
  if (body === undefined) return {};
  return {
    body: {
      mode: "raw",
      raw: JSON.stringify(body, null, 2),
      options: { raw: { language: "json" } },
    },
  };
}

/**
 * Splits a path with a query string into Postman url parts.
 *
 * @param path - Path such as "/api/clients?q=x".
 * @returns The Postman url object.
 */
function urlOf(path) {
  const [pathname, query] = path.split("?");
  return {
    raw: `{{baseUrl}}${path}`,
    host: ["{{baseUrl}}"],
    path: pathname.split("/").filter(Boolean),
    ...(query
      ? { query: query.split("&").map((pair) => ({ key: pair.split("=")[0], value: pair.split("=")[1] })) }
      : {}),
  };
}

/**
 * Builds one step of the journey: a request that checks its status and fields and saves ids for later steps.
 *
 * @param step - An entry of postman/journey.json.
 * @returns A Postman request item.
 */
function journeyItem(step) {
  const exec = [`pm.test("status is ${step.status}", () => pm.response.to.have.status(${step.status}));`];
  for (const key of step.has ?? []) {
    exec.push(`pm.test("has ${key}", () => pm.expect(pm.response.json()).to.have.property("${key}"));`);
  }
  for (const [variable, field] of Object.entries(step.capture ?? {})) {
    exec.push(`pm.environment.set("${variable}", pm.response.json().${field});`);
  }
  return {
    name: step.name,
    event: [{ listen: "test", script: { type: "text/javascript", exec } }],
    request: {
      method: step.method,
      header: step.body === undefined ? [] : [{ key: "Content-Type", value: "application/json" }],
      ...bodyOf(step.body),
      url: urlOf(step.path),
    },
    response: [],
  };
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
      header: errCase.body === undefined ? [] : [{ key: "Content-Type", value: "application/json" }],
      ...bodyOf(errCase.body),
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
        col.item = normalizeItems(
          col.item.filter((item) => !SKIPPED_FOLDERS.has(item.name) && !JOURNEY_FOLDERS.has(item.name)),
          responseFields(JSON.parse(specText)),
        );
        const errCases = JSON.parse(readFileSync("postman/err-cases.json", "utf8"));
        const journey = JSON.parse(readFileSync("postman/journey.json", "utf8"));
        col.item.push({ name: "Clients and measurements", item: journey.map(journeyItem) });
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
