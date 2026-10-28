/** Admin routes for the fabric catalogue and the recommendation rules (FR-REC-03, FR-ADM-02). Every route needs a signed-in admin; the database checks again and each write has an audit row. */
import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import {
  adminFabricListSchema,
  adminFabricRuleListSchema,
  adminFabricRuleSchema,
  adminFabricSchema,
  createFabricInputSchema,
  createFabricRuleInputSchema,
  updateFabricInputSchema,
  updateFabricRuleInputSchema,
} from "@tafsila/schemas";
import type { Container } from "../container";
import { requireAuth, requireRole, type AuthedEnv } from "../middleware/auth";
import { errorResponses } from "../openapi/responses";
import { HTTP_CREATED, HTTP_NO_CONTENT, HTTP_OK } from "../openapi/status";
import { createFabric } from "../services/create-fabric";
import { createFabricRule } from "../services/create-fabric-rule";
import { deleteFabric } from "../services/delete-fabric";
import { deleteFabricRule } from "../services/delete-fabric-rule";
import { listFabricRules } from "../services/list-fabric-rules";
import { listFabrics } from "../services/list-fabrics";
import { updateFabric } from "../services/update-fabric";
import { updateFabricRule } from "../services/update-fabric-rule";
import { jsonContent } from "./json-content";

/** Bearer security requirement shared by every route here. */
const SECURITY = [{ bearerAuth: [] }];

/** Path parameter of the routes that address one fabric. */
const fabricParams = z.object({ id: z.string().min(1).meta({ example: "crepe" }) });

/** Path parameter of the routes that address one rule. */
const ruleParams = z.object({ id: z.string().min(1).meta({ example: "circle-skirt-drape" }) });

/**
 * Describes GET /admin/fabrics.
 *
 * @param c - Dependencies (token verifier).
 * @returns The route definition.
 */
const listFabricRoute = (c: Container) =>
  createRoute({
    method: "get",
    path: "/admin/fabrics",
    tags: ["admin"],
    summary: "List the fabric catalogue with the review flag and last editor",
    security: SECURITY,
    middleware: [requireAuth(c.tokenVerifier), requireRole("admin")] as const,
    responses: {
      [HTTP_OK]: { description: "The catalogue", ...jsonContent(adminFabricListSchema) },
      ...errorResponses("UNAUTHENTICATED", "FORBIDDEN", "INTERNAL_ERROR"),
    },
  });

/**
 * Describes POST /admin/fabrics.
 *
 * @param c - Dependencies (token verifier).
 * @returns The route definition.
 */
const createFabricRoute = (c: Container) =>
  createRoute({
    method: "post",
    path: "/admin/fabrics",
    tags: ["admin"],
    summary: "Add a fabric (the fabric and its audit row are saved together)",
    security: SECURITY,
    middleware: [requireAuth(c.tokenVerifier), requireRole("admin")] as const,
    request: { body: { ...jsonContent(createFabricInputSchema), required: true } },
    responses: {
      [HTTP_CREATED]: { description: "The new fabric", ...jsonContent(adminFabricSchema) },
      ...errorResponses(
        "VALIDATION_FAILED",
        "UNAUTHENTICATED",
        "FORBIDDEN",
        "FABRIC_ID_TAKEN",
        "INTERNAL_ERROR",
      ),
    },
  });

/**
 * Describes PATCH /admin/fabrics/{id}.
 *
 * @param c - Dependencies (token verifier).
 * @returns The route definition.
 */
const updateFabricRoute = (c: Container) =>
  createRoute({
    method: "patch",
    path: "/admin/fabrics/{id}",
    tags: ["admin"],
    summary: "Change fields of a fabric (the fabric and its audit row are saved together)",
    security: SECURITY,
    middleware: [requireAuth(c.tokenVerifier), requireRole("admin")] as const,
    request: { params: fabricParams, body: { ...jsonContent(updateFabricInputSchema), required: true } },
    responses: {
      [HTTP_OK]: { description: "The changed fabric", ...jsonContent(adminFabricSchema) },
      ...errorResponses(
        "VALIDATION_FAILED",
        "UNAUTHENTICATED",
        "FORBIDDEN",
        "FABRIC_NOT_FOUND",
        "INTERNAL_ERROR",
      ),
    },
  });

/**
 * Describes DELETE /admin/fabrics/{id}.
 *
 * @param c - Dependencies (token verifier).
 * @returns The route definition.
 */
const removeFabricRoute = (c: Container) =>
  createRoute({
    method: "delete",
    path: "/admin/fabrics/{id}",
    tags: ["admin"],
    summary: "Delete a fabric (the delete and its audit row are saved together)",
    security: SECURITY,
    middleware: [requireAuth(c.tokenVerifier), requireRole("admin")] as const,
    request: { params: fabricParams },
    responses: {
      [HTTP_NO_CONTENT]: { description: "Deleted" },
      ...errorResponses("UNAUTHENTICATED", "FORBIDDEN", "FABRIC_NOT_FOUND", "INTERNAL_ERROR"),
    },
  });

/**
 * Describes GET /admin/fabric-rules.
 *
 * @param c - Dependencies (token verifier).
 * @returns The route definition.
 */
const listRuleRoute = (c: Container) =>
  createRoute({
    method: "get",
    path: "/admin/fabric-rules",
    tags: ["admin"],
    summary: "List the recommendation rules with the review flag and last editor",
    security: SECURITY,
    middleware: [requireAuth(c.tokenVerifier), requireRole("admin")] as const,
    responses: {
      [HTTP_OK]: { description: "The rules", ...jsonContent(adminFabricRuleListSchema) },
      ...errorResponses("UNAUTHENTICATED", "FORBIDDEN", "INTERNAL_ERROR"),
    },
  });

/**
 * Describes POST /admin/fabric-rules.
 *
 * @param c - Dependencies (token verifier).
 * @returns The route definition.
 */
const createRuleRoute = (c: Container) =>
  createRoute({
    method: "post",
    path: "/admin/fabric-rules",
    tags: ["admin"],
    summary: "Add a rule; unknown paths or values are refused (422 FABRIC_RULE_INVALID)",
    security: SECURITY,
    middleware: [requireAuth(c.tokenVerifier), requireRole("admin")] as const,
    request: { body: { ...jsonContent(createFabricRuleInputSchema), required: true } },
    responses: {
      [HTTP_CREATED]: { description: "The new rule", ...jsonContent(adminFabricRuleSchema) },
      ...errorResponses(
        "VALIDATION_FAILED",
        "UNAUTHENTICATED",
        "FORBIDDEN",
        "FABRIC_ID_TAKEN",
        "FABRIC_RULE_INVALID",
        "INTERNAL_ERROR",
      ),
    },
  });

/**
 * Describes PATCH /admin/fabric-rules/{id}.
 *
 * @param c - Dependencies (token verifier).
 * @returns The route definition.
 */
const updateRuleRoute = (c: Container) =>
  createRoute({
    method: "patch",
    path: "/admin/fabric-rules/{id}",
    tags: ["admin"],
    summary: "Change fields of a rule; the merged rule is checked (422 FABRIC_RULE_INVALID)",
    security: SECURITY,
    middleware: [requireAuth(c.tokenVerifier), requireRole("admin")] as const,
    request: { params: ruleParams, body: { ...jsonContent(updateFabricRuleInputSchema), required: true } },
    responses: {
      [HTTP_OK]: { description: "The changed rule", ...jsonContent(adminFabricRuleSchema) },
      ...errorResponses(
        "VALIDATION_FAILED",
        "UNAUTHENTICATED",
        "FORBIDDEN",
        "FABRIC_RULE_NOT_FOUND",
        "FABRIC_RULE_INVALID",
        "INTERNAL_ERROR",
      ),
    },
  });

/**
 * Describes DELETE /admin/fabric-rules/{id}.
 *
 * @param c - Dependencies (token verifier).
 * @returns The route definition.
 */
const removeRuleRoute = (c: Container) =>
  createRoute({
    method: "delete",
    path: "/admin/fabric-rules/{id}",
    tags: ["admin"],
    summary: "Delete a rule (the delete and its audit row are saved together)",
    security: SECURITY,
    middleware: [requireAuth(c.tokenVerifier), requireRole("admin")] as const,
    request: { params: ruleParams },
    responses: {
      [HTTP_NO_CONTENT]: { description: "Deleted" },
      ...errorResponses("UNAUTHENTICATED", "FORBIDDEN", "FABRIC_RULE_NOT_FOUND", "INTERNAL_ERROR"),
    },
  });

/**
 * Creates the /admin/fabrics and /admin/fabric-rules routes behind requireAuth and requireRole("admin").
 *
 * @param container - Dependencies (token verifier, catalogue and rule repositories).
 * @returns A sub-app serving the eight routes.
 */
export function adminFabricRoutes(container: Container): OpenAPIHono<AuthedEnv> {
  return new OpenAPIHono<AuthedEnv>()
    .openapi(listFabricRoute(container), async (c) =>
      c.json(await listFabrics(container, c.get("auth")), HTTP_OK),
    )
    .openapi(createFabricRoute(container), async (c) =>
      c.json(await createFabric(container, c.get("auth"), c.req.valid("json")), HTTP_CREATED),
    )
    .openapi(updateFabricRoute(container), async (c) =>
      c.json(
        await updateFabric(container, c.get("auth"), c.req.valid("param").id, c.req.valid("json")),
        HTTP_OK,
      ),
    )
    .openapi(removeFabricRoute(container), async (c) => {
      await deleteFabric(container, c.get("auth"), c.req.valid("param").id);
      return c.body(null, HTTP_NO_CONTENT);
    })
    .openapi(listRuleRoute(container), async (c) =>
      c.json(await listFabricRules(container, c.get("auth")), HTTP_OK),
    )
    .openapi(createRuleRoute(container), async (c) =>
      c.json(await createFabricRule(container, c.get("auth"), c.req.valid("json")), HTTP_CREATED),
    )
    .openapi(updateRuleRoute(container), async (c) =>
      c.json(
        await updateFabricRule(container, c.get("auth"), c.req.valid("param").id, c.req.valid("json")),
        HTTP_OK,
      ),
    )
    .openapi(removeRuleRoute(container), async (c) => {
      await deleteFabricRule(container, c.get("auth"), c.req.valid("param").id);
      return c.body(null, HTTP_NO_CONTENT);
    });
}
