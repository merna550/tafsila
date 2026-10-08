/** Health route: liveness check used by Docker HEALTHCHECK, CI smoke tests and uptime monitors. */
import { Hono } from "hono";
import type { Container } from "../container";

/**
 * Creates the /health route; it never calls external services so it stays fast and reliable.
 *
 * @param container - Dependencies (clock and build info).
 * @returns A Hono sub-app serving GET /health.
 */
export function healthRoutes(container: Container): Hono {
  return new Hono().get("/health", (c) =>
    c.json({
      status: "ok",
      environment: container.appInfo.environment,
      version: container.appInfo.version,
      gitSha: container.appInfo.gitSha,
      time: container.clock.now().toISOString(),
    }),
  );
}
