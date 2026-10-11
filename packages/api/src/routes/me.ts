/** Current-user route: the first protected endpoint; it returns who the verified token says you are. */
import type { MeResponse } from "@tafsila/schemas";
import { Hono } from "hono";
import type { Container } from "../container";
import { requireAuth, type AuthedEnv } from "../middleware/auth";

/**
 * Creates GET /me behind requireAuth.
 *
 * @param container - Dependencies (token verifier).
 * @returns A Hono sub-app.
 */
export function meRoutes(container: Container): Hono<AuthedEnv> {
  return new Hono<AuthedEnv>().get("/me", requireAuth(container.tokenVerifier), (c) => {
    const { userId, role } = c.get("auth");
    const body: MeResponse = { userId, role };
    return c.json(body);
  });
}
