/** Test helper: the real app wired with memory repositories and a local-key token verifier (no network, no database). */
import { createFakePaymentGateway, type FakePaymentConfig } from "../adapters/fake-payment/fake-gateway";
import { loadPaymentConfig } from "@tafsila/config";
import { createMemoryAiUsageRepository, type MemoryAiUsage } from "../adapters/memory/ai-usage-repository";
import { createMemoryPhotoDownloader, type MemoryPhotoDownloader } from "../adapters/memory/photo-downloader";
import { createInlineJobQueue, type InlineJobQueue } from "../adapters/memory/inline-job-queue";
import {
  createMemoryUnsupportedFeatures,
  type UnsupportedFeatureRow,
  type MemoryUnsupportedFeatures,
} from "../adapters/memory/unsupported-feature-repository";
import { createFakeAi, type AiDeps } from "@tafsila/ai";
import { loadJobsConfig, type JobsConfig } from "@tafsila/config";
import { runDesignAnalysis } from "../services/run-design-analysis";
import { createMemoryPhotoStorage, type MemoryPhotoStorage } from "../adapters/memory/photo-storage";
import { createMemoryAdminRepository } from "../adapters/memory/admin-repository";
import { createMemoryAccountDeletion, type MemoryAccountDeletion } from "../adapters/memory/account-deletion";
import { createMemoryProfileRepository } from "../adapters/memory/profile-repository";
import { createMemoryChatRepository } from "../adapters/memory/chat-repository";
import { createMemoryClientRepository } from "../adapters/memory/client-repository";
import { createMemoryDesignRepository } from "../adapters/memory/design-repository";
import { createMemoryPatternVersionRepository } from "../adapters/memory/pattern-version-repository";
import { createMemoryMeasurementSetRepository } from "../adapters/memory/measurement-set-repository";
import { createMemoryPhoneOtp, type MemoryPhoneOtp } from "../adapters/memory/phone-otp";
import {
  createMemoryPhoneVerification,
  type MemoryPhoneVerification,
} from "../adapters/memory/phone-verification-repository";
import { createMemoryFabricCalcRepository } from "../adapters/memory/fabric-calc-repository";
import { createMemoryFabricExplanationRepository } from "../adapters/memory/fabric-explanation-repository";
import {
  createMemoryFabricRepository,
  createMemoryFabricRuleRepository,
} from "../adapters/memory/fabric-repository";
import { createMemorySizeChartRepository } from "../adapters/memory/size-chart-repository";
import { createHmacPhoneHasher } from "../adapters/system/hmac-phone-hasher";
import { createMemoryStore, type MemoryStore } from "../adapters/memory/memory-store";
import { createUnlimitedPlanLimits } from "../adapters/plan/unlimited-plan-limits";
import { createJwksTokenVerifier } from "../adapters/supabase/jwks-token-verifier";
import { createApp } from "../app";
import { createContainer, type Container } from "../container";
import type { AuthContext } from "../ports/token-verifier";
import { createTestAuthKeys, TEST_SUPABASE_URL, type TestAuthKeys } from "./auth-keys";

/** Test numbers the memory app accepts. */
export const TEST_PHONES = ["+201000000005", "+201000000006", "+201000000007"];

/** Two fixed users for permission tests. */
export const USER_A = "aaaaaaaa-0000-4000-8000-00000000000a";
export const USER_B = "bbbbbbbb-0000-4000-8000-00000000000b";

/**
 * Builds an AuthContext for service tests.
 *
 * @param userId - The caller's id.
 * @returns A verified-looking context.
 */
export function authFor(userId: string): AuthContext {
  return { userId, role: "user", claims: { sub: userId } };
}

/** The app plus helpers to call it as a user. */
export interface MemoryApp {
  readonly app: ReturnType<typeof createApp>;
  readonly store: MemoryStore;
  /** Memory phone code sender (records numbers, can fail the next send). */
  readonly phoneOtp: MemoryPhoneOtp;
  /** Memory phone verification state (can delete accounts and grant trials). */
  readonly phones: MemoryPhoneVerification;
  /** Memory account deletion ports (call log, failure switch, fake storage). */
  readonly deletion: MemoryAccountDeletion;
  /** Memory photo storage; shares its objects with `deletion.files` so account deletion can be checked. */
  readonly photos: MemoryPhotoStorage;
  /** Memory AI usage rows. */
  readonly aiUsage: MemoryAiUsage;
  /** Memory unsupported feature rows. */
  readonly unsupported: MemoryUnsupportedFeatures;
  /** Memory photo downloader (serves a JPEG with GPS data; records the URLs). */
  readonly downloader: MemoryPhotoDownloader;
  /** The inline job queue; with `deferredJobs` it holds jobs until `drain()`. */
  readonly jobs: InlineJobQueue;
  /** Calls the API with a bearer token of `userId` (or none when undefined). */
  call(userId: string | undefined, method: string, path: string, body?: unknown): Promise<Response>;
  /** Like `call`, with a token that also carries the given role and email claims. */
  callAs(
    who: { userId: string; role?: string; email?: string },
    method: string,
    path: string,
    body?: unknown,
  ): Promise<Response>;
}

/**
 * The memory repositories on one shared fake database.
 *
 * @param store - Shared fake database.
 * @param features - Unsupported-feature rows the admin list reads.
 * @returns The repositories for the container.
 */
function memoryRepositories(
  store: MemoryStore,
  features: readonly UnsupportedFeatureRow[],
): Partial<Container> {
  return {
    clients: createMemoryClientRepository(store),
    designs: createMemoryDesignRepository(store),
    versions: createMemoryPatternVersionRepository(store),
    chat: createMemoryChatRepository(store),
    measurementSets: createMemoryMeasurementSetRepository(store),
    sizeCharts: createMemorySizeChartRepository(store),
    fabrics: createMemoryFabricRepository(store),
    fabricRules: createMemoryFabricRuleRepository(store),
    fabricCalcs: createMemoryFabricCalcRepository(store),
    fabricExplanations: createMemoryFabricExplanationRepository(store),
    profiles: createMemoryProfileRepository(store),
    admin: createMemoryAdminRepository(store, {}, features),
  };
}

/**
 * The memory ports of the AI analysis: usage rows, unsupported features and the photo downloader.
 *
 * @returns The three fakes.
 */
function memoryAiParts(): {
  aiUsage: MemoryAiUsage;
  unsupported: MemoryUnsupportedFeatures;
  downloader: MemoryPhotoDownloader;
} {
  return {
    aiUsage: createMemoryAiUsageRepository(),
    unsupported: createMemoryUnsupportedFeatures(),
    downloader: createMemoryPhotoDownloader(),
  };
}

/** Options of the memory app that are not container parts. */
export interface MemoryAppOptions {
  /** Hold background jobs until `jobs.drain()` so a test can see the `pending` state. */
  readonly deferredJobs?: boolean;
  /** AI dependencies for the analysis job (defaults to the fake provider). */
  readonly ai?: AiDeps;
  /** Changes to the jobs configuration (the daily cap, the rate limit). */
  readonly jobsConfig?: Partial<JobsConfig>;
}

/** Who a test request is made as: a user id and optional role and email claims. */
type Caller = { userId: string; role?: string; email?: string };

/**
 * Builds the function that sends one request to the app, signing a token for the caller when given.
 *
 * @param app - The app under test.
 * @param keys - Local keys that sign test tokens.
 * @returns A function taking the caller, method, path (under /api) and an optional JSON body.
 */
function createSender(
  app: ReturnType<typeof createApp>,
  keys: TestAuthKeys,
): (who: Caller | undefined, method: string, path: string, body?: unknown) => Promise<Response> {
  return async (who, method, path, body) => {
    const headers: Record<string, string> = body === undefined ? {} : { "content-type": "application/json" };
    if (who)
      headers.authorization = `Bearer ${await keys.sign({ sub: who.userId, role: who.role, email: who.email })}`;
    return app.request(`/api${path}`, {
      method,
      headers,
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
  };
}

/**
 * Creates the app with memory repositories.
 *
 * @param overrides - Container parts to replace (e.g. plan limits that deny).
 * @param options - Job queue mode, AI dependencies and limits.
 * @returns The app and a `call` helper.
 */
export async function createMemoryApp(
  overrides: Partial<Container> = {},
  options: MemoryAppOptions = {},
): Promise<MemoryApp> {
  const keys: TestAuthKeys = await createTestAuthKeys();
  const store = createMemoryStore();
  const phoneOtp = createMemoryPhoneOtp();
  const phones = createMemoryPhoneVerification({ now: () => new Date() });
  const deletion = createMemoryAccountDeletion(store);
  const photos = createMemoryPhotoStorage(deletion.objects);
  const { aiUsage, unsupported, downloader } = memoryAiParts();
  const jobs = createInlineJobQueue((_name, payload) => runDesignAnalysis(container, payload), {
    deferred: options.deferredJobs,
  });
  const container: Container = createContainer({
    jobsConfig: { ...loadJobsConfig({}), ...options.jobsConfig },
    jobQueue: jobs,
    unsupportedFeatures: unsupported,
    photoDownloader: downloader,
    aiDeps: () => options.ai ?? createFakeAi(),
    paymentGateway: createFakePaymentGateway(loadPaymentConfig({}) as FakePaymentConfig, () => undefined),
    tokenVerifier: createJwksTokenVerifier({ supabaseUrl: TEST_SUPABASE_URL, keys: keys.keys }),
    ...memoryRepositories(store, unsupported.rows),
    accountDeleter: deletion.accountDeleter,
    userFilesRemover: deletion.userFilesRemover,
    identityEraser: deletion.identityEraser,
    accountAudit: deletion.accountAudit,
    photoStorage: photos,
    aiUsage,
    planLimits: createUnlimitedPlanLimits(),
    phoneOtp,
    phoneHasher: createHmacPhoneHasher("memory-app-phone-hash-secret-0123456789"),
    phoneVerification: phones,
    trialEligibility: phones,
    phoneRules: { testOnly: true, testNumbers: TEST_PHONES },
    ...overrides,
  });
  const app = createApp(container);
  const send = createSender(app, keys);
  return {
    app,
    store,
    phoneOtp,
    phones,
    deletion,
    photos,
    aiUsage,
    unsupported,
    downloader,
    jobs,
    call: (userId, method, path, body) => send(userId ? { userId } : undefined, method, path, body),
    callAs: (who, method, path, body) => send(who, method, path, body),
  };
}
