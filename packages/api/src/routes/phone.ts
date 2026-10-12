/** Phone routes (FR-AUTH-02, FR-AUTH-03): status, send a code, verify the code. Each validates, calls one use case, maps the result. */
import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import {
  phoneStatusResponseSchema,
  sendPhoneCodeBodySchema,
  sendPhoneCodeResponseSchema,
  verifyPhoneBodySchema,
  verifyPhoneResponseSchema,
} from "@tafsila/schemas";
import type { Context } from "hono";
import type { Container } from "../container";
import { requireAuth, type AuthedEnv } from "../middleware/auth";
import { errorResponses } from "../openapi/responses";
import { HTTP_OK } from "../openapi/status";
import { getPhoneStatus } from "../services/get-phone-status";
import type { PhoneDeps } from "../services/phone-shared";
import { sendPhoneCode } from "../services/send-phone-code";
import { verifyPhone } from "../services/verify-phone";
import { jsonContent } from "./json-content";

/** HTTP status of an accepted request whose work happens elsewhere (the SMS). */
const HTTP_ACCEPTED = 202;

/** Bearer security requirement shared by every route here. */
const SECURITY = [{ bearerAuth: [] }];

/**
 * Reads the client IP: the first `x-forwarded-for` hop (set by Vercel), or null when absent.
 *
 * @param c - Request context.
 * @returns The IP text or null.
 */
export function clientIp(c: Context): string | null {
  const first = c.req.header("x-forwarded-for")?.split(",")[0]?.trim();
  return first ? first : null;
}

/**
 * Reads the caller's raw access token (requireAuth already verified it).
 *
 * @param c - Request context.
 * @returns The token text.
 */
function bearerToken(c: Context): string {
  return (c.req.header("authorization") ?? "").replace(/^Bearer\s+/i, "");
}

/**
 * Describes GET /phone.
 *
 * @param c - Dependencies.
 * @returns The route definition.
 */
const statusRoute = (c: Container) =>
  createRoute({
    method: "get",
    path: "/phone",
    tags: ["phone"],
    summary: "Phone verification state of the signed-in user",
    security: SECURITY,
    middleware: [requireAuth(c.tokenVerifier)] as const,
    responses: {
      [HTTP_OK]: {
        description: "Verified or not, the number and trial eligibility",
        ...jsonContent(phoneStatusResponseSchema),
      },
      ...errorResponses("UNAUTHENTICATED", "INTERNAL_ERROR"),
    },
  });

/**
 * Describes POST /phone/code.
 *
 * @param c - Dependencies.
 * @returns The route definition.
 */
const sendRoute = (c: Container) =>
  createRoute({
    method: "post",
    path: "/phone/code",
    tags: ["phone"],
    summary: "Send a verification code to an Egyptian mobile number",
    security: SECURITY,
    middleware: [requireAuth(c.tokenVerifier)] as const,
    request: { body: { ...jsonContent(sendPhoneCodeBodySchema), required: true } },
    responses: {
      [HTTP_ACCEPTED]: { description: "Code sent", ...jsonContent(sendPhoneCodeResponseSchema) },
      ...errorResponses(
        "PHONE_INVALID",
        "PHONE_TEST_ONLY",
        "VALIDATION_FAILED",
        "UNAUTHENTICATED",
        "PHONE_ALREADY_USED",
        "PHONE_RESEND_TOO_SOON",
        "PHONE_SEND_FAILED",
        "INTERNAL_ERROR",
      ),
    },
  });

/**
 * Describes POST /phone/verify.
 *
 * @param c - Dependencies.
 * @returns The route definition.
 */
const verifyRoute = (c: Container) =>
  createRoute({
    method: "post",
    path: "/phone/verify",
    tags: ["phone"],
    summary: "Verify the code and mark the phone verified",
    security: SECURITY,
    middleware: [requireAuth(c.tokenVerifier)] as const,
    request: { body: { ...jsonContent(verifyPhoneBodySchema), required: true } },
    responses: {
      [HTTP_OK]: { description: "Phone verified", ...jsonContent(verifyPhoneResponseSchema) },
      ...errorResponses(
        "PHONE_INVALID",
        "PHONE_CODE_INVALID",
        "VALIDATION_FAILED",
        "UNAUTHENTICATED",
        "PHONE_ALREADY_USED",
        "PHONE_TOO_MANY_ATTEMPTS",
        "INTERNAL_ERROR",
      ),
    },
  });

/**
 * Creates the three phone routes behind requireAuth. The user always comes from the verified token, never from the body.
 *
 * @param c - Dependencies.
 * @returns A sub-app serving /phone.
 */
export function phoneRoutes(c: Container): OpenAPIHono<AuthedEnv> {
  const deps: PhoneDeps = {
    otp: c.phoneOtp,
    hasher: c.phoneHasher,
    phones: c.phoneVerification,
    analytics: c.analytics,
    rules: c.phoneRules,
  };
  return new OpenAPIHono<AuthedEnv>()
    .openapi(statusRoute(c), async (ctx) =>
      ctx.json(await getPhoneStatus(c.phoneVerification, ctx.get("auth")), HTTP_OK),
    )
    .openapi(sendRoute(c), async (ctx) => {
      const { phone } = ctx.req.valid("json");
      const body = await sendPhoneCode(deps, {
        ctx: ctx.get("auth"),
        accessToken: bearerToken(ctx),
        ip: clientIp(ctx),
        phone,
      });
      return ctx.json(body, HTTP_ACCEPTED);
    })
    .openapi(verifyRoute(c), async (ctx) => {
      const { phone, code } = ctx.req.valid("json");
      const body = await verifyPhone(deps, { ctx: ctx.get("auth"), ip: clientIp(ctx), phone, code });
      return ctx.json(body, HTTP_OK);
    });
}
