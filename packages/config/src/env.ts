/** Runtime configuration: every environment variable is declared and validated here (ADR-004, build once / run anywhere). */
import { z } from "zod";

/** Deployment environments the app can run in. */
export const APP_ENVIRONMENTS = ["local", "ci", "preview", "staging", "production"] as const;

/** Fields of the server environment before the production-only rules are applied. */
const baseServerEnvSchema = z.object({
  APP_ENV: z.enum(APP_ENVIRONMENTS).default("local"),
  APP_VERSION: z.string().default("dev"),
  GIT_SHA: z.string().default("unknown"),
  SUPABASE_URL: z.url(),
  SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  AI_PROVIDER: z.enum(["anthropic", "google"]).default("anthropic"),
  AI_MODEL_ANALYZE: z.string().min(1).optional(),
  AI_API_KEY: z.string().min(1).optional(),
  PAYMOB_MODE: z.enum(["sandbox", "live"]).default("sandbox"),
  PAYMOB_API_KEY: z.string().min(1).optional(),
});

/** Variables that are optional until their milestone (AI in M6, Paymob in M7) but mandatory in production. */
export const PRODUCTION_REQUIRED_KEYS = ["AI_MODEL_ANALYZE", "AI_API_KEY", "PAYMOB_API_KEY"] as const;

/** Schema of all server-side environment variables; AI and Paymob keys are required only when APP_ENV is production. */
export const serverEnvSchema = baseServerEnvSchema.superRefine((env, ctx) => {
  if (env.APP_ENV !== "production") return;
  for (const key of PRODUCTION_REQUIRED_KEYS) {
    if (env[key] === undefined) {
      ctx.addIssue({ code: "custom", path: [key], message: `${key} is required in production` });
    }
  }
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
