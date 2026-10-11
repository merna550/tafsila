import { beforeAll, describe, expect, it } from "vitest";
import { createJwksTokenVerifier } from "../adapters/supabase/jwks-token-verifier";
import { createApp } from "../app";
import { createContainer, createTokenVerifier } from "../container";
import { Hono } from "hono";
import { requireAuth, requireRole, type AuthedEnv } from "../middleware/auth";
import { createErrorHandler } from "../middleware/error-handler";
import { requestId, type AppEnv } from "../middleware/request-id";
import { createNoopErrorReporter } from "../adapters/noop/noop-error-reporter";
import { createTestAuthKeys, TEST_SUPABASE_URL, type TestAuthKeys } from "../test-support/auth-keys";

let k: TestAuthKeys;
let app: ReturnType<typeof createApp>;
let adminGate: Hono<AppEnv>;

beforeAll(async () => {
  k = await createTestAuthKeys();
  const verifier = createJwksTokenVerifier({ supabaseUrl: TEST_SUPABASE_URL, keys: k.keys });
  app = createApp(createContainer({ tokenVerifier: verifier }));
  adminGate = new Hono<AppEnv>();
  adminGate.use(requestId());
  adminGate.route(
    "/",
    new Hono<AuthedEnv>().get("/admin", requireAuth(verifier), requireRole("admin"), (c) =>
      c.json({ ok: true }),
    ),
  );
  adminGate.onError(createErrorHandler(createNoopErrorReporter()));
});

const bearer = (token: string): RequestInit => ({ headers: { authorization: `Bearer ${token}` } });

async function expect401(res: Response): Promise<void> {
  expect(res.status).toBe(401);
  const body = (await res.json()) as Record<string, string>;
  expect(body.code).toBe("UNAUTHENTICATED");
  expect(body.message_ar).toBeTruthy();
  expect(body.message_en).toBeTruthy();
  expect(body.request_id).toBeTruthy();
}

describe("GET /api/me", () => {
  it("returns userId and role for a valid token", async () => {
    const res = await app.request("/api/me", bearer(await k.sign({ sub: "u-1", role: "admin" })));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ userId: "u-1", role: "admin" });
  });

  it("treats a missing role claim as user", async () => {
    const res = await app.request("/api/me", bearer(await k.sign()));
    expect(await res.json()).toMatchObject({ role: "user" });
  });

  it("rejects a missing header", async () => expect401(await app.request("/api/me")));

  it("rejects a malformed header and a garbage token", async () => {
    await expect401(await app.request("/api/me", { headers: { authorization: "Token abc" } }));
    await expect401(await app.request("/api/me", bearer("not-a-jwt")));
  });

  it("rejects an expired token", async () => {
    await expect401(await app.request("/api/me", bearer(await k.sign({ expiresIn: -60 }))));
  });

  it("rejects a token signed with another key", async () => {
    await expect401(await app.request("/api/me", bearer(await k.sign({}, k.foreignKey))));
  });

  it("rejects another project's issuer and a wrong audience", async () => {
    await expect401(
      await app.request("/api/me", bearer(await k.sign({ issuer: "https://other.supabase.co/auth/v1" }))),
    );
    await expect401(await app.request("/api/me", bearer(await k.sign({ audience: "anon" }))));
  });

  it("fails closed when Supabase is not configured", async () => {
    const closed = createApp(createContainer({ tokenVerifier: createTokenVerifier({}) }));
    await expect401(await closed.request("/api/me", bearer(await k.sign())));
  });
});

describe("requireRole", () => {
  it("returns 403 FORBIDDEN for a user and passes an admin", async () => {
    const denied = await adminGate.request("/admin", bearer(await k.sign({ role: "user" })));
    expect(denied.status).toBe(403);
    expect(((await denied.json()) as Record<string, string>).code).toBe("FORBIDDEN");
    const ok = await adminGate.request("/admin", bearer(await k.sign({ role: "admin" })));
    expect(ok.status).toBe(200);
  });
});
