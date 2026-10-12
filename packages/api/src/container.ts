/** Composition root: the only place that chooses which adapter implements each port (ADR-006). */
import {
  loadBuildInfo,
  loadDatabaseUrl,
  loadPhoneConfig,
  loadPublicConfig,
  type BuildInfo,
  type PhoneConfig,
} from "@tafsila/config";
import { createNoopAnalytics } from "./adapters/noop/noop-analytics";
import { createNoopErrorReporter } from "./adapters/noop/noop-error-reporter";
import {
  createRejectingTokenVerifier,
  createJwksTokenVerifier,
} from "./adapters/supabase/jwks-token-verifier";
import { createUnlimitedPlanLimits } from "./adapters/plan/unlimited-plan-limits";
import { createClientRepository } from "./adapters/supabase/client-repository";
import { createGotruePhoneOtp } from "./adapters/supabase/gotrue-phone-otp";
import {
  createPhoneVerificationRepository,
  createTrialEligibility,
} from "./adapters/supabase/phone-verification-repository";
import { createWithApiRole, createWithUser } from "./adapters/supabase/with-user";
import { createHmacPhoneHasher, createRejectingPhoneHasher } from "./adapters/system/hmac-phone-hasher";
import { createMeasurementSetRepository } from "./adapters/supabase/measurement-set-repository";
import { createRejectingRepositories, type Repositories } from "./adapters/supabase/rejecting-repositories";
import { createPosthogAnalytics } from "./adapters/posthog/posthog-analytics";
import { createSentryErrorReporter } from "./adapters/sentry/sentry-error-reporter";
import { createSystemClock } from "./adapters/system/system-clock";
import type { Analytics } from "./ports/analytics";
import type { Clock } from "./ports/clock";
import type { ClientRepository } from "./ports/client-repository";
import type { ErrorReporter } from "./ports/error-reporter";
import type { MeasurementSetRepository } from "./ports/measurement-set-repository";
import type { PhoneHasher } from "./ports/phone-hasher";
import type { PhoneOtp } from "./ports/phone-otp";
import type { PhoneVerificationRepository } from "./ports/phone-verification-repository";
import type { PlanLimits } from "./ports/plan-limits";
import type { TrialEligibility } from "./ports/trial-eligibility";
import type { PhoneRules } from "./services/phone-shared";
import type { TokenVerifier } from "./ports/token-verifier";

/** Build information reported by the health endpoint. */
export type AppInfo = BuildInfo;

/** Everything the routes and services need, wired once per process. */
export interface Container {
  /** Time source. */
  readonly clock: Clock;
  /** Build information. */
  readonly appInfo: AppInfo;
  /** Where unexpected errors are reported. */
  readonly errorReporter: ErrorReporter;
  /** Where server-side product events go. */
  readonly analytics: Analytics;
  /** Verifies Supabase access tokens for protected routes. */
  readonly tokenVerifier: TokenVerifier;
  /** The signed-in user's clients. */
  readonly clients: ClientRepository;
  /** The signed-in user's saved measurement sets. */
  readonly measurementSets: MeasurementSetRepository;
  /** What the user's plan allows (unlimited until M7). */
  readonly planLimits: PlanLimits;
  /** Sends and checks phone codes. */
  readonly phoneOtp: PhoneOtp;
  /** Keyed hashes of phones and IPs. */
  readonly phoneHasher: PhoneHasher;
  /** Phone verification state, rate-limit events and the confirm write. */
  readonly phoneVerification: PhoneVerificationRepository;
  /** Whether an account may receive its free trial (read by M7). */
  readonly trialEligibility: TrialEligibility;
  /** Test-number guard for the current environment. */
  readonly phoneRules: PhoneRules;
}

/**
 * Chooses the repositories: Drizzle on DATABASE_URL, otherwise ones that fail with INTERNAL_ERROR,
 * so a missing URL can never silently fall back to memory in production.
 *
 * @param source - Environment variables to read (defaults to process.env).
 * @returns The repositories and database-backed ports.
 */
export function createRepositories(source: Record<string, string | undefined> = process.env): Repositories {
  const databaseUrl = loadDatabaseUrl(source);
  if (!databaseUrl) return createRejectingRepositories();
  const withUser = createWithUser(databaseUrl);
  const withApiRole = createWithApiRole(databaseUrl);
  return {
    phoneVerification: createPhoneVerificationRepository(withApiRole),
    trialEligibility: createTrialEligibility(withApiRole),
    clients: createClientRepository(withUser),
    measurementSets: createMeasurementSetRepository(withUser),
  };
}

/**
 * Chooses the token verifier: the project's JWKS when SUPABASE_URL is set, otherwise one that rejects everything.
 *
 * @param source - Environment variables to read (defaults to process.env).
 * @returns The token verifier for this environment.
 */
export function createTokenVerifier(source: Record<string, string | undefined> = process.env): TokenVerifier {
  const { supabaseUrl } = loadPublicConfig(source);
  return supabaseUrl ? createJwksTokenVerifier({ supabaseUrl }) : createRejectingTokenVerifier();
}

/**
 * Chooses the phone adapters: GoTrue when Supabase is configured, the keyed hasher when PHONE_HASH_SECRET is set.
 * Missing configuration fails the request (INTERNAL_ERROR), never silently falls back.
 *
 * @param source - Environment variables to read (defaults to process.env).
 * @returns The OTP sender, the hasher and the test-number rules.
 */
export function createPhoneServices(
  source: Record<string, string | undefined> = process.env,
): Pick<Container, "phoneOtp" | "phoneHasher" | "phoneRules"> {
  const { supabaseUrl, supabaseAnonKey } = loadPublicConfig(source);
  let phone: PhoneConfig;
  try {
    phone = loadPhoneConfig(source);
  } catch (error) {
    // A bad phone configuration must not take the whole API down: only the phone routes fail (INTERNAL_ERROR).
    console.error(JSON.stringify({ level: "error", message: (error as Error).message }));
    return {
      phoneOtp: createRejectingPhoneOtp(),
      phoneHasher: createRejectingPhoneHasher(),
      phoneRules: { testOnly: true, testNumbers: [] },
    };
  }
  return {
    phoneOtp:
      supabaseUrl && supabaseAnonKey
        ? createGotruePhoneOtp({ supabaseUrl, anonKey: supabaseAnonKey })
        : createRejectingPhoneOtp(),
    phoneHasher: phone.hashSecret ? createHmacPhoneHasher(phone.hashSecret) : createRejectingPhoneHasher(),
    phoneRules: { testOnly: phone.testOnly, testNumbers: phone.testNumbers },
  };
}

/**
 * Creates a PhoneOtp that fails on use, for environments without Supabase configuration.
 *
 * @returns A PhoneOtp whose calls reject.
 */
function createRejectingPhoneOtp(): PhoneOtp {
  /**
   * Always rejects.
   *
   * @returns A rejected promise.
   */
  const fail = (): Promise<never> =>
    Promise.reject(new Error("SUPABASE_URL or SUPABASE_ANON_KEY is not configured"));
  return { send: fail, verify: fail };
}

/**
 * Chooses the real or no-op observability adapters from the configuration keys.
 *
 * @param source - Environment variables to read (defaults to process.env).
 * @returns The error reporter and analytics for this environment.
 */
export function createObservability(
  source: Record<string, string | undefined> = process.env,
): Pick<Container, "errorReporter" | "analytics"> {
  const config = loadPublicConfig(source);
  return {
    errorReporter:
      config.sentryDsn && URL.canParse(config.sentryDsn)
        ? createSentryErrorReporter({
            dsn: config.sentryDsn,
            environment: config.appEnv,
            release: config.release,
          })
        : createNoopErrorReporter(),
    analytics: config.posthogKey
      ? createPosthogAnalytics(config.posthogKey, config.posthogHost)
      : createNoopAnalytics(),
  };
}

/**
 * Wires real adapters for the running environment; tests pass overrides with fakes.
 *
 * @param overrides - Ports to replace (e.g. a fixed clock in tests).
 * @returns The dependency container.
 */
export function createContainer(overrides: Partial<Container> = {}): Container {
  return {
    clock: createSystemClock(),
    appInfo: loadBuildInfo(),
    ...createObservability(),
    tokenVerifier: createTokenVerifier(),
    ...createRepositories(),
    planLimits: createUnlimitedPlanLimits(),
    ...createPhoneServices(),
    ...overrides,
  };
}
