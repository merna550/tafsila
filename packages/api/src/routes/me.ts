/** Current-user route: the first protected endpoint; it returns who the verified token says you are. */
import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import { meResponseSchema, type MeResponse } from "@tafsila/schemas";
import type { Container } from "../container";
import { requireAuth, type AuthedEnv } from "../middleware/auth";
import { HTTP_OK } from "../openapi/status";
import { errorResponses } from "../openapi/responses";

/**
 * Describes GET /me for routing and for the OpenAPI document.
 *
 * @param container - Dependencies (token verifier).
 * @returns The route definition.
 */
const meRoute = (container: Container) =>
  createRoute({
    method: "get",
    path: "/me",
    tags: ["auth"],
    summary: "Who the verified access token says you are",
    security: [{ bearerAuth: [] }],
    middleware: [requireAuth(container.tokenVerifier)] as const,
    responses: {
      [HTTP_OK]: {
        description: "The signed-in user",
        content: { "application/json": { schema: meResponseSchema } },
      },
      ...errorResponses("UNAUTHENTICATED", "INTERNAL_ERROR"),
    },
  });

/**
 * Creates GET /me behind requireAuth.
 *
 * @param container - Dependencies (token verifier).
 * @returns A sub-app serving GET /me.
 */
export function meRoutes(container: Container): OpenAPIHono<AuthedEnv> {
  return new OpenAPIHono<AuthedEnv>().openapi(meRoute(container), (c) => {
    const { userId, role } = c.get("auth");
    const body: MeResponse = { userId, role };
    return c.json(body, HTTP_OK);
  });
}
