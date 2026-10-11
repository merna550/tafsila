/** Debug route that proves errors reach Sentry; mounted only outside production. */
import { Hono } from "hono";
import type { Container } from "../container";
import { AppError } from "../domain/errors";
import type { AppEnv } from "../middleware/request-id";

/** Minimum time between two debug errors on one instance (protects the free Sentry quota). */
export const DEBUG_ERROR_INTERVAL_MS = 60_000;

/**
 * Creates GET /debug/error: throws a unique error, at most once a minute per instance.
 *
 * @param container - Dependencies (clock).
 * @returns A Hono sub-app.
 */
export function debugRoutes(container: Container): Hono<AppEnv> {
  let lastThrownAt = 0;
  return new Hono<AppEnv>().get("/debug/error", () => {
    const now = container.clock.now().getTime();
    if (lastThrownAt !== 0 && now - lastThrownAt < DEBUG_ERROR_INTERVAL_MS) {
      throw new AppError("RATE_LIMITED", { messageEn: "Debug error already thrown, retry in a minute" });
    }
    lastThrownAt = now;
    throw new Error(`Debug test error ${crypto.randomUUID()}`);
  });
}
