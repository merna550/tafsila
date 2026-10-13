/** Admin routes (FR-ADM, #32): stats, users and the default size chart editor. Every route needs a signed-in admin (the database checks again). */
import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import {
  adminSizeChartSchema,
  adminStatsSchema,
  adminUserDetailSchema,
  adminUserPageSchema,
  listAdminUsersQuerySchema,
  updateSizeChartInputSchema,
  updateSizeChartResponseSchema,
} from "@tafsila/schemas";
import type { Container } from "../container";
import { requireAuth, requireRole, type AuthedEnv } from "../middleware/auth";
import { errorResponses } from "../openapi/responses";
import { HTTP_OK } from "../openapi/status";
import { getAdminSizeChart } from "../services/get-admin-size-chart";
import { getAdminStats } from "../services/get-admin-stats";
import { getAdminUser } from "../services/get-admin-user";
import { listAdminUsers } from "../services/list-admin-users";
import { updateDefaultSizeChart } from "../services/update-default-size-chart";
import { jsonContent } from "./json-content";

/** Path parameter of the routes that address one user. */
const idParams = z.object({ id: z.uuid().meta({ example: "00000000-0000-4000-8000-000000000001" }) });

/** Bearer security requirement shared by every route here. */
const SECURITY = [{ bearerAuth: [] }];

/**
 * Describes GET /admin/stats.
 *
 * @param c - Dependencies.
 * @returns The route definition.
 */
const statsRoute = (c: Container) =>
  createRoute({
    method: "get",
    path: "/admin/stats",
    tags: ["admin"],
    summary: "Admin overview numbers (users, verified phones, sign-ups, clients)",
    security: SECURITY,
    middleware: [requireAuth(c.tokenVerifier), requireRole("admin")] as const,
    responses: {
      [HTTP_OK]: { description: "The numbers", ...jsonContent(adminStatsSchema) },
      ...errorResponses("UNAUTHENTICATED", "FORBIDDEN", "INTERNAL_ERROR"),
    },
  });

/**
 * Describes GET /admin/users.
 *
 * @param c - Dependencies.
 * @returns The route definition.
 */
const usersRoute = (c: Container) =>
  createRoute({
    method: "get",
    path: "/admin/users",
    tags: ["admin"],
    summary:
      "List users (newest first) with search, verified filter and paging; a client count, never measurements or notes",
    security: SECURITY,
    middleware: [requireAuth(c.tokenVerifier), requireRole("admin")] as const,
    request: { query: listAdminUsersQuerySchema },
    responses: {
      [HTTP_OK]: { description: "One page of users", ...jsonContent(adminUserPageSchema) },
      ...errorResponses("VALIDATION_FAILED", "UNAUTHENTICATED", "FORBIDDEN", "INTERNAL_ERROR"),
    },
  });

/**
 * Describes GET /admin/users/{id}.
 *
 * @param c - Dependencies.
 * @returns The route definition.
 */
const userRoute = (c: Container) =>
  createRoute({
    method: "get",
    path: "/admin/users/{id}",
    tags: ["admin"],
    summary: "Read one user (read-only)",
    security: SECURITY,
    middleware: [requireAuth(c.tokenVerifier), requireRole("admin")] as const,
    request: { params: idParams },
    responses: {
      [HTTP_OK]: { description: "The user", ...jsonContent(adminUserDetailSchema) },
      ...errorResponses("VALIDATION_FAILED", "UNAUTHENTICATED", "FORBIDDEN", "NOT_FOUND", "INTERNAL_ERROR"),
    },
  });

/**
 * Describes GET /admin/size-charts/default.
 *
 * @param c - Dependencies.
 * @returns The route definition.
 */
const getChartRoute = (c: Container) =>
  createRoute({
    method: "get",
    path: "/admin/size-charts/default",
    tags: ["admin"],
    summary: "Read the default size chart with its last editor and the placeholder flag",
    security: SECURITY,
    middleware: [requireAuth(c.tokenVerifier), requireRole("admin")] as const,
    responses: {
      [HTTP_OK]: { description: "The chart", ...jsonContent(adminSizeChartSchema) },
      ...errorResponses("UNAUTHENTICATED", "FORBIDDEN", "SIZE_CHART_NOT_FOUND", "INTERNAL_ERROR"),
    },
  });

/**
 * Describes PUT /admin/size-charts/default.
 *
 * @param c - Dependencies.
 * @returns The route definition.
 */
const putChartRoute = (c: Container) =>
  createRoute({
    method: "put",
    path: "/admin/size-charts/default",
    tags: ["admin"],
    summary:
      "Replace the default size chart (every size is checked by the engine; chart and audit row are saved together)",
    security: SECURITY,
    middleware: [requireAuth(c.tokenVerifier), requireRole("admin")] as const,
    request: { body: { ...jsonContent(updateSizeChartInputSchema), required: true } },
    responses: {
      [HTTP_OK]: {
        description: "The saved chart and its warnings",
        ...jsonContent(updateSizeChartResponseSchema),
      },
      ...errorResponses(
        "VALIDATION_FAILED",
        "UNAUTHENTICATED",
        "FORBIDDEN",
        "SIZE_CHART_NOT_FOUND",
        "SIZE_CHART_INVALID",
        "INTERNAL_ERROR",
      ),
    },
  });

/**
 * Creates the /admin routes behind requireAuth and requireRole("admin").
 *
 * @param container - Dependencies (token verifier, admin and size chart repositories).
 * @returns A sub-app serving the admin endpoints.
 */
export function adminRoutes(container: Container): OpenAPIHono<AuthedEnv> {
  return new OpenAPIHono<AuthedEnv>()
    .openapi(statsRoute(container), async (c) =>
      c.json(await getAdminStats(container, c.get("auth")), HTTP_OK),
    )
    .openapi(usersRoute(container), async (c) =>
      c.json(await listAdminUsers(container, c.get("auth"), c.req.valid("query")), HTTP_OK),
    )
    .openapi(userRoute(container), async (c) =>
      c.json(await getAdminUser(container, c.get("auth"), c.req.valid("param").id), HTTP_OK),
    )
    .openapi(getChartRoute(container), async (c) =>
      c.json(await getAdminSizeChart(container, c.get("auth")), HTTP_OK),
    )
    .openapi(putChartRoute(container), async (c) =>
      c.json(await updateDefaultSizeChart(container, c.get("auth"), c.req.valid("json")), HTTP_OK),
    );
}
