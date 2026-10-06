/** Builds the Tafsila HTTP API (Hono). Mounted by Next.js at /api today; can run standalone later (ADR-005). */
import { Hono } from "hono";
import { createContainer, type Container } from "./container";
import { NotFoundError } from "./domain/errors";
import { handleError } from "./middleware/error-handler";
import { healthRoutes } from "./routes/health";

/**
 * Creates the API application with all routes and the shared error handling.
 *
 * @param container - Dependencies; defaults to the real adapters for this environment.
 * @returns The Hono app with base path /api.
 */
export function createApp(container: Container = createContainer()): Hono {
  const app = new Hono().basePath("/api");
  app.route("/", healthRoutes(container));
  app.notFound(() => {
    throw new NotFoundError("route");
  });
  app.onError(handleError);
  return app;
}
