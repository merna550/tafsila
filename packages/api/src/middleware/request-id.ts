/** Request id middleware: every request gets an id that appears in logs, error bodies, Sentry and the x-request-id header. */
import type { MiddlewareHandler } from "hono";

/** Hono environment shared by all routes: variables set by middleware. */
export interface AppEnv {
  Variables: { requestId: string };
}

/** Header carrying the request id in both directions. */
export const REQUEST_ID_HEADER = "x-request-id";

const SAFE_REQUEST_ID = /^[A-Za-z0-9._-]{1,64}$/;

/**
 * Picks the request id: a safe inbound value is reused, anything else is replaced by a fresh UUID.
 *
 * @param inbound - Value of the incoming x-request-id header, if any.
 * @returns The id to use for this request.
 */
export function chooseRequestId(inbound: string | undefined): string {
  return inbound !== undefined && SAFE_REQUEST_ID.test(inbound) ? inbound : crypto.randomUUID();
}

/**
 * Stores the request id on the context and echoes it in the response header.
 *
 * @returns Hono middleware.
 */
export function requestId(): MiddlewareHandler<AppEnv> {
  return async (c, next) => {
    const id = chooseRequestId(c.req.header(REQUEST_ID_HEADER));
    c.set("requestId", id);
    c.header(REQUEST_ID_HEADER, id);
    await next();
  };
}
