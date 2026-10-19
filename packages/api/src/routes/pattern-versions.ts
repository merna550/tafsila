/** Pattern version routes: save, list, read and restore versions of the signed-in user's designs. Each route validates, calls one use case, maps the result. */
import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import {
  listPatternVersionsQuerySchema,
  patternVersionDetailSchema,
  patternVersionPageSchema,
  savePatternVersionInputSchema,
  savePatternVersionResultSchema,
} from "@tafsila/schemas";
import type { Context } from "hono";
import type { Container } from "../container";
import { requireAuth, type AuthedEnv } from "../middleware/auth";
import { errorResponses } from "../openapi/responses";
import { HTTP_CREATED, HTTP_OK } from "../openapi/status";
import { getPatternVersion } from "../services/get-pattern-version";
import { listPatternVersions } from "../services/list-pattern-versions";
import type { AppendOutcome } from "../services/pattern-version-shared";
import { restorePatternVersion } from "../services/restore-pattern-version";
import { savePatternVersion } from "../services/save-pattern-version";
import { jsonContent } from "./json-content";

/** Path parameter of the routes that address one design. */
const designParams = z.object({ id: z.uuid().meta({ example: "00000000-0000-4000-8000-0000000000d1" }) });

/** Path parameter of the routes that address one version. */
const versionParams = z.object({ id: z.uuid().meta({ example: "00000000-0000-4000-8000-0000000000f2" }) });

/** Bearer security requirement shared by every route here. */
const SECURITY = [{ bearerAuth: [] }];

/** Responses of the two routes that append a version (201 new, 200 reused). */
const appendResponses = {
  [HTTP_CREATED]: {
    description: "A new version was appended",
    ...jsonContent(savePatternVersionResultSchema),
  },
  [HTTP_OK]: {
    description: "The current version already had these inputs; nothing was written",
    ...jsonContent(savePatternVersionResultSchema),
  },
  ...errorResponses("VALIDATION_FAILED", "UNAUTHENTICATED", "NOT_FOUND", "PATTERN_INVALID", "INTERNAL_ERROR"),
};

/**
 * Describes POST /designs/{id}/versions.
 *
 * @param c - Dependencies (token verifier).
 * @returns The route definition.
 */
const saveRoute = (c: Container) =>
  createRoute({
    method: "post",
    path: "/designs/{id}/versions",
    tags: ["versions"],
    summary:
      "Save a version: the server re-runs the engine; a failed report is refused (422 PATTERN_INVALID)",
    security: SECURITY,
    middleware: [requireAuth(c.tokenVerifier)] as const,
    request: {
      params: designParams,
      body: { ...jsonContent(savePatternVersionInputSchema), required: true },
    },
    responses: appendResponses,
  });

/**
 * Describes GET /designs/{id}/versions.
 *
 * @param c - Dependencies (token verifier).
 * @returns The route definition.
 */
const listRoute = (c: Container) =>
  createRoute({
    method: "get",
    path: "/designs/{id}/versions",
    tags: ["versions"],
    summary: "List a design's versions, newest first",
    security: SECURITY,
    middleware: [requireAuth(c.tokenVerifier)] as const,
    request: { params: designParams, query: listPatternVersionsQuerySchema },
    responses: {
      [HTTP_OK]: { description: "One page of versions", ...jsonContent(patternVersionPageSchema) },
      ...errorResponses("VALIDATION_FAILED", "UNAUTHENTICATED", "NOT_FOUND", "INTERNAL_ERROR"),
    },
  });

/**
 * Describes GET /versions/{id}.
 *
 * @param c - Dependencies (token verifier).
 * @returns The route definition.
 */
const getRoute = (c: Container) =>
  createRoute({
    method: "get",
    path: "/versions/{id}",
    tags: ["versions"],
    summary: "Read a version with a pattern regenerated from its stored inputs",
    security: SECURITY,
    middleware: [requireAuth(c.tokenVerifier)] as const,
    request: { params: versionParams },
    responses: {
      [HTTP_OK]: {
        description: "The version, its fresh pattern and the engine flag",
        ...jsonContent(patternVersionDetailSchema),
      },
      ...errorResponses("VALIDATION_FAILED", "UNAUTHENTICATED", "NOT_FOUND", "INTERNAL_ERROR"),
    },
  });

/**
 * Describes POST /versions/{id}/restore.
 *
 * @param c - Dependencies (token verifier).
 * @returns The route definition.
 */
const restoreRoute = (c: Container) =>
  createRoute({
    method: "post",
    path: "/versions/{id}/restore",
    tags: ["versions"],
    summary: "Restore a version as a new version with the same stored inputs",
    security: SECURITY,
    middleware: [requireAuth(c.tokenVerifier)] as const,
    request: { params: versionParams },
    responses: appendResponses,
  });

/**
 * Answers an append: 201 for a new version, 200 when reused, with the engine time in `Server-Timing`.
 *
 * @param c - Request context.
 * @param outcome - Result of the use case.
 * @returns The JSON response.
 */
function appendResponse(c: Context<AuthedEnv>, outcome: AppendOutcome) {
  c.header("Server-Timing", `engine;dur=${outcome.engineMs}`);
  return c.json(outcome.result, outcome.result.reused ? HTTP_OK : HTTP_CREATED);
}

/**
 * Creates the pattern version routes behind requireAuth.
 *
 * @param container - Dependencies (token verifier, repositories, clock, analytics).
 * @returns A sub-app serving the four version routes.
 */
export function patternVersionRoutes(container: Container): OpenAPIHono<AuthedEnv> {
  return new OpenAPIHono<AuthedEnv>()
    .openapi(saveRoute(container), async (c) =>
      appendResponse(
        c,
        await savePatternVersion(container, c.get("auth"), c.req.valid("param").id, c.req.valid("json")),
      ),
    )
    .openapi(listRoute(container), async (c) =>
      c.json(
        await listPatternVersions(container, c.get("auth"), c.req.valid("param").id, c.req.valid("query")),
        HTTP_OK,
      ),
    )
    .openapi(getRoute(container), async (c) =>
      c.json(await getPatternVersion(container, c.get("auth"), c.req.valid("param").id), HTTP_OK),
    )
    .openapi(restoreRoute(container), async (c) =>
      appendResponse(c, await restorePatternVersion(container, c.get("auth"), c.req.valid("param").id)),
    );
}
