/**
 * Throwaway API for `pnpm api:test`: real routes, a local key pair instead of Supabase, a random port.
 * Prints one JSON line `{"baseUrl","accessToken"}` on stdout. `--break=health` makes /api/health answer 500
 * (used only to prove that the Newman run catches a broken route).
 */
import { serve } from "@hono/node-server";
import type { AddressInfo } from "node:net";
import { createApp } from "../app";
import { createContainer } from "../container";
import { createMemoryClientRepository } from "../adapters/memory/client-repository";
import { createMemoryMeasurementSetRepository } from "../adapters/memory/measurement-set-repository";
import { createMemoryStore } from "../adapters/memory/memory-store";
import { createMemoryPhoneOtp } from "../adapters/memory/phone-otp";
import { createMemoryPhoneVerification } from "../adapters/memory/phone-verification-repository";
import { createHmacPhoneHasher } from "../adapters/system/hmac-phone-hasher";
import { createJwksTokenVerifier } from "../adapters/supabase/jwks-token-verifier";
import { createTestAuthKeys, TEST_SUPABASE_URL } from "../test-support/auth-keys";

const HTTP_SERVER_ERROR = 500;
const keys = await createTestAuthKeys();
const store = createMemoryStore();
const phones = createMemoryPhoneVerification({ now: () => new Date() });
const app = createApp(
  createContainer({
    appInfo: { environment: "test", version: "test", gitSha: "test" },
    clients: createMemoryClientRepository(store),
    measurementSets: createMemoryMeasurementSetRepository(store),
    phoneOtp: createMemoryPhoneOtp(),
    phoneHasher: createHmacPhoneHasher("postman-newman-phone-secret-0123456789"),
    phoneVerification: phones,
    trialEligibility: phones,
    phoneRules: { testOnly: true, testNumbers: ["+201000000005"] },
    tokenVerifier: createJwksTokenVerifier({ supabaseUrl: TEST_SUPABASE_URL, keys: keys.keys }),
  }),
);
const breakHealth = process.argv.includes("--break=health");

const server = serve(
  {
    port: 0,
    hostname: "127.0.0.1",
    fetch: (request) =>
      breakHealth && new URL(request.url).pathname === "/api/health"
        ? new Response("broken on purpose", { status: HTTP_SERVER_ERROR })
        : app.fetch(request),
  },
  (info: AddressInfo) => {
    const baseUrl = "http://127.0.0.1:" + String(info.port);
    void keys.sign({ role: "user" }).then((accessToken) => {
      process.stdout.write(JSON.stringify({ baseUrl, accessToken }) + "\n");
    });
  },
);
process.on("SIGTERM", () => server.close(() => process.exit(0)));
