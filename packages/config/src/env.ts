/** Runtime configuration: every environment variable is declared and validated here (ADR-004, build once / run anywhere). */
import { z } from "zod";

/** Deployment environments the app can run in. */
export const APP_ENVIRONMENTS = ["local", "ci", "preview", "staging", "production"] as const;

/** Fields of the server environment before the production-only rules are applied. */
const baseServerEnvSchema = z.object({
  APP_ENV: z.enum(APP_ENVIRONMENTS).default("local"),
  APP_VERSION: z.string().default("dev"),
  GIT_SHA: z.string().default("unknown"),
  VERCEL_GIT_COMMIT_SHA: z.string().min(1).optional(),
  SUPABASE_URL: z.url(),
  SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  AUTH_GOOGLE_ENABLED: z.stringbool().default(false),
  AI_PROVIDER: z.enum(["anthropic", "google"]).default("anthropic"),
  AI_MODEL_ANALYZE: z.string().min(1).optional(),
  AI_API_KEY: z.string().min(1).optional(),
  PAYMOB_MODE: z.enum(["sandbox", "live"]).default("sandbox"),
  PAYMOB_API_KEY: z.string().min(1).optional(),
  SENTRY_DSN: z.url().optional(),
  POSTHOG_KEY: z.string().min(1).optional(),
  POSTHOG_HOST: z.url().default("https://us.i.posthog.com"),
});

/** Variables that are optional until their milestone (AI in M6, Paymob in M7) or locally (observability) but mandatory in production. */
export const PRODUCTION_REQUIRED_KEYS = [
  "AI_MODEL_ANALYZE",
  "AI_API_KEY",
  "PAYMOB_API_KEY",
  "SENTRY_DSN",
  "POSTHOG_KEY",
] as const;

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

/** Build information reported by the health endpoint; it never depends on required variables. */
export interface BuildInfo {
  /** Deployment environment name (local, preview, staging, production...). */
  readonly environment: string;
  /** Release version of the running build. */
  readonly version: string;
  /** Git commit the build was made from, or "unknown". */
  readonly gitSha: string;
}

/**
 * Reads the build information without validating the rest of the configuration, so a liveness check
 * still answers when a secret is missing. The SHA comes from GIT_SHA, then Vercel's VERCEL_GIT_COMMIT_SHA.
 *
 * @param source - Key/value map to read from (defaults to process.env).
 * @returns Environment, version and git SHA with their defaults.
 * @example
 * loadBuildInfo({ APP_ENV: "staging", VERCEL_GIT_COMMIT_SHA: "abc123" }).gitSha; // "abc123"
 */
export function loadBuildInfo(source: Record<string, string | undefined> = process.env): BuildInfo {
  return {
    environment: source.APP_ENV || "local",
    version: source.APP_VERSION || "dev",
    gitSha: source.GIT_SHA || source.VERCEL_GIT_COMMIT_SHA || "unknown",
  };
}

/** Browser-safe configuration handed to client components at request time (the DSN and project key are public by design). */
export interface PublicConfig {
  /** Sentry DSN, or undefined when error reporting is off. */
  readonly sentryDsn: string | undefined;
  /** PostHog project key, or undefined when analytics is off. */
  readonly posthogKey: string | undefined;
  /** PostHog ingestion host. */
  readonly posthogHost: string;
  /** Supabase project URL for the browser auth client, or undefined when not configured (public by design). */
  readonly supabaseUrl: string | undefined;
  /** Supabase anon key for the browser auth client (public by design; RLS protects the data, ADR-025). */
  readonly supabaseAnonKey: string | undefined;
  /** Whether the Google sign-in button is shown (AUTH_GOOGLE_ENABLED, default false). */
  readonly authGoogleEnabled: boolean;
  /** Deployment environment name. */
  readonly appEnv: string;
  /** Release identifier (git SHA) so events map to a deploy. */
  readonly release: string;
}

/**
 * Reads only the browser-safe subset of the configuration at runtime (not inlined at build time,
 * so one build runs in every environment, ADR-004). Never returns secrets.
 *
 * @param source - Key/value map to read from (defaults to process.env).
 * @returns Public configuration for the browser SDKs.
 * @example
 * loadPublicConfig({ APP_ENV: "staging", POSTHOG_KEY: "phc_x" }).posthogKey; // "phc_x"
 */
export function loadPublicConfig(source: Record<string, string | undefined> = process.env): PublicConfig {
  return {
    sentryDsn: source.SENTRY_DSN || undefined,
    posthogKey: source.POSTHOG_KEY || undefined,
    posthogHost: source.POSTHOG_HOST || "https://us.i.posthog.com",
    supabaseUrl: source.SUPABASE_URL || undefined,
    supabaseAnonKey: source.SUPABASE_ANON_KEY || undefined,
    authGoogleEnabled: source.AUTH_GOOGLE_ENABLED === "true",
    appEnv: source.APP_ENV || "local",
    release: loadBuildInfo(source).gitSha,
  };
}
