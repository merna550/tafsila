/** Debug route that proves errors reach Sentry; mounted only outside production. */
import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import type { Container } from "../container";
import { AppError } from "../domain/errors";
import type { AppEnv } from "../middleware/request-id";
import { HTTP_OK } from "../openapi/status";
import { errorResponses } from "../openapi/responses";

/** Minimum time between two debug errors on one instance (protects the free Sentry quota). */
export const DEBUG_ERROR_INTERVAL_MS = 60_000;

const debugRoute = createRoute({
  method: "get",
  path: "/debug/error",
  tags: ["debug"],
  summary: "Throws a test error (only mounted outside production)",
  responses: {
    [HTTP_OK]: { description: "Never returned", content: { "application/json": { schema: z.object({}) } } },
    ...errorResponses("RATE_LIMITED", "INTERNAL_ERROR"),
  },
});

/**
 * Creates GET /debug/error: throws a unique error, at most once a minute per instance.
 *
 * @param container - Dependencies (clock).
 * @returns A sub-app.
 */
export function debugRoutes(container: Container): OpenAPIHono<AppEnv> {
  let lastThrownAt = 0;
  return new OpenAPIHono<AppEnv>().openapi(debugRoute, () => {
    const now = container.clock.now().getTime();
    if (lastThrownAt !== 0 && now - lastThrownAt < DEBUG_ERROR_INTERVAL_MS) {
      throw new AppError("RATE_LIMITED", { messageEn: "Debug error already thrown, retry in a minute" });
    }
    lastThrownAt = now;
    throw new Error(`Debug test error ${crypto.randomUUID()}`);
  });
}
