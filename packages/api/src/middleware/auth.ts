/** Auth middleware: requireAuth verifies the bearer token once and puts the result in the context; requireRole checks it. */
import type { MiddlewareHandler } from "hono";
import { AppError } from "../domain/errors";
import type { AuthContext, TokenVerifier, UserRole } from "../ports/token-verifier";
import type { AppEnv } from "./request-id";

/** Hono environment of routes behind requireAuth. */
export interface AuthedEnv extends AppEnv {
  Variables: AppEnv["Variables"] & { auth: AuthContext };
}

const BEARER = /^Bearer\s+(\S+)$/i;

/**
 * Requires a valid Supabase access token in `Authorization: Bearer`.
 *
 * @param verifier - Checks the token (real JWKS in production, a local key in tests).
 * @returns Middleware that sets `auth` or throws UNAUTHENTICATED.
 */
export function requireAuth(verifier: TokenVerifier): MiddlewareHandler<AuthedEnv> {
  return async (c, next) => {
    const match = BEARER.exec(c.req.header("authorization") ?? "");
    if (!match?.[1]) throw new AppError("UNAUTHENTICATED");
    let auth: AuthContext;
    try {
      auth = await verifier.verify(match[1]);
    } catch {
      throw new AppError("UNAUTHENTICATED");
    }
    c.set("auth", auth);
    await next();
  };
}

/**
 * Requires a role; use after requireAuth. An admin passes any role check.
 *
 * @param role - The role the route needs.
 * @returns Middleware that throws FORBIDDEN when the verified role is not enough.
 */
export function requireRole(role: UserRole): MiddlewareHandler<AuthedEnv> {
  return async (c, next) => {
    const have = c.get("auth").role;
    if (have !== role && have !== "admin") throw new AppError("FORBIDDEN");
    await next();
  };
}
