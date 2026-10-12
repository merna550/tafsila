/** Test helper: the real app wired with memory repositories and a local-key token verifier (no network, no database). */
import { createMemoryClientRepository } from "../adapters/memory/client-repository";
import { createMemoryMeasurementSetRepository } from "../adapters/memory/measurement-set-repository";
import { createMemoryStore, type MemoryStore } from "../adapters/memory/memory-store";
import { createUnlimitedPlanLimits } from "../adapters/plan/unlimited-plan-limits";
import { createJwksTokenVerifier } from "../adapters/supabase/jwks-token-verifier";
import { createApp } from "../app";
import { createContainer, type Container } from "../container";
import type { AuthContext } from "../ports/token-verifier";
import { createTestAuthKeys, TEST_SUPABASE_URL, type TestAuthKeys } from "./auth-keys";

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
  /** Calls the API with a bearer token of `userId` (or none when undefined). */
  call(userId: string | undefined, method: string, path: string, body?: unknown): Promise<Response>;
}

/**
 * Creates the app with memory repositories.
 *
 * @param overrides - Container parts to replace (e.g. plan limits that deny).
 * @returns The app and a `call` helper.
 */
export async function createMemoryApp(overrides: Partial<Container> = {}): Promise<MemoryApp> {
  const keys: TestAuthKeys = await createTestAuthKeys();
  const store = createMemoryStore();
  const app = createApp(
    createContainer({
      tokenVerifier: createJwksTokenVerifier({ supabaseUrl: TEST_SUPABASE_URL, keys: keys.keys }),
      clients: createMemoryClientRepository(store),
      measurementSets: createMemoryMeasurementSetRepository(store),
      planLimits: createUnlimitedPlanLimits(),
      ...overrides,
    }),
  );
  return {
    app,
    store,
    async call(userId, method, path, body) {
      const headers: Record<string, string> =
        body === undefined ? {} : { "content-type": "application/json" };
      if (userId) headers.authorization = `Bearer ${await keys.sign({ sub: userId })}`;
      return app.request(`/api${path}`, {
        method,
        headers,
        ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      });
    },
  };
}
