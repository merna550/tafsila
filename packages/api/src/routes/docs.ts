/** Serves the Scalar viewer page for /api/openapi.json (outside production only). */
import { Hono } from "hono";
import type { Container } from "../container";
import type { AppEnv } from "../middleware/request-id";

/** Version-pinned Scalar viewer loaded from jsDelivr. */
const SCALAR_SCRIPT = "https://cdn.jsdelivr.net/npm/@scalar/api-reference@1.25.0";

/** HTML page that renders /api/openapi.json with Scalar. */
const DOCS_PAGE = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Tafsila API</title>
  </head>
  <body>
    <script id="api-reference" data-url="/api/openapi.json"></script>
    <script src="${SCALAR_SCRIPT}"></script>
  </body>
</html>
`;

/**
 * Creates GET /docs (not in production); it is not part of the OpenAPI document.
 *
 * @param container - Dependencies (environment name).
 * @returns A sub-app.
 */
export function docsRoutes(container: Container): Hono<AppEnv> {
  const app = new Hono<AppEnv>();
  if (container.appInfo.environment !== "production") app.get("/docs", (c) => c.html(DOCS_PAGE));
  return app;
}
