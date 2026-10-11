/** Health route: liveness check used by Docker HEALTHCHECK, CI smoke tests and uptime monitors. */
import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import { healthResponseSchema, type HealthResponse } from "@tafsila/schemas";
import type { Container } from "../container";
import type { AppEnv } from "../middleware/request-id";
import { HTTP_OK } from "../openapi/status";
import { errorResponses } from "../openapi/responses";

const healthRoute = createRoute({
  method: "get",
  path: "/health",
  tags: ["system"],
  summary: "Liveness check with build information",
  responses: {
    [HTTP_OK]: {
      description: "The API is up",
      content: { "application/json": { schema: healthResponseSchema } },
    },
    ...errorResponses("INTERNAL_ERROR"),
  },
});

/**
 * Creates the /health route; it never calls external services so it stays fast and reliable.
 *
 * @param container - Dependencies (clock and build info).
 * @returns A sub-app serving GET /health.
 */
export function healthRoutes(container: Container): OpenAPIHono<AppEnv> {
  return new OpenAPIHono<AppEnv>().openapi(healthRoute, (c) => {
    const body: HealthResponse = {
      status: "ok",
      environment: container.appInfo.environment,
      version: container.appInfo.version,
      gitSha: container.appInfo.gitSha,
      time: container.clock.now().toISOString(),
    };
    return c.json(body, HTTP_OK);
  });
}
