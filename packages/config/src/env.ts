/** Runtime configuration: every environment variable is declared and validated here (ADR-004, build once / run anywhere). */
import { z } from "zod";

/** Deployment environments the app can run in. */
export const APP_ENVIRONMENTS = ["local", "ci", "preview", "staging", "production"] as const;

/** Ten test numbers (ADR-021, decision 26-phone-otp-trial): GoTrue knows them, the code is always 123456. */
export const DEFAULT_PHONE_TEST_NUMBERS = [
  "+201000000001",
  "+201000000002",
  "+201000000003",
  "+201000000004",
  "+201000000005",
  "+201000000006",
  "+201000000007",
  "+201000000008",
  "+201000000009",
  "+201000000010",
] as const;

/** Environments that must have their own PHONE_HASH_SECRET (local and ci read it from the example files). */
const PHONE_SECRET_REQUIRED_ENVS = ["staging", "preview", "production"] as const;

/** Shortest accepted PHONE_HASH_SECRET. */
const MIN_SECRET_LENGTH = 32;

/** Phone-related variables, validated together with the rest and on their own by loadPhoneConfig. */
const phoneEnvFields = {
  APP_ENV: z.enum(APP_ENVIRONMENTS).default("local"),
  PHONE_HASH_SECRET: z.string().min(MIN_SECRET_LENGTH).optional(),
  PHONE_TEST_NUMBERS: z
    .string()
    .refine((list) => splitList(list).every((number) => /^\+\d{8,15}$/.test(number)), {
      message: "PHONE_TEST_NUMBERS must be a comma list of E.164 numbers",
    })
    .optional(),
};

/**
 * Splits a comma list, trimming blanks.
 *
 * @param list - Comma separated text.
 * @returns The non-empty items.
 */
function splitList(list: string): string[] {
  return list
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item !== "");
}

/**
 * Applies the phone rules: the secret is required outside local/ci and the test list is refused in production.
 *
 * @param env - The parsed phone variables.
 * @param ctx - Zod refinement context.
 */
function refinePhoneEnv(
  env: { APP_ENV: string; PHONE_HASH_SECRET?: string; PHONE_TEST_NUMBERS?: string },
  ctx: z.RefinementCtx,
): void {
  if ((PHONE_SECRET_REQUIRED_ENVS as readonly string[]).includes(env.APP_ENV) && !env.PHONE_HASH_SECRET) {
    ctx.addIssue({
      code: "custom",
      path: ["PHONE_HASH_SECRET"],
      message: `PHONE_HASH_SECRET is required when APP_ENV is ${env.APP_ENV}`,
    });
  }
  if (env.APP_ENV === "production" && env.PHONE_TEST_NUMBERS !== undefined) {
    ctx.addIssue({
      code: "custom",
      path: ["PHONE_TEST_NUMBERS"],
      message: "PHONE_TEST_NUMBERS is not allowed in production",
    });
  }
}

/** Fields of the server environment before the production-only rules are applied. */
const baseServerEnvSchema = z.object({
  APP_ENV: z.enum(APP_ENVIRONMENTS).default("local"),
  APP_VERSION: z.string().default("dev"),
  GIT_SHA: z.string().default("unknown"),
  VERCEL_GIT_COMMIT_SHA: z.string().min(1).optional(),
  SUPABASE_URL: z.url(),
  SUPABASE_ANON_KEY: z.string().min(1),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  DATABASE_URL: z.string().min(1).optional(),
  AUTH_GOOGLE_ENABLED: z.stringbool().default(false),
  AI_PROVIDER: z.enum(["anthropic", "google"]).default("anthropic"),
  AI_MODEL_ANALYZE: z.string().min(1).optional(),
  AI_API_KEY: z.string().min(1).optional(),
  PAYMOB_MODE: z.enum(["sandbox", "live"]).default("sandbox"),
  PAYMOB_API_KEY: z.string().min(1).optional(),
  SENTRY_DSN: z.url().optional(),
  POSTHOG_KEY: z.string().min(1).optional(),
  POSTHOG_HOST: z.url().default("https://us.i.posthog.com"),
  PHONE_HASH_SECRET: phoneEnvFields.PHONE_HASH_SECRET,
  PHONE_TEST_NUMBERS: phoneEnvFields.PHONE_TEST_NUMBERS,
  POSTHOG_PERSONAL_API_KEY: z.string().min(1).optional(),
  POSTHOG_PROJECT_ID: z.string().min(1).optional(),
});

/**
 * Applies the PostHog erasure rule: the personal API key and the project id are set together or not at all.
 *
 * @param env - The parsed variables.
 * @param ctx - Zod refinement context.
 */
function refinePosthogErasureEnv(
  env: { POSTHOG_PERSONAL_API_KEY?: string; POSTHOG_PROJECT_ID?: string },
  ctx: z.RefinementCtx,
): void {
  if ((env.POSTHOG_PERSONAL_API_KEY === undefined) === (env.POSTHOG_PROJECT_ID === undefined)) return;
  const missing =
    env.POSTHOG_PERSONAL_API_KEY === undefined ? "POSTHOG_PERSONAL_API_KEY" : "POSTHOG_PROJECT_ID";
  ctx.addIssue({
    code: "custom",
    path: [missing],
    message: "POSTHOG_PERSONAL_API_KEY and POSTHOG_PROJECT_ID must be set together",
  });
}

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
  refinePhoneEnv(env, ctx);
  refinePosthogErasureEnv(env, ctx);
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

/**
 * Reads the database connection string without validating the rest of the configuration.
 * It must use the `api_app` login role (never the superuser, which bypasses RLS; ADR-035, decision 29).
 *
 * @param source - Key/value map to read from (defaults to process.env).
 * @returns The connection string, or undefined when the API has no database configured.
 * @example
 * loadDatabaseUrl({ DATABASE_URL: "postgresql://api_app:pw@127.0.0.1:54322/postgres" });
 */
export function loadDatabaseUrl(
  source: Record<string, string | undefined> = process.env,
): string | undefined {
  return source.DATABASE_URL || undefined;
}

/** Phone verification settings (decision 26-phone-otp-trial). */
export interface PhoneConfig {
  /** Secret of the keyed hash that stores phones and IPs; undefined when not configured (the API then refuses the flow). */
  readonly hashSecret: string | undefined;
  /** Allow-list of E.164 numbers; applied whenever the environment is not production. */
  readonly testNumbers: readonly string[];
  /** True when only the test numbers may be used (every environment except production). */
  readonly testOnly: boolean;
}

/**
 * Reads the phone settings without validating the rest of the configuration.
 *
 * @param source - Key/value map to read from (defaults to process.env).
 * @returns Secret, test numbers and whether the test-only guard applies.
 * @throws {Error} When the secret is missing or too short outside local/ci, or the test list is set in production.
 * @example
 * loadPhoneConfig({ APP_ENV: "local" }).testNumbers.length; // 9
 */
export function loadPhoneConfig(source: Record<string, string | undefined> = process.env): PhoneConfig {
  const result = z
    .object(phoneEnvFields)
    .superRefine(refinePhoneEnv)
    .safeParse({
      APP_ENV: source.APP_ENV || undefined,
      PHONE_HASH_SECRET: source.PHONE_HASH_SECRET || undefined,
      PHONE_TEST_NUMBERS: source.PHONE_TEST_NUMBERS || undefined,
    });
  if (!result.success) {
    const keys = result.error.issues.map((issue) => issue.path.join(".")).join(", ");
    throw new Error(`Invalid phone configuration: ${keys}`);
  }
  const { APP_ENV, PHONE_HASH_SECRET, PHONE_TEST_NUMBERS } = result.data;
  return {
    hashSecret: PHONE_HASH_SECRET,
    testNumbers: PHONE_TEST_NUMBERS ? splitList(PHONE_TEST_NUMBERS) : DEFAULT_PHONE_TEST_NUMBERS,
    testOnly: APP_ENV !== "production",
  };
}

/** What account deletion needs beyond the database (decision 27-settings-delete-account). */
export interface AccountErasureConfig {
  /** Supabase project URL, or undefined when not configured. */
  readonly supabaseUrl: string | undefined;
  /** Service role key used only by the GoTrue and Storage deletion adapters. */
  readonly serviceRoleKey: string | undefined;
  /** PostHog person-delete credentials; undefined disables erasure at PostHog (a warning is logged per deletion). */
  readonly posthog:
    { readonly host: string; readonly personalApiKey: string; readonly projectId: string } | undefined;
}

/**
 * Reads the account deletion settings without validating the rest of the configuration.
 *
 * @param source - Key/value map to read from (defaults to process.env).
 * @returns Supabase admin access and the optional PostHog erasure credentials.
 * @throws {Error} When only one of POSTHOG_PERSONAL_API_KEY and POSTHOG_PROJECT_ID is set.
 * @example
 * loadAccountErasureConfig({ APP_ENV: "local" }).posthog; // undefined
 */
export function loadAccountErasureConfig(
  source: Record<string, string | undefined> = process.env,
): AccountErasureConfig {
  const result = z
    .object({
      POSTHOG_PERSONAL_API_KEY: z.string().min(1).optional(),
      POSTHOG_PROJECT_ID: z.string().min(1).optional(),
    })
    .superRefine(refinePosthogErasureEnv)
    .safeParse({
      POSTHOG_PERSONAL_API_KEY: source.POSTHOG_PERSONAL_API_KEY || undefined,
      POSTHOG_PROJECT_ID: source.POSTHOG_PROJECT_ID || undefined,
    });
  if (!result.success) {
    const keys = result.error.issues.map((issue) => issue.path.join(".")).join(", ");
    throw new Error(`Invalid account erasure configuration: ${keys}`);
  }
  const { POSTHOG_PERSONAL_API_KEY, POSTHOG_PROJECT_ID } = result.data;
  return {
    supabaseUrl: source.SUPABASE_URL || undefined,
    serviceRoleKey: source.SUPABASE_SERVICE_ROLE_KEY || undefined,
    posthog:
      POSTHOG_PERSONAL_API_KEY && POSTHOG_PROJECT_ID
        ? {
            host: source.POSTHOG_HOST || "https://us.i.posthog.com",
            personalApiKey: POSTHOG_PERSONAL_API_KEY,
            projectId: POSTHOG_PROJECT_ID,
          }
        : undefined,
  };
}
