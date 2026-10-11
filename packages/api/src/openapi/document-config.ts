/** Fixed header of the OpenAPI document, so the output never changes between runs. */
import type { OpenAPIHono } from "@hono/zod-openapi";

/** Configuration object accepted by the OpenAPI document builder. */
type OpenAPIObjectConfig = Parameters<OpenAPIHono["getOpenAPI31Document"]>[0];

/** Version, title and server list written into every generated document. */
export const OPENAPI_DOCUMENT_CONFIG: OpenAPIObjectConfig = {
  openapi: "3.1.0",
  info: { title: "Tafsila API", version: "1" },
  servers: [{ url: "/" }],
};
