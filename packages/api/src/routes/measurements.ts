/** Measurement set routes (FR-MEAS-04): CRUD for the signed-in user's saved measurements. */
import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import {
  listMeasurementSetsQuerySchema,
  measurementSetPageSchema,
  measurementSetSchema,
  saveMeasurementSetInputSchema,
  updateMeasurementSetInputSchema,
} from "@tafsila/schemas";
import type { Container } from "../container";
import { requireAuth, type AuthedEnv } from "../middleware/auth";
import { errorResponses } from "../openapi/responses";
import { HTTP_CREATED, HTTP_NO_CONTENT, HTTP_OK } from "../openapi/status";
import { deleteMeasurementSet } from "../services/delete-measurement-set";
import { getMeasurementSet } from "../services/get-measurement-set";
import { listMeasurementSets } from "../services/list-measurement-sets";
import { saveMeasurementSet } from "../services/save-measurement-set";
import { updateMeasurementSet } from "../services/update-measurement-set";
import { jsonContent } from "./json-content";

/** Path parameter shared by the routes that address one set. */
const idParams = z.object({ id: z.uuid().meta({ example: "00000000-0000-4000-8000-0000000000c1" }) });

/** Bearer security requirement shared by every route here. */
const SECURITY = [{ bearerAuth: [] }];

/**
 * Describes POST /measurements.
 *
 * @param c - Dependencies (token verifier).
 * @returns The route definition.
 */
const saveRoute = (c: Container) =>
  createRoute({
    method: "post",
    path: "/measurements",
    tags: ["measurements"],
    summary: "Save a measurement set (errors block, warnings are returned)",
    security: SECURITY,
    middleware: [requireAuth(c.tokenVerifier)] as const,
    request: { body: { ...jsonContent(saveMeasurementSetInputSchema), required: true } },
    responses: {
      [HTTP_CREATED]: {
        description: "The saved set with its warnings",
        ...jsonContent(measurementSetSchema),
      },
      ...errorResponses(
        "VALIDATION_FAILED",
        "UNAUTHENTICATED",
        "NOT_FOUND",
        "MEASUREMENTS_INVALID",
        "INTERNAL_ERROR",
      ),
    },
  });

/**
 * Describes GET /measurements.
 *
 * @param c - Dependencies (token verifier).
 * @returns The route definition.
 */
const listRoute = (c: Container) =>
  createRoute({
    method: "get",
    path: "/measurements",
    tags: ["measurements"],
    summary: "List measurement sets (newest first), optionally for one client",
    security: SECURITY,
    middleware: [requireAuth(c.tokenVerifier)] as const,
    request: { query: listMeasurementSetsQuerySchema },
    responses: {
      [HTTP_OK]: { description: "One page of sets", ...jsonContent(measurementSetPageSchema) },
      ...errorResponses("VALIDATION_FAILED", "UNAUTHENTICATED", "INTERNAL_ERROR"),
    },
  });

/**
 * Describes GET /measurements/{id}.
 *
 * @param c - Dependencies (token verifier).
 * @returns The route definition.
 */
const getRoute = (c: Container) =>
  createRoute({
    method: "get",
    path: "/measurements/{id}",
    tags: ["measurements"],
    summary: "Read one measurement set with fresh warnings",
    security: SECURITY,
    middleware: [requireAuth(c.tokenVerifier)] as const,
    request: { params: idParams },
    responses: {
      [HTTP_OK]: { description: "The set", ...jsonContent(measurementSetSchema) },
      ...errorResponses("VALIDATION_FAILED", "UNAUTHENTICATED", "NOT_FOUND", "INTERNAL_ERROR"),
    },
  });

/**
 * Describes PUT /measurements/{id}.
 *
 * @param c - Dependencies (token verifier).
 * @returns The route definition.
 */
const putRoute = (c: Container) =>
  createRoute({
    method: "put",
    path: "/measurements/{id}",
    tags: ["measurements"],
    summary: "Replace label, size label and measurements of a set",
    security: SECURITY,
    middleware: [requireAuth(c.tokenVerifier)] as const,
    request: { params: idParams, body: { ...jsonContent(updateMeasurementSetInputSchema), required: true } },
    responses: {
      [HTTP_OK]: { description: "The updated set with its warnings", ...jsonContent(measurementSetSchema) },
      ...errorResponses(
        "VALIDATION_FAILED",
        "UNAUTHENTICATED",
        "NOT_FOUND",
        "MEASUREMENTS_INVALID",
        "INTERNAL_ERROR",
      ),
    },
  });

/**
 * Describes DELETE /measurements/{id}.
 *
 * @param c - Dependencies (token verifier).
 * @returns The route definition.
 */
const deleteRoute = (c: Container) =>
  createRoute({
    method: "delete",
    path: "/measurements/{id}",
    tags: ["measurements"],
    summary: "Delete a measurement set",
    security: SECURITY,
    middleware: [requireAuth(c.tokenVerifier)] as const,
    request: { params: idParams },
    responses: {
      [HTTP_NO_CONTENT]: { description: "Deleted" },
      ...errorResponses("VALIDATION_FAILED", "UNAUTHENTICATED", "NOT_FOUND", "INTERNAL_ERROR"),
    },
  });

/**
 * Creates the /measurements routes behind requireAuth.
 *
 * @param container - Dependencies (token verifier, measurement set repository).
 * @returns A sub-app serving the five measurement set routes.
 */
export function measurementRoutes(container: Container): OpenAPIHono<AuthedEnv> {
  return new OpenAPIHono<AuthedEnv>()
    .openapi(saveRoute(container), async (c) =>
      c.json(await saveMeasurementSet(container, c.get("auth"), c.req.valid("json")), HTTP_CREATED),
    )
    .openapi(listRoute(container), async (c) =>
      c.json(await listMeasurementSets(container, c.get("auth"), c.req.valid("query")), HTTP_OK),
    )
    .openapi(getRoute(container), async (c) =>
      c.json(await getMeasurementSet(container, c.get("auth"), c.req.valid("param").id), HTTP_OK),
    )
    .openapi(putRoute(container), async (c) =>
      c.json(
        await updateMeasurementSet(container, c.get("auth"), c.req.valid("param").id, c.req.valid("json")),
        HTTP_OK,
      ),
    )
    .openapi(deleteRoute(container), async (c) => {
      await deleteMeasurementSet(container, c.get("auth"), c.req.valid("param").id);
      return c.body(null, HTTP_NO_CONTENT);
    });
}
