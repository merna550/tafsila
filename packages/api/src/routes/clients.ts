/** Client routes (FR-MEAS-04): CRUD for the signed-in user's clients. Each route validates, calls one use case, maps the result. */
import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import {
  clientPageSchema,
  clientSchema,
  createClientInputSchema,
  listClientsQuerySchema,
  updateClientInputSchema,
} from "@tafsila/schemas";
import type { Container } from "../container";
import { requireAuth, type AuthedEnv } from "../middleware/auth";
import { errorResponses } from "../openapi/responses";
import { HTTP_CREATED, HTTP_NO_CONTENT, HTTP_OK } from "../openapi/status";
import { createClient } from "../services/create-client";
import { deleteClient } from "../services/delete-client";
import { getClient } from "../services/get-client";
import { listClients } from "../services/list-clients";
import { updateClient } from "../services/update-client";
import { jsonContent } from "./json-content";

/** Path parameter shared by the routes that address one client. */
const idParams = z.object({ id: z.uuid().meta({ example: "00000000-0000-4000-8000-0000000000a1" }) });

/** Bearer security requirement shared by every route here. */
const SECURITY = [{ bearerAuth: [] }];

/**
 * Describes POST /clients.
 *
 * @param c - Dependencies (token verifier).
 * @returns The route definition.
 */
const createClientRoute = (c: Container) =>
  createRoute({
    method: "post",
    path: "/clients",
    tags: ["clients"],
    summary: "Create a client",
    security: SECURITY,
    middleware: [requireAuth(c.tokenVerifier)] as const,
    request: { body: { ...jsonContent(createClientInputSchema), required: true } },
    responses: {
      [HTTP_CREATED]: { description: "The new client", ...jsonContent(clientSchema) },
      ...errorResponses("VALIDATION_FAILED", "UNAUTHENTICATED", "FORBIDDEN", "INTERNAL_ERROR"),
    },
  });

/**
 * Describes GET /clients.
 *
 * @param c - Dependencies (token verifier).
 * @returns The route definition.
 */
const listRoute = (c: Container) =>
  createRoute({
    method: "get",
    path: "/clients",
    tags: ["clients"],
    summary: "List clients (newest first) with name search and paging",
    security: SECURITY,
    middleware: [requireAuth(c.tokenVerifier)] as const,
    request: { query: listClientsQuerySchema },
    responses: {
      [HTTP_OK]: { description: "One page of clients", ...jsonContent(clientPageSchema) },
      ...errorResponses("VALIDATION_FAILED", "UNAUTHENTICATED", "INTERNAL_ERROR"),
    },
  });

/**
 * Describes GET /clients/{id}.
 *
 * @param c - Dependencies (token verifier).
 * @returns The route definition.
 */
const getRoute = (c: Container) =>
  createRoute({
    method: "get",
    path: "/clients/{id}",
    tags: ["clients"],
    summary: "Read one client",
    security: SECURITY,
    middleware: [requireAuth(c.tokenVerifier)] as const,
    request: { params: idParams },
    responses: {
      [HTTP_OK]: { description: "The client", ...jsonContent(clientSchema) },
      ...errorResponses("VALIDATION_FAILED", "UNAUTHENTICATED", "NOT_FOUND", "INTERNAL_ERROR"),
    },
  });

/**
 * Describes PATCH /clients/{id}.
 *
 * @param c - Dependencies (token verifier).
 * @returns The route definition.
 */
const patchRoute = (c: Container) =>
  createRoute({
    method: "patch",
    path: "/clients/{id}",
    tags: ["clients"],
    summary: "Change a client's name and/or notes",
    security: SECURITY,
    middleware: [requireAuth(c.tokenVerifier)] as const,
    request: { params: idParams, body: { ...jsonContent(updateClientInputSchema), required: true } },
    responses: {
      [HTTP_OK]: { description: "The updated client", ...jsonContent(clientSchema) },
      ...errorResponses("VALIDATION_FAILED", "UNAUTHENTICATED", "NOT_FOUND", "INTERNAL_ERROR"),
    },
  });

/**
 * Describes DELETE /clients/{id}.
 *
 * @param c - Dependencies (token verifier).
 * @returns The route definition.
 */
const deleteRoute = (c: Container) =>
  createRoute({
    method: "delete",
    path: "/clients/{id}",
    tags: ["clients"],
    summary: "Delete a client and its measurement sets",
    security: SECURITY,
    middleware: [requireAuth(c.tokenVerifier)] as const,
    request: { params: idParams },
    responses: {
      [HTTP_NO_CONTENT]: { description: "Deleted" },
      ...errorResponses("VALIDATION_FAILED", "UNAUTHENTICATED", "NOT_FOUND", "INTERNAL_ERROR"),
    },
  });

/**
 * Creates the /clients routes behind requireAuth.
 *
 * @param container - Dependencies (token verifier, client repository, plan limits).
 * @returns A sub-app serving the five client routes.
 */
export function clientRoutes(container: Container): OpenAPIHono<AuthedEnv> {
  return new OpenAPIHono<AuthedEnv>()
    .openapi(createClientRoute(container), async (c) =>
      c.json(await createClient(container, c.get("auth"), c.req.valid("json")), HTTP_CREATED),
    )
    .openapi(listRoute(container), async (c) =>
      c.json(await listClients(container, c.get("auth"), c.req.valid("query")), HTTP_OK),
    )
    .openapi(getRoute(container), async (c) =>
      c.json(await getClient(container, c.get("auth"), c.req.valid("param").id), HTTP_OK),
    )
    .openapi(patchRoute(container), async (c) =>
      c.json(
        await updateClient(container, c.get("auth"), c.req.valid("param").id, c.req.valid("json")),
        HTTP_OK,
      ),
    )
    .openapi(deleteRoute(container), async (c) => {
      await deleteClient(container, c.get("auth"), c.req.valid("param").id);
      return c.body(null, HTTP_NO_CONTENT);
    });
}
