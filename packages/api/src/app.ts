/** Builds the Tafsila HTTP API (Hono). Mounted by Next.js at /api today; can run standalone later (ADR-005). */
import { OpenAPIHono } from "@hono/zod-openapi";
import { createContainer, type Container } from "./container";
import { NotFoundError, ValidationError } from "./domain/errors";
import { createErrorHandler } from "./middleware/error-handler";
import { requestId, type AppEnv } from "./middleware/request-id";
import { adminRoutes } from "./routes/admin";
import { adminFabricRoutes } from "./routes/admin-fabrics";
import { fabricRoutes } from "./routes/fabrics";
import { accountRoutes } from "./routes/account";
import { clientRoutes } from "./routes/clients";
import { designRoutes } from "./routes/designs";
import { patternVersionRoutes } from "./routes/pattern-versions";
import { measurementRoutes } from "./routes/measurements";
import { sizeChartRoutes } from "./routes/size-charts";
import { debugRoutes } from "./routes/debug";
import { OPENAPI_DOCUMENT_CONFIG } from "./openapi/document-config";
import { docsRoutes } from "./routes/docs";
import { healthRoutes } from "./routes/health";
import { meRoutes } from "./routes/me";
import { phoneRoutes } from "./routes/phone";
import { profileRoutes } from "./routes/profile";

/** Name of the bearer security scheme used by protected routes in the OpenAPI document. */
export const BEARER_SCHEME = "bearerAuth";

/**
 * Creates the API application with all routes and the shared error handling.
 *
 * @param container - Dependencies; defaults to the real adapters for this environment.
 * @returns The OpenAPI-aware Hono app with base path /api.
 */
export function createApp(container: Container = createContainer()): OpenAPIHono<AppEnv> {
  const app = new OpenAPIHono<AppEnv>({
    defaultHook: (result) => {
      if (result.success) return;
      const fields: Record<string, string> = {};
      for (const issue of result.error.issues) fields[issue.path.join(".") || "body"] = issue.message;
      throw new ValidationError(fields);
    },
  }).basePath("/api");
  app.openAPIRegistry.registerComponent("securitySchemes", BEARER_SCHEME, {
    type: "http",
    scheme: "bearer",
    bearerFormat: "JWT",
  });
  app.use(requestId());
  app.route("/", healthRoutes(container));
  app.route("/", meRoutes(container));
  app.route("/", clientRoutes(container));
  app.route("/", designRoutes(container));
  app.route("/", patternVersionRoutes(container));
  app.route("/", measurementRoutes(container));
  app.route("/", sizeChartRoutes(container));
  app.route("/", phoneRoutes(container));
  app.route("/", profileRoutes(container));
  app.route("/", accountRoutes(container));
  app.route("/", adminRoutes(container));
  app.route("/", adminFabricRoutes(container));
  app.route("/", fabricRoutes(container));
  app.doc31("/openapi.json", OPENAPI_DOCUMENT_CONFIG);
  app.route("/", docsRoutes(container));
  if (container.appInfo.environment !== "production") app.route("/", debugRoutes(container));
  app.notFound(() => {
    throw new NotFoundError("route");
  });
  app.onError(createErrorHandler(container.errorReporter));
  return app;
}
