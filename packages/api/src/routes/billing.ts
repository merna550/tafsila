/** Billing read routes for the signed-in user: the credit balance with the plan limits, and the products on sale (FR-BILL-02, FR-BILL-03). */
import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import { creditsResponseSchema, productsResponseSchema } from "@tafsila/schemas";
import type { Container } from "../container";
import { requireAuth, type AuthedEnv } from "../middleware/auth";
import { errorResponses } from "../openapi/responses";
import { HTTP_OK } from "../openapi/status";
import { getCredits } from "../services/get-credits";
import { listProducts } from "../services/list-products";
import { jsonContent } from "./json-content";

/** Bearer security requirement shared by every route here. */
const SECURITY = [{ bearerAuth: [] }];

/**
 * Describes GET /me/credits.
 *
 * @param c - Dependencies (token verifier).
 * @returns The route definition.
 */
const creditsRoute = (c: Container) =>
  createRoute({
    method: "get",
    path: "/me/credits",
    tags: ["billing"],
    summary:
      "Credit balance, grants with their expiry, the active plan and the plan limits; grants the free trial first when a verified user never got it",
    security: SECURITY,
    middleware: [requireAuth(c.tokenVerifier)] as const,
    responses: {
      [HTTP_OK]: { description: "Credits and limits", ...jsonContent(creditsResponseSchema) },
      ...errorResponses("UNAUTHENTICATED", "INTERNAL_ERROR"),
    },
  });

/**
 * Describes GET /billing/products.
 *
 * @param c - Dependencies (token verifier).
 * @returns The route definition.
 */
const productsRoute = (c: Container) =>
  createRoute({
    method: "get",
    path: "/billing/products",
    tags: ["billing"],
    summary: "Active products (prices in piastres), cheapest first",
    security: SECURITY,
    middleware: [requireAuth(c.tokenVerifier)] as const,
    responses: {
      [HTTP_OK]: { description: "The products on sale", ...jsonContent(productsResponseSchema) },
      ...errorResponses("UNAUTHENTICATED", "INTERNAL_ERROR"),
    },
  });

/**
 * Creates the billing read routes behind requireAuth.
 *
 * @param container - Dependencies.
 * @returns A sub-app serving the two routes.
 */
export function billingRoutes(container: Container): OpenAPIHono<AuthedEnv> {
  return new OpenAPIHono<AuthedEnv>()
    .openapi(creditsRoute(container), async (c) =>
      c.json(await getCredits(container, c.get("auth")), HTTP_OK),
    )
    .openapi(productsRoute(container), async (c) =>
      c.json(await listProducts(container.billing, c.get("auth")), HTTP_OK),
    );
}
