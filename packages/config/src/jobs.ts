/** Background job and AI cost-control settings (issue #340, decision 340): which queue runs jobs, the Inngest keys and the two caps. */
import { z } from "zod";
import { APP_ENVIRONMENTS } from "./app-env";

/** Where background jobs run (decision 340): `inline` inside the request (local, CI, fake provider), `inngest` in staging and production. */
export const JOB_QUEUES = ["inline", "inngest"] as const;

/** A job queue name. */
export type JobQueueName = (typeof JOB_QUEUES)[number];

/** Environments where `JOB_QUEUE=inngest` needs its keys (local and preview use the Inngest dev server without keys). */
const INNGEST_KEYS_REQUIRED_ENVS = ["staging", "production"] as const;

/**
 * A text number that must be a positive whole number (limits come from env as text).
 *
 * @param name - Variable name, for the error message.
 * @returns A Zod schema that parses to a positive integer.
 */
export function positiveInt(name: string): z.ZodCoercedNumber {
  return z.coerce
    .number()
    .int()
    .positive({ message: `${name} must be a positive whole number` });
}

/**
 * Applies the job queue rule: `inngest` needs both keys in staging and production.
 *
 * @param env - The parsed variables.
 * @param ctx - Zod refinement context.
 */
export function refineJobQueueEnv(
  env: { APP_ENV: string; JOB_QUEUE: string; INNGEST_EVENT_KEY?: string; INNGEST_SIGNING_KEY?: string },
  ctx: z.RefinementCtx,
): void {
  if (env.JOB_QUEUE !== "inngest" || !(INNGEST_KEYS_REQUIRED_ENVS as readonly string[]).includes(env.APP_ENV))
    return;
  for (const key of ["INNGEST_EVENT_KEY", "INNGEST_SIGNING_KEY"] as const) {
    if (env[key] === undefined) {
      ctx.addIssue({
        code: "custom",
        path: [key],
        message: `${key} is required when JOB_QUEUE=inngest in ${env.APP_ENV}`,
      });
    }
  }
}

/** Default analyses a user may start per UTC day (decision 340, 3). */
export const DEFAULT_AI_ANALYZE_DAILY_LIMIT = 10;

/** Default analysis requests a user may send per minute (decision 340, 3). */
export const DEFAULT_AI_RATE_LIMIT_PER_MINUTE = 5;

/** Background job and AI cost-control settings (decision 340). */
export interface JobsConfig {
  /** Where jobs run. */
  readonly queue: JobQueueName;
  /** Environment name; staging and production talk to Inngest Cloud, the others to the dev server. */
  readonly appEnv: string;
  /** Inngest event key (sending events); undefined for the dev server. */
  readonly inngestEventKey: string | undefined;
  /** Inngest signing key (checking that a run request is from Inngest); undefined for the dev server. */
  readonly inngestSigningKey: string | undefined;
  /** Analyses a user may start per UTC day. */
  readonly analyzeDailyLimit: number;
  /** Analysis requests a user may send per minute. */
  readonly rateLimitPerMinute: number;
}

/**
 * Reads the job queue and cost-control settings without validating the rest of the configuration.
 *
 * @param source - Key/value map to read from (defaults to process.env).
 * @returns Queue, Inngest keys and the two caps, with defaults (`inline`, 10 per day, 5 per minute).
 * @throws {Error} When a value is invalid, or `inngest` in staging or production lacks a key.
 * @example
 * loadJobsConfig({}).queue; // "inline"
 */
export function loadJobsConfig(source: Record<string, string | undefined> = process.env): JobsConfig {
  const result = z
    .object({
      APP_ENV: z.enum(APP_ENVIRONMENTS).default("local"),
      JOB_QUEUE: z.enum(JOB_QUEUES).default("inline"),
      INNGEST_EVENT_KEY: z.string().min(1).optional(),
      INNGEST_SIGNING_KEY: z.string().min(1).optional(),
      AI_ANALYZE_DAILY_LIMIT: positiveInt("AI_ANALYZE_DAILY_LIMIT").default(DEFAULT_AI_ANALYZE_DAILY_LIMIT),
      AI_RATE_LIMIT_PER_MINUTE: positiveInt("AI_RATE_LIMIT_PER_MINUTE").default(
        DEFAULT_AI_RATE_LIMIT_PER_MINUTE,
      ),
    })
    .superRefine(refineJobQueueEnv)
    .safeParse({
      APP_ENV: source.APP_ENV || undefined,
      JOB_QUEUE: source.JOB_QUEUE || undefined,
      INNGEST_EVENT_KEY: source.INNGEST_EVENT_KEY || undefined,
      INNGEST_SIGNING_KEY: source.INNGEST_SIGNING_KEY || undefined,
      AI_ANALYZE_DAILY_LIMIT: source.AI_ANALYZE_DAILY_LIMIT || undefined,
      AI_RATE_LIMIT_PER_MINUTE: source.AI_RATE_LIMIT_PER_MINUTE || undefined,
    });
  if (!result.success) {
    const keys = result.error.issues.map((issue) => issue.path.join(".")).join(", ");
    throw new Error(`Invalid jobs configuration: ${keys}`);
  }
  const env = result.data;
  return {
    queue: env.JOB_QUEUE,
    appEnv: env.APP_ENV,
    inngestEventKey: env.INNGEST_EVENT_KEY,
    inngestSigningKey: env.INNGEST_SIGNING_KEY,
    analyzeDailyLimit: env.AI_ANALYZE_DAILY_LIMIT,
    rateLimitPerMinute: env.AI_RATE_LIMIT_PER_MINUTE,
  };
}
