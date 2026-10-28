/** Fabric routes for the signed-in user: recommendations for a saved version and its saved fabric calculation (FR-REC-02, FR-FAB-01). */
import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import {
  fabricCalcSchema,
  recommendFabricsQuerySchema,
  recommendFabricsResponseSchema,
  saveFabricCalcInputSchema,
} from "@tafsila/schemas";
import type { Container } from "../container";
import { requireAuth, type AuthedEnv } from "../middleware/auth";
import { errorResponses } from "../openapi/responses";
import { HTTP_OK } from "../openapi/status";
import { getFabricCalc } from "../services/get-fabric-calc";
import { getFabricRecommendations } from "../services/get-fabric-recommendations";
import { saveFabricCalc } from "../services/save-fabric-calc";
import { jsonContent } from "./json-content";

/** Path parameter of the routes that address one version. */
const versionParams = z.object({ id: z.uuid().meta({ example: "00000000-0000-4000-8000-0000000000f2" }) });

/** Bearer security requirement shared by every route here. */
const SECURITY = [{ bearerAuth: [] }];

/**
 * Describes GET /fabrics/recommend.
 *
 * @param c - Dependencies (token verifier).
 * @returns The route definition.
 */
const recommendRoute = (c: Container) =>
  createRoute({
    method: "get",
    path: "/fabrics/recommend",
    tags: ["fabrics"],
    summary: "Recommend 3 to 5 fabrics with reasons, and an avoid list, for a saved version",
    security: SECURITY,
    middleware: [requireAuth(c.tokenVerifier)] as const,
    request: { query: recommendFabricsQuerySchema },
    responses: {
      [HTTP_OK]: { description: "The recommendation", ...jsonContent(recommendFabricsResponseSchema) },
      ...errorResponses("VALIDATION_FAILED", "UNAUTHENTICATED", "NOT_FOUND", "INTERNAL_ERROR"),
    },
  });

/**
 * Describes PUT /versions/{id}/fabric.
 *
 * @param c - Dependencies (token verifier).
 * @returns The route definition.
 */
const saveCalcRoute = (c: Container) =>
  createRoute({
    method: "put",
    path: "/versions/{id}/fabric",
    tags: ["fabrics"],
    summary:
      "Save the fabric calculation the browser computed; one row per version and options, the last save wins (lengths are checked: 422 FABRIC_CALC_INVALID)",
    security: SECURITY,
    middleware: [requireAuth(c.tokenVerifier)] as const,
    request: { params: versionParams, body: { ...jsonContent(saveFabricCalcInputSchema), required: true } },
    responses: {
      [HTTP_OK]: { description: "The stored calculation", ...jsonContent(fabricCalcSchema) },
      ...errorResponses(
        "VALIDATION_FAILED",
        "UNAUTHENTICATED",
        "NOT_FOUND",
        "FABRIC_CALC_INVALID",
        "INTERNAL_ERROR",
      ),
    },
  });

/**
 * Describes GET /versions/{id}/fabric.
 *
 * @param c - Dependencies (token verifier).
 * @returns The route definition.
 */
const getCalcRoute = (c: Container) =>
  createRoute({
    method: "get",
    path: "/versions/{id}/fabric",
    tags: ["fabrics"],
    summary: "Read the latest saved fabric calculation of a version",
    security: SECURITY,
    middleware: [requireAuth(c.tokenVerifier)] as const,
    request: { params: versionParams },
    responses: {
      [HTTP_OK]: { description: "The calculation", ...jsonContent(fabricCalcSchema) },
      ...errorResponses("VALIDATION_FAILED", "UNAUTHENTICATED", "NOT_FOUND", "INTERNAL_ERROR"),
    },
  });

/**
 * Creates the fabric routes behind requireAuth.
 *
 * @param container - Dependencies (token verifier, version, catalogue, rule and calculation repositories).
 * @returns A sub-app serving the three routes.
 */
export function fabricRoutes(container: Container): OpenAPIHono<AuthedEnv> {
  return new OpenAPIHono<AuthedEnv>()
    .openapi(recommendRoute(container), async (c) =>
      c.json(
        await getFabricRecommendations(container, c.get("auth"), c.req.valid("query").versionId),
        HTTP_OK,
      ),
    )
    .openapi(saveCalcRoute(container), async (c) =>
      c.json(
        await saveFabricCalc(container, c.get("auth"), c.req.valid("param").id, c.req.valid("json")),
        HTTP_OK,
      ),
    )
    .openapi(getCalcRoute(container), async (c) =>
      c.json(await getFabricCalc(container, c.get("auth"), c.req.valid("param").id), HTTP_OK),
    );
}
