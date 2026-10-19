/** Design routes: create, list, read, rename and delete the signed-in user's designs. Each route validates, calls one use case, maps the result. */
import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import {
  createDesignInputSchema,
  designDetailSchema,
  designPageSchema,
  designSchema,
  listDesignsQuerySchema,
  updateDesignInputSchema,
} from "@tafsila/schemas";
import type { Container } from "../container";
import { requireAuth, type AuthedEnv } from "../middleware/auth";
import { errorResponses } from "../openapi/responses";
import { HTTP_CREATED, HTTP_NO_CONTENT, HTTP_OK } from "../openapi/status";
import { createDesign } from "../services/create-design";
import { deleteDesign } from "../services/delete-design";
import { getDesign } from "../services/get-design";
import { listDesigns } from "../services/list-designs";
import { renameDesign } from "../services/rename-design";
import { jsonContent } from "./json-content";

/** Path parameter shared by the routes that address one design. */
const idParams = z.object({ id: z.uuid().meta({ example: "00000000-0000-4000-8000-0000000000d1" }) });

/** Bearer security requirement shared by every route here. */
const SECURITY = [{ bearerAuth: [] }];

/**
 * Describes POST /designs.
 *
 * @param c - Dependencies (token verifier).
 * @returns The route definition.
 */
const createDesignRoute = (c: Container) =>
  createRoute({
    method: "post",
    path: "/designs",
    tags: ["designs"],
    summary: "Create a design (untitled designs are named from the category and date)",
    security: SECURITY,
    middleware: [requireAuth(c.tokenVerifier)] as const,
    request: { body: { ...jsonContent(createDesignInputSchema), required: true } },
    responses: {
      [HTTP_CREATED]: { description: "The new design", ...jsonContent(designSchema) },
      ...errorResponses("VALIDATION_FAILED", "UNAUTHENTICATED", "FORBIDDEN", "INTERNAL_ERROR"),
    },
  });

/**
 * Describes GET /designs.
 *
 * @param c - Dependencies (token verifier).
 * @returns The route definition.
 */
const listRoute = (c: Container) =>
  createRoute({
    method: "get",
    path: "/designs",
    tags: ["designs"],
    summary: "List designs (most recently updated first) with title search, client filter and paging",
    security: SECURITY,
    middleware: [requireAuth(c.tokenVerifier)] as const,
    request: { query: listDesignsQuerySchema },
    responses: {
      [HTTP_OK]: {
        description: "One page of designs with their summaries",
        ...jsonContent(designPageSchema),
      },
      ...errorResponses("VALIDATION_FAILED", "UNAUTHENTICATED", "INTERNAL_ERROR"),
    },
  });

/**
 * Describes GET /designs/{id}.
 *
 * @param c - Dependencies (token verifier).
 * @returns The route definition.
 */
const getRoute = (c: Container) =>
  createRoute({
    method: "get",
    path: "/designs/{id}",
    tags: ["designs"],
    summary: "Read one design with its current version's stored inputs",
    security: SECURITY,
    middleware: [requireAuth(c.tokenVerifier)] as const,
    request: { params: idParams },
    responses: {
      [HTTP_OK]: { description: "The design and its current version", ...jsonContent(designDetailSchema) },
      ...errorResponses("VALIDATION_FAILED", "UNAUTHENTICATED", "NOT_FOUND", "INTERNAL_ERROR"),
    },
  });

/**
 * Describes PATCH /designs/{id}.
 *
 * @param c - Dependencies (token verifier).
 * @returns The route definition.
 */
const patchRoute = (c: Container) =>
  createRoute({
    method: "patch",
    path: "/designs/{id}",
    tags: ["designs"],
    summary: "Rename a design",
    security: SECURITY,
    middleware: [requireAuth(c.tokenVerifier)] as const,
    request: { params: idParams, body: { ...jsonContent(updateDesignInputSchema), required: true } },
    responses: {
      [HTTP_OK]: { description: "The updated design", ...jsonContent(designSchema) },
      ...errorResponses("VALIDATION_FAILED", "UNAUTHENTICATED", "NOT_FOUND", "INTERNAL_ERROR"),
    },
  });

/**
 * Describes DELETE /designs/{id}.
 *
 * @param c - Dependencies (token verifier).
 * @returns The route definition.
 */
const deleteRoute = (c: Container) =>
  createRoute({
    method: "delete",
    path: "/designs/{id}",
    tags: ["designs"],
    summary: "Delete a design and its versions",
    security: SECURITY,
    middleware: [requireAuth(c.tokenVerifier)] as const,
    request: { params: idParams },
    responses: {
      [HTTP_NO_CONTENT]: { description: "Deleted" },
      ...errorResponses("VALIDATION_FAILED", "UNAUTHENTICATED", "NOT_FOUND", "INTERNAL_ERROR"),
    },
  });

/**
 * Creates the /designs routes behind requireAuth.
 *
 * @param container - Dependencies (token verifier, design and profile repositories, clock).
 * @returns A sub-app serving the five design routes.
 */
export function designRoutes(container: Container): OpenAPIHono<AuthedEnv> {
  return new OpenAPIHono<AuthedEnv>()
    .openapi(createDesignRoute(container), async (c) =>
      c.json(await createDesign(container, c.get("auth"), c.req.valid("json")), HTTP_CREATED),
    )
    .openapi(listRoute(container), async (c) =>
      c.json(await listDesigns(container, c.get("auth"), c.req.valid("query")), HTTP_OK),
    )
    .openapi(getRoute(container), async (c) =>
      c.json(await getDesign(container, c.get("auth"), c.req.valid("param").id), HTTP_OK),
    )
    .openapi(patchRoute(container), async (c) =>
      c.json(
        await renameDesign(container, c.get("auth"), c.req.valid("param").id, c.req.valid("json")),
        HTTP_OK,
      ),
    )
    .openapi(deleteRoute(container), async (c) => {
      await deleteDesign(container, c.get("auth"), c.req.valid("param").id);
      return c.body(null, HTTP_NO_CONTENT);
    });
}
