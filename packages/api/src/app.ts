/** Builds the Tafsila HTTP API (Hono). Mounted by Next.js at /api today; can run standalone later (ADR-005). */
import { Hono } from "hono";
import { createContainer, type Container } from "./container";
import { NotFoundError } from "./domain/errors";
import { createErrorHandler } from "./middleware/error-handler";
import { requestId, type AppEnv } from "./middleware/request-id";
import { debugRoutes } from "./routes/debug";
import { healthRoutes } from "./routes/health";

/**
 * Creates the API application with all routes and the shared error handling.
 *
 * @param container - Dependencies; defaults to the real adapters for this environment.
 * @returns The Hono app with base path /api.
 */
export function createApp(container: Container = createContainer()): Hono<AppEnv> {
  const app = new Hono<AppEnv>().basePath("/api");
  app.use(requestId());
  app.route("/", healthRoutes(container));
  if (container.appInfo.environment !== "production") app.route("/", debugRoutes(container));
  app.notFound(() => {
    throw new NotFoundError("route");
  });
  app.onError(createErrorHandler(container.errorReporter));
  return app;
}
