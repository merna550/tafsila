/** Runtime configuration: every environment variable is declared and validated here (ADR-004, build once / run anywhere). */
import { z } from "zod";

/** Deployment environments the app can run in. */
export const APP_ENVIRONMENTS = ["local", "ci", "preview", "staging", "production"] as const;

/** Schema of all server-side environment variables; the app refuses to start if any is missing or invalid. */
export const serverEnvSchema = z.object({
  APP_ENV: z.enum(APP_ENVIRONMENTS).default("local"),
  APP_VERSION: z.string().default("dev"),
  GIT_SHA: z.string().default("unknown"),
  SUPABASE_URL: z.url(),
  SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  AI_PROVIDER: z.enum(["anthropic", "google"]).default("anthropic"),
  AI_MODEL_ANALYZE: z.string().min(1),
  AI_API_KEY: z.string().min(1),
  PAYMOB_MODE: z.enum(["sandbox", "live"]).default("sandbox"),
});

/** Validated server configuration object. */
export type ServerEnv = z.infer<typeof serverEnvSchema>;

/**
 * Parses and validates environment variables, listing every invalid key in one error.
 * Used once at startup by the API composition root; tests pass their own source object.
 *
 * @param source - Key/value map to read from (defaults to process.env).
 * @returns The typed, validated configuration.
 * @throws {Error} When one or more variables are missing or invalid.
 * @example
 * const env = loadServerEnv({ SUPABASE_URL: "http://127.0.0.1:54321", ... });
 */
export function loadServerEnv(source: Record<string, string | undefined> = process.env): ServerEnv {
  const result = serverEnvSchema.safeParse(source);
  if (!result.success) {
    const keys = result.error.issues.map((issue) => issue.path.join(".")).join(", ");
    throw new Error(`Invalid environment configuration: ${keys}`);
  }
  return result.data;
}
