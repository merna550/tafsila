/** Per-user rate limit (NFR-04): an in-memory token bucket. It is per server instance, a guard against loops and double clicks, not a quota (the daily cap is the quota). */
import type { Context, MiddlewareHandler } from "hono";
import { AppError } from "../domain/errors";
import type { AuthedEnv } from "./auth";

/** Milliseconds in a second. */
const MS_PER_SECOND = 1000;

/** Options of the limiter. */
export interface RateLimitOptions {
  /** Requests allowed per window (also the burst size). */
  readonly limit: number;
  /** Window length in ms; tokens refill evenly across it. */
  readonly windowMs: number;
  /** Time source in ms (a fake in tests). */
  readonly now?: () => number;
  /** Counts only the requests this returns true for (a route that is free of AI cost unless asked, issue #346). */
  readonly when?: (c: Context<AuthedEnv>) => boolean;
}

/** Tokens left and when they were last counted, per user. */
interface Bucket {
  tokens: number;
  at: number;
}

/**
 * Creates a limiter for routes behind `requireAuth`; each user has their own bucket.
 *
 * @param options - Limit, window and clock.
 * @returns Middleware that throws RATE_LIMITED (with Retry-After) when the user's bucket is empty.
 */
export function rateLimit(options: RateLimitOptions): MiddlewareHandler<AuthedEnv> {
  const now = options.now ?? (() => Date.now());
  const refillPerMs = options.limit / options.windowMs;
  const buckets = new Map<string, Bucket>();
  return async (c, next) => {
    if (options.when && !options.when(c)) return next();
    const userId = c.get("auth").userId;
    const at = now();
    const bucket = buckets.get(userId) ?? { tokens: options.limit, at };
    bucket.tokens = Math.min(options.limit, bucket.tokens + (at - bucket.at) * refillPerMs);
    bucket.at = at;
    buckets.set(userId, bucket);
    if (bucket.tokens < 1) {
      const retryAfterSeconds = Math.max(1, Math.ceil((1 - bucket.tokens) / refillPerMs / MS_PER_SECOND));
      throw new AppError("RATE_LIMITED", { details: { retryAfterSeconds } });
    }
    bucket.tokens -= 1;
    await next();
  };
}
