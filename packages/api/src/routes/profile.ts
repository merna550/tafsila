/** Profile routes (FR-AUTH-04): read and change the signed-in user's name and language. Each validates, calls one use case, maps the result. */
import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import { profileSchema, updateProfileInputSchema } from "@tafsila/schemas";
import type { Container } from "../container";
import { requireAuth, type AuthedEnv } from "../middleware/auth";
import { errorResponses } from "../openapi/responses";
import { HTTP_OK } from "../openapi/status";
import { getProfile } from "../services/get-profile";
import { updateProfile } from "../services/update-profile";
import { jsonContent } from "./json-content";

/** Bearer security requirement shared by every route here. */
const SECURITY = [{ bearerAuth: [] }];

/**
 * Describes GET /profile.
 *
 * @param c - Dependencies.
 * @returns The route definition.
 */
const getRoute = (c: Container) =>
  createRoute({
    method: "get",
    path: "/profile",
    tags: ["profile"],
    summary: "Name, language and email of the signed-in user",
    security: SECURITY,
    middleware: [requireAuth(c.tokenVerifier)] as const,
    responses: {
      [HTTP_OK]: { description: "The profile", ...jsonContent(profileSchema) },
      ...errorResponses("UNAUTHENTICATED", "NOT_FOUND", "INTERNAL_ERROR"),
    },
  });

/**
 * Describes PATCH /profile.
 *
 * @param c - Dependencies.
 * @returns The route definition.
 */
const patchRoute = (c: Container) =>
  createRoute({
    method: "patch",
    path: "/profile",
    tags: ["profile"],
    summary: "Change the name and/or language of the signed-in user",
    security: SECURITY,
    middleware: [requireAuth(c.tokenVerifier)] as const,
    request: { body: { ...jsonContent(updateProfileInputSchema), required: true } },
    responses: {
      [HTTP_OK]: { description: "The updated profile", ...jsonContent(profileSchema) },
      ...errorResponses("VALIDATION_FAILED", "UNAUTHENTICATED", "NOT_FOUND", "INTERNAL_ERROR"),
    },
  });

/**
 * Creates the /profile routes behind requireAuth.
 *
 * @param container - Dependencies (token verifier, profile repository, analytics).
 * @returns A sub-app serving GET and PATCH /profile.
 */
export function profileRoutes(container: Container): OpenAPIHono<AuthedEnv> {
  return new OpenAPIHono<AuthedEnv>()
    .openapi(getRoute(container), async (c) => c.json(await getProfile(container, c.get("auth")), HTTP_OK))
    .openapi(patchRoute(container), async (c) =>
      c.json(await updateProfile(container, c.get("auth"), c.req.valid("json")), HTTP_OK),
    );
}
