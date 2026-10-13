/** Size chart routes (FR-MEAS-01): the default chart the measurement form starts from. */
import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import { sizeChartResponseSchema } from "@tafsila/schemas";
import type { Container } from "../container";
import { requireAuth, type AuthedEnv } from "../middleware/auth";
import { errorResponses } from "../openapi/responses";
import { HTTP_OK } from "../openapi/status";
import { getDefaultSizeChart } from "../services/get-default-size-chart";
import { jsonContent } from "./json-content";

/**
 * Describes GET /size-charts/default.
 *
 * @param c - Dependencies (token verifier).
 * @returns The route definition.
 */
const defaultRoute = (c: Container) =>
  createRoute({
    method: "get",
    path: "/size-charts/default",
    tags: ["size-charts"],
    summary: "Read the default size chart (every size, measurements in millimetres)",
    security: [{ bearerAuth: [] }],
    middleware: [requireAuth(c.tokenVerifier)] as const,
    responses: {
      [HTTP_OK]: { description: "The default chart", ...jsonContent(sizeChartResponseSchema) },
      ...errorResponses("UNAUTHENTICATED", "SIZE_CHART_NOT_FOUND", "INTERNAL_ERROR"),
    },
  });

/**
 * Creates the /size-charts routes behind requireAuth.
 *
 * @param container - Dependencies (token verifier, size chart repository).
 * @returns A sub-app serving GET /size-charts/default.
 */
export function sizeChartRoutes(container: Container): OpenAPIHono<AuthedEnv> {
  return new OpenAPIHono<AuthedEnv>().openapi(defaultRoute(container), async (c) =>
    c.json(await getDefaultSizeChart(container, c.get("auth")), HTTP_OK),
  );
}
