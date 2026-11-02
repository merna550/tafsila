/** Chat edit routes: send a message, read the history and apply a proposal (FR-CHAT-01..04, FR-CHAT-06, SRS §8). */
import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import {
  chatHistorySchema,
  savePatternVersionResultSchema,
  sendChatMessageInputSchema,
  sendChatMessageResultSchema,
} from "@tafsila/schemas";
import type { Container } from "../container";
import { requireAuth, type AuthedEnv } from "../middleware/auth";
import { rateLimit } from "../middleware/rate-limit";
import { errorResponses } from "../openapi/responses";
import { HTTP_CREATED, HTTP_OK } from "../openapi/status";
import { applyChatEdit } from "../services/apply-chat-edit";
import { listChatMessages } from "../services/list-chat-messages";
import { sendChatMessage } from "../services/send-chat-message";
import { jsonContent } from "./json-content";

/** Path parameter of the routes that address one design. */
const designParams = z.object({ id: z.uuid().meta({ example: "00000000-0000-4000-8000-0000000000d1" }) });

/** Path parameters of the apply route. */
const messageParams = designParams.extend({
  msgId: z.uuid().meta({ example: "00000000-0000-4000-8000-0000000000a2" }),
});

/** Bearer security requirement shared by every route here. */
const SECURITY = [{ bearerAuth: [] }];

/** Length of the rate-limit window. */
const MINUTE_MS = 60_000;

/**
 * Describes POST /designs/{id}/chat.
 *
 * @param c - Dependencies (token verifier, clock and the limits).
 * @returns The route definition.
 */
const sendRoute = (c: Container) =>
  createRoute({
    method: "post",
    path: "/designs/{id}/chat",
    tags: ["chat"],
    summary:
      "Send an edit request: a validated proposal or a polite 'not supported' (nothing is saved until apply)",
    security: SECURITY,
    middleware: [
      requireAuth(c.tokenVerifier),
      rateLimit({
        limit: c.jobsConfig.rateLimitPerMinute,
        windowMs: MINUTE_MS,
        now: () => c.clock.now().getTime(),
      }),
    ] as const,
    request: { params: designParams, body: { ...jsonContent(sendChatMessageInputSchema), required: true } },
    responses: {
      [HTTP_OK]: {
        description: "The proposal or the explanation",
        ...jsonContent(sendChatMessageResultSchema),
      },
      ...errorResponses(
        "VALIDATION_FAILED",
        "UNAUTHENTICATED",
        "NOT_FOUND",
        "CHAT_QUOTA_EXCEEDED",
        "CHAT_DAILY_LIMIT",
        "RATE_LIMITED",
        "AI_CHAT_FAILED",
        "INTERNAL_ERROR",
      ),
    },
  });

/**
 * Describes GET /designs/{id}/chat.
 *
 * @param c - Dependencies (token verifier).
 * @returns The route definition.
 */
const listRoute = (c: Container) =>
  createRoute({
    method: "get",
    path: "/designs/{id}/chat",
    tags: ["chat"],
    summary: "Read the chat history of a design (newest last) with the message quota",
    security: SECURITY,
    middleware: [requireAuth(c.tokenVerifier)] as const,
    request: { params: designParams },
    responses: {
      [HTTP_OK]: { description: "The history", ...jsonContent(chatHistorySchema) },
      ...errorResponses("VALIDATION_FAILED", "UNAUTHENTICATED", "NOT_FOUND", "INTERNAL_ERROR"),
    },
  });

/**
 * Describes POST /designs/{id}/chat/{msgId}/apply.
 *
 * @param c - Dependencies (token verifier).
 * @returns The route definition.
 */
const applyRoute = (c: Container) =>
  createRoute({
    method: "post",
    path: "/designs/{id}/chat/{msgId}/apply",
    tags: ["chat"],
    summary:
      "Apply a proposal: saves a new version (created_by chat); applying twice returns the same version",
    security: SECURITY,
    middleware: [requireAuth(c.tokenVerifier)] as const,
    request: { params: messageParams },
    responses: {
      [HTTP_CREATED]: {
        description: "A new version was saved",
        ...jsonContent(savePatternVersionResultSchema),
      },
      [HTTP_OK]: {
        description: "The proposal was applied before; its version",
        ...jsonContent(savePatternVersionResultSchema),
      },
      ...errorResponses(
        "VALIDATION_FAILED",
        "UNAUTHENTICATED",
        "NOT_FOUND",
        "CHAT_NOTHING_TO_APPLY",
        "CHAT_PROPOSAL_STALE",
        "PATTERN_INVALID",
        "INTERNAL_ERROR",
      ),
    },
  });

/**
 * Creates the chat edit routes behind requireAuth.
 *
 * @param container - Dependencies.
 * @returns A sub-app serving the three routes.
 */
export function designChatRoutes(container: Container): OpenAPIHono<AuthedEnv> {
  const limits = {
    chatMessagesPerDesign: container.jobsConfig.chatMessagesPerDesign,
    chatDailyLimit: container.jobsConfig.chatDailyLimit,
  };
  return new OpenAPIHono<AuthedEnv>()
    .openapi(sendRoute(container), async (c) =>
      c.json(
        await sendChatMessage(
          { ...container, ...limits },
          c.get("auth"),
          c.req.valid("param").id,
          c.req.valid("json"),
        ),
        HTTP_OK,
      ),
    )
    .openapi(listRoute(container), async (c) =>
      c.json(
        await listChatMessages({ ...container, ...limits }, c.get("auth"), c.req.valid("param").id),
        HTTP_OK,
      ),
    )
    .openapi(applyRoute(container), async (c) => {
      const { id, msgId } = c.req.valid("param");
      const result = await applyChatEdit(container, c.get("auth"), id, msgId);
      return c.json(result, result.reused ? HTTP_OK : HTTP_CREATED);
    });
}
