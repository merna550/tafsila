/** Account route (FR-AUTH-05): delete the signed-in user's account and all personal data. The account always comes from the token. */
import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import { deleteAccountInputSchema } from "@tafsila/schemas";
import type { Container } from "../container";
import { requireAuth, type AuthedEnv } from "../middleware/auth";
import { errorResponses } from "../openapi/responses";
import { HTTP_NO_CONTENT } from "../openapi/status";
import { deleteAccount } from "../services/delete-account";
import { jsonContent } from "./json-content";

/**
 * Describes DELETE /account.
 *
 * @param c - Dependencies.
 * @returns The route definition.
 */
const deleteRoute = (c: Container) =>
  createRoute({
    method: "delete",
    path: "/account",
    tags: ["account"],
    summary: "Delete the signed-in account and all its personal data (irreversible)",
    description:
      "Removes stored files, the analytics person, the sign-in account and (by cascade) profile, clients and measurement sets. " +
      "The hashed trial phone stays so the same number never gets a second free trial. Safe to repeat after a failure. " +
      "Admin accounts are refused.",
    security: [{ bearerAuth: [] }],
    middleware: [requireAuth(c.tokenVerifier)] as const,
    request: { body: { ...jsonContent(deleteAccountInputSchema), required: true } },
    responses: {
      [HTTP_NO_CONTENT]: { description: "Deleted" },
      ...errorResponses("VALIDATION_FAILED", "UNAUTHENTICATED", "ACCOUNT_DELETE_FORBIDDEN", "INTERNAL_ERROR"),
    },
  });

/**
 * Creates DELETE /account behind requireAuth.
 *
 * @param container - Dependencies (token verifier and the deletion ports).
 * @returns A sub-app serving DELETE /account.
 */
export function accountRoutes(container: Container): OpenAPIHono<AuthedEnv> {
  return new OpenAPIHono<AuthedEnv>().openapi(deleteRoute(container), async (c) => {
    await deleteAccount(container, c.get("auth"), c.get("requestId"));
    return c.body(null, HTTP_NO_CONTENT);
  });
}
