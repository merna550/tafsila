/** Design analysis routes: start a background photo analysis and read its state (FR-DES-02, FR-DES-03, SRS §9). */
import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import {
  analyzeAcceptedResponseSchema,
  analyzeDesignInputSchema,
  designAnalysisResponseSchema,
} from "@tafsila/schemas";
import type { Container } from "../container";
import { requireAuth, type AuthedEnv } from "../middleware/auth";
import { rateLimit } from "../middleware/rate-limit";
import { errorResponses } from "../openapi/responses";
import { HTTP_ACCEPTED, HTTP_OK } from "../openapi/status";
import { getDesignAnalysis } from "../services/get-design-analysis";
import { startDesignAnalysis } from "../services/start-design-analysis";
import { jsonContent } from "./json-content";

/** Path parameter of the routes that address one design. */
const idParams = z.object({ id: z.uuid().meta({ example: "00000000-0000-4000-8000-0000000000d1" }) });

/** Bearer security requirement shared by every route here. */
const SECURITY = [{ bearerAuth: [] }];

/** Length of the rate-limit window. */
const MINUTE_MS = 60_000;

/**
 * Describes POST /designs/{id}/analyze.
 *
 * @param c - Dependencies (token verifier, clock and the limits).
 * @returns The route definition.
 */
const analyzeRoute = (c: Container) =>
  createRoute({
    method: "post",
    path: "/designs/{id}/analyze",
    tags: ["designs"],
    summary: "Start a background analysis of the design's photos (poll GET /designs/{id}/analysis)",
    security: SECURITY,
    middleware: [
      requireAuth(c.tokenVerifier),
      rateLimit({
        limit: c.jobsConfig.rateLimitPerMinute,
        windowMs: MINUTE_MS,
        now: () => c.clock.now().getTime(),
      }),
    ] as const,
    request: { params: idParams, body: { ...jsonContent(analyzeDesignInputSchema), required: false } },
    responses: {
      [HTTP_ACCEPTED]: {
        description: "Accepted, the analysis is pending",
        ...jsonContent(analyzeAcceptedResponseSchema),
      },
      ...errorResponses(
        "VALIDATION_FAILED",
        "UNAUTHENTICATED",
        "NOT_FOUND",
        "PHOTO_FRONT_REQUIRED",
        "CATEGORY_NOT_SUPPORTED",
        "ANALYSIS_IN_PROGRESS",
        "AI_DAILY_LIMIT",
        "RATE_LIMITED",
        "INTERNAL_ERROR",
      ),
    },
  });

/**
 * Describes GET /designs/{id}/analysis.
 *
 * @param c - Dependencies (token verifier).
 * @returns The route definition.
 */
const statusRoute = (c: Container) =>
  createRoute({
    method: "get",
    path: "/designs/{id}/analysis",
    tags: ["designs"],
    summary: "Read the analysis state: none, pending, done (with the result) or failed",
    security: SECURITY,
    middleware: [requireAuth(c.tokenVerifier)] as const,
    request: { params: idParams },
    responses: {
      [HTTP_OK]: { description: "The state", ...jsonContent(designAnalysisResponseSchema) },
      ...errorResponses("VALIDATION_FAILED", "UNAUTHENTICATED", "NOT_FOUND", "INTERNAL_ERROR"),
    },
  });

/**
 * Parses an optional JSON body: an empty body is the same as `{}`.
 *
 * @param read - Reads the validated body.
 * @returns The request.
 */
const bodyOrEmpty = (read: () => z.infer<typeof analyzeDesignInputSchema> | undefined) => read() ?? {};

/**
 * Creates the design analysis routes behind requireAuth.
 *
 * @param container - Dependencies.
 * @returns A sub-app serving the two routes.
 */
export function designAnalysisRoutes(container: Container): OpenAPIHono<AuthedEnv> {
  return new OpenAPIHono<AuthedEnv>()
    .openapi(analyzeRoute(container), async (c) =>
      c.json(
        await startDesignAnalysis(
          { ...container, analyzeDailyLimit: container.jobsConfig.analyzeDailyLimit },
          c.get("auth"),
          c.req.valid("param").id,
          bodyOrEmpty(() => c.req.valid("json")),
        ),
        HTTP_ACCEPTED,
      ),
    )
    .openapi(statusRoute(container), async (c) =>
      c.json(await getDesignAnalysis(container, c.get("auth"), c.req.valid("param").id), HTTP_OK),
    );
}
