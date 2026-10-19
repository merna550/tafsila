import { createRoute, z } from "@hono/zod-openapi";
import { describe, expect, it } from "vitest";
import { createApp } from "../app";
import { createContainer } from "../container";
import { buildOpenApiDocument, renderOpenApiDocument } from "./document";

type Doc = {
  openapi: string;
  paths: Record<string, Record<string, Record<string, unknown>>>;
  components: { securitySchemes: Record<string, unknown> };
};
const doc = buildOpenApiDocument() as Doc;
type Schema = { properties: Record<string, { example?: string }> };
const responseSchema = (path: string, status: string): Schema =>
  (
    doc.paths[path]!.get!.responses as Record<string, { content: { "application/json": { schema: Schema } } }>
  )[status]!.content["application/json"].schema;
const ERROR_KEYS = ["code", "message_ar", "message_en", "request_id"];

describe("OpenAPI document", () => {
  it("is OpenAPI 3.1 and lists exactly the API routes", () => {
    expect(doc.openapi).toBe("3.1.0");
    expect(Object.keys(doc.paths).sort((a, b) => a.localeCompare(b))).toEqual([
      "/api/account",
      "/api/admin/size-charts/default",
      "/api/admin/stats",
      "/api/admin/users",
      "/api/admin/users/{id}",
      "/api/clients",
      "/api/clients/{id}",
      "/api/debug/error",
      "/api/designs",
      "/api/designs/{id}",
      "/api/health",
      "/api/me",
      "/api/measurements",
      "/api/measurements/{id}",
      "/api/phone",
      "/api/phone/code",
      "/api/phone/verify",
      "/api/profile",
      "/api/size-charts/default",
    ]);
  });

  it("documents the account deletion with its 403 and 204 responses and the profile operations", () => {
    expect(
      Object.keys(doc.paths["/api/account"]!.delete!.responses as object).sort((a, b) => a.localeCompare(b)),
    ).toEqual(["204", "400", "401", "403", "500"]);
    expect(Object.keys(doc.paths["/api/profile"]!).sort((a, b) => a.localeCompare(b))).toEqual([
      "get",
      "patch",
    ]);
  });

  it("lists the ten client and measurement operations and the MEASUREMENTS_INVALID response", () => {
    const operations = Object.entries(doc.paths)
      .filter(([path]) => path.startsWith("/api/clients") || path.startsWith("/api/measurements"))
      .flatMap(([path, item]) => Object.keys(item).map((method) => `${method.toUpperCase()} ${path}`))
      .sort((a, b) => a.localeCompare(b));
    expect(operations).toEqual([
      "DELETE /api/clients/{id}",
      "DELETE /api/measurements/{id}",
      "GET /api/clients",
      "GET /api/clients/{id}",
      "GET /api/measurements",
      "GET /api/measurements/{id}",
      "PATCH /api/clients/{id}",
      "POST /api/clients",
      "POST /api/measurements",
      "PUT /api/measurements/{id}",
    ]);
    const post = doc.paths["/api/measurements"]!.post!;
    expect(Object.keys(post.responses as object)).toContain("422");
  });

  it("documents bearer auth on /api/me with the standard 401 body", () => {
    expect(doc.components.securitySchemes.bearerAuth).toEqual({
      type: "http",
      scheme: "bearer",
      bearerFormat: "JWT",
    });
    const me = doc.paths["/api/me"]!.get!;
    expect(me.security).toEqual([{ bearerAuth: [] }]);
    const schema = responseSchema("/api/me", "401");
    for (const key of ERROR_KEYS) expect(Object.keys(schema.properties)).toContain(key);
  });

  it("documents the health fields with examples", () => {
    const schema = responseSchema("/api/health", "200");
    expect(Object.keys(schema.properties)).toEqual(["status", "environment", "version", "gitSha", "time"]);
    expect(schema.properties.version?.example).toBe("1.2.3");
  });

  it("is byte-stable between runs", () => {
    expect(renderOpenApiDocument()).toBe(renderOpenApiDocument());
  });
});

describe("OpenAPI routes", () => {
  const appFor = (environment: string) =>
    createApp(createContainer({ appInfo: { environment, version: "1", gitSha: "x" } }));

  it("GET /api/openapi.json serves the same document", async () => {
    const res = await appFor("test").request("/api/openapi.json");
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual(buildOpenApiDocument());
  });

  it("GET /api/docs is HTML outside production and 404 in production", async () => {
    const res = await appFor("test").request("/api/docs");
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/html");
    expect((await appFor("production").request("/api/docs")).status).toBe(404);
  });
});

describe("request validation hook", () => {
  it("turns a Zod failure into the standard VALIDATION_FAILED body", async () => {
    const probe = createApp(createContainer());
    const route = createRoute({
      method: "post",
      path: "/probe",
      request: { body: { content: { "application/json": { schema: z.object({ name: z.string() }) } } } },
      responses: { 200: { description: "ok" } },
    });
    probe.openapi(route, (c) => c.json({ ok: true }, 200));
    const res = await probe.request("/api/probe", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: 5 }),
    });
    expect(res.status).toBe(400);
    const body = (await res.json()) as { code: string; details: { fields: Record<string, string> } };
    expect(body.code).toBe("VALIDATION_FAILED");
    expect(Object.keys(body.details.fields)).toContain("name");
  });
});
