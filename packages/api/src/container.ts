/** Composition root: the only place that chooses which adapter implements each port (ADR-006). */
import type { AiDeps } from "@tafsila/ai";
import {
  loadAccountErasureConfig,
  loadAiConfig,
  loadJobsConfig,
  type JobsConfig,
  loadBuildInfo,
  loadDatabaseUrl,
  loadPhoneConfig,
  loadPublicConfig,
  type BuildInfo,
  type PhoneConfig,
} from "@tafsila/config";
import type { Inngest } from "inngest";
import { createInngestClient } from "./adapters/inngest/inngest-client";
import { createInngestJobQueue } from "./adapters/inngest/inngest-job-queue";
import { createInlineJobQueue } from "./adapters/memory/inline-job-queue";
import { createFetchPhotoDownloader } from "./adapters/system/fetch-photo-downloader";
import { createUnsupportedFeatureRepository } from "./adapters/supabase/unsupported-feature-repository";
import { createNoopIdentityEraser } from "./adapters/noop/noop-identity-eraser";
import { createPosthogIdentityEraser } from "./adapters/posthog/posthog-identity-eraser";
import { createAiUsageRepository } from "./adapters/supabase/ai-usage-repository";
import { createSupabasePhotoStorage } from "./adapters/supabase/photo-storage";
import { createStorageRest } from "./adapters/supabase/storage-rest";
import { createAdminRepository } from "./adapters/supabase/admin-repository";
import { createAccountAudit } from "./adapters/supabase/account-audit";
import { createGotrueAccountDeleter } from "./adapters/supabase/gotrue-account-deleter";
import { createProfileRepository } from "./adapters/supabase/profile-repository";
import { createStorageFilesRemover } from "./adapters/supabase/storage-files-remover";
import { createNoopAnalytics } from "./adapters/noop/noop-analytics";
import { createNoopErrorReporter } from "./adapters/noop/noop-error-reporter";
import {
  createRejectingTokenVerifier,
  createJwksTokenVerifier,
} from "./adapters/supabase/jwks-token-verifier";
import { createUnlimitedPlanLimits } from "./adapters/plan/unlimited-plan-limits";
import { createClientRepository } from "./adapters/supabase/client-repository";
import { createChatRepository } from "./adapters/supabase/chat-repository";
import { createDesignRepository } from "./adapters/supabase/design-repository";
import { createPatternVersionRepository } from "./adapters/supabase/pattern-version-repository";
import { createGotruePhoneOtp } from "./adapters/supabase/gotrue-phone-otp";
import {
  createPhoneVerificationRepository,
  createTrialEligibility,
} from "./adapters/supabase/phone-verification-repository";
import { createWithApiRole, createWithUser } from "./adapters/supabase/with-user";
import { createHmacPhoneHasher, createRejectingPhoneHasher } from "./adapters/system/hmac-phone-hasher";
import { createMeasurementSetRepository } from "./adapters/supabase/measurement-set-repository";
import { createFabricCalcRepository } from "./adapters/supabase/fabric-calc-repository";
import { createFabricRepository, createFabricRuleRepository } from "./adapters/supabase/fabric-repository";
import { createSizeChartRepository } from "./adapters/supabase/size-chart-repository";
import { createRejectingRepositories, type Repositories } from "./adapters/supabase/rejecting-repositories";
import { createPosthogAnalytics } from "./adapters/posthog/posthog-analytics";
import { createSentryErrorReporter } from "./adapters/sentry/sentry-error-reporter";
import { createSystemClock } from "./adapters/system/system-clock";
import type { AiUsageRepository } from "./ports/ai-usage-repository";
import type { JobName, JobPayloads, JobQueue } from "./ports/job-queue";
import type { PhotoDownloader } from "./ports/photo-downloader";
import type { UnsupportedFeatureRepository } from "./ports/unsupported-feature-repository";
import { runDesignAnalysis } from "./services/run-design-analysis";
import type { PhotoStorage } from "./ports/photo-storage";
import type { AdminRepository } from "./ports/admin-repository";
import type { AccountAudit } from "./ports/account-audit";
import type { AccountDeleter } from "./ports/account-deleter";
import type { IdentityEraser } from "./ports/identity-eraser";
import type { ProfileRepository } from "./ports/profile-repository";
import type { UserFilesRemover } from "./ports/user-files-remover";
import type { Analytics } from "./ports/analytics";
import type { Clock } from "./ports/clock";
import type { ChatRepository } from "./ports/chat-repository";
import type { ClientRepository } from "./ports/client-repository";
import type { DesignRepository } from "./ports/design-repository";
import type { ErrorReporter } from "./ports/error-reporter";
import type { FabricCalcRepository } from "./ports/fabric-calc-repository";
import type { FabricRepository, FabricRuleRepository } from "./ports/fabric-repository";
import type { MeasurementSetRepository } from "./ports/measurement-set-repository";
import type { PatternVersionRepository } from "./ports/pattern-version-repository";
import type { PhoneHasher } from "./ports/phone-hasher";
import type { PhoneOtp } from "./ports/phone-otp";
import type { PhoneVerificationRepository } from "./ports/phone-verification-repository";
import type { PlanLimits } from "./ports/plan-limits";
import type { SizeChartRepository } from "./ports/size-chart-repository";
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
  /** The signed-in user's designs. */
  readonly designs: DesignRepository;
  /** Append-only versions of the signed-in user's designs. */
  readonly versions: PatternVersionRepository;
  /** Chat edit history of the signed-in user's designs (owner only). */
  readonly chat: ChatRepository;
  /** The signed-in user's saved measurement sets. */
  readonly measurementSets: MeasurementSetRepository;
  /** The default size chart (system data, readable by every signed-in user). */
  readonly sizeCharts: SizeChartRepository;
  /** The fabric catalogue (read by every signed-in user, written by admins). */
  readonly fabrics: FabricRepository;
  /** The fabric recommendation rules (read by every signed-in user, written by admins). */
  readonly fabricRules: FabricRuleRepository;
  /** The signed-in user's saved fabric calculations. */
  readonly fabricCalcs: FabricCalcRepository;
  /** Users and stats for the admin screens (admin only; the database checks the admin again). */
  readonly admin: AdminRepository;
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
  /** The signed-in user's name and language. */
  readonly profiles: ProfileRepository;
  /** Removes the sign-in account (service role). */
  readonly accountDeleter: AccountDeleter;
  /** Removes the user's stored files (service role). */
  readonly userFilesRemover: UserFilesRemover;
  /** Signed upload and read URLs and removal for design photos (service role, inside the adapter only). */
  readonly photoStorage: PhotoStorage;
  /** One row per AI call and the daily counts (written through the API role). */
  readonly aiUsage: AiUsageRepository;
  /** Unsupported garment features the analysis saw, for product research (written through the API role). */
  readonly unsupportedFeatures: UnsupportedFeatureRepository;
  /** Reads the bytes behind a signed photo URL. */
  readonly photoDownloader: PhotoDownloader;
  /** Starts background jobs: inline (local, CI) or Inngest (staging, production). */
  readonly jobQueue: JobQueue;
  /** The Inngest client when `JOB_QUEUE=inngest`; undefined otherwise (the `/api/inngest` route is then empty). */
  readonly inngest: Inngest | undefined;
  /** Job queue and cost-control settings (daily cap, rate limit). */
  readonly jobsConfig: JobsConfig;
  /** The AI configuration, read when a job runs (a bad one fails the job, never the app). */
  readonly aiDeps: () => AiDeps;
  /** Erases the person at the analytics provider. */
  readonly identityEraser: IdentityEraser;
  /** Records the anonymous deletion row. */
  readonly accountAudit: AccountAudit;
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
    designs: createDesignRepository(withUser),
    versions: createPatternVersionRepository(withUser),
    chat: createChatRepository(withUser),
    measurementSets: createMeasurementSetRepository(withUser),
    sizeCharts: createSizeChartRepository(withUser),
    fabrics: createFabricRepository(withUser),
    fabricRules: createFabricRuleRepository(withUser),
    fabricCalcs: createFabricCalcRepository(withUser),
    profiles: createProfileRepository(withUser),
    accountAudit: createAccountAudit(withApiRole),
    admin: createAdminRepository(withApiRole),
    aiUsage: createAiUsageRepository(withApiRole),
    unsupportedFeatures: createUnsupportedFeatureRepository(withApiRole),
  };
}

/**
 * Chooses the account deletion adapters. Without Supabase admin access they fail the request (INTERNAL_ERROR) before
 * anything irreversible happens; without PostHog credentials erasure at PostHog is skipped with a warning.
 *
 * @param source - Environment variables to read (defaults to process.env).
 * @returns The account deleter, the files remover, the identity eraser and the photo storage (also needs the service role).
 */
export function createAccountErasure(
  source: Record<string, string | undefined> = process.env,
): Pick<Container, "accountDeleter" | "userFilesRemover" | "identityEraser" | "photoStorage"> {
  const config = loadAccountErasureConfig(source);
  const admin =
    config.supabaseUrl && config.serviceRoleKey
      ? { supabaseUrl: config.supabaseUrl, serviceRoleKey: config.serviceRoleKey }
      : undefined;
  /**
   * Fails the request when Supabase admin access is not configured.
   *
   * @returns A rejected promise.
   */
  const missing = (): Promise<never> =>
    Promise.reject(new Error("SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not configured"));
  return {
    accountDeleter: admin ? createGotrueAccountDeleter(admin) : { deleteUser: missing },
    userFilesRemover: admin ? createStorageFilesRemover(admin) : { removeAll: missing },
    photoStorage: admin
      ? createSupabasePhotoStorage(createStorageRest(admin))
      : { createUploadUrls: missing, signedReadUrls: missing, remove: missing, removeDesign: missing },
    identityEraser: config.posthog ? createPosthogIdentityEraser(config.posthog) : createNoopIdentityEraser(),
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
 * Chooses the job queue: the Inngest client sends events in staging and production, otherwise jobs run inline.
 * A bad configuration must not take the API down: the queue then fails when a job is started.
 *
 * @param run - Runs one job inline (the composition root passes the services).
 * @param source - Environment variables to read (defaults to process.env).
 * @returns The jobs configuration, the queue and the Inngest client (undefined for the inline queue).
 */
export function createJobs(
  run: Parameters<typeof createInlineJobQueue>[0],
  source: Record<string, string | undefined> = process.env,
): Pick<Container, "jobsConfig" | "jobQueue" | "inngest"> {
  let jobsConfig: JobsConfig;
  try {
    jobsConfig = loadJobsConfig(source);
  } catch (error) {
    console.error(JSON.stringify({ level: "error", message: (error as Error).message }));
    jobsConfig = loadJobsConfig({});
    return {
      jobsConfig,
      inngest: undefined,
      jobQueue: { enqueue: () => Promise.reject(new Error("Invalid jobs configuration")) },
    };
  }
  if (jobsConfig.queue !== "inngest")
    return { jobsConfig, inngest: undefined, jobQueue: createInlineJobQueue(run) };
  const inngest = createInngestClient(jobsConfig);
  return { jobsConfig, inngest, jobQueue: createInngestJobQueue(inngest) };
}

/**
 * Wires real adapters for the running environment; tests pass overrides with fakes.
 *
 * @param overrides - Ports to replace (e.g. a fixed clock in tests).
 * @returns The dependency container.
 */
export function createContainer(overrides: Partial<Container> = {}): Container {
  const container: Container = {
    clock: createSystemClock(),
    appInfo: loadBuildInfo(),
    ...createObservability(),
    tokenVerifier: createTokenVerifier(),
    ...createRepositories(),
    planLimits: createUnlimitedPlanLimits(),
    ...createPhoneServices(),
    ...createAccountErasure(),
    photoDownloader: createFetchPhotoDownloader(),
    aiDeps: () => ({ config: loadAiConfig() }),
    ...createJobs((name, payload) => runJob(container, name, payload)),
    ...overrides,
  };
  return container;
}

/**
 * Runs one job with the services of the container (the inline queue calls this; the Inngest function calls the same service).
 *
 * @param container - Dependencies.
 * @param name - Job name.
 * @param payload - Job input.
 * @returns Resolves when the job has ended.
 */
function runJob<N extends JobName>(container: Container, name: N, payload: JobPayloads[N]): Promise<void> {
  return runDesignAnalysis(container, payload);
}
