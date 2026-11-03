/** Adapter test against local Supabase (`pnpm db:start`, `pnpm db:reset`); run with `pnpm --filter @tafsila/api test:db`. */
import { loadDatabaseUrl } from "@tafsila/config";
import { afterAll, describe, expect, it } from "vitest";
import type { AuthContext } from "../../ports/token-verifier";
import { createBillingRepository } from "./billing-repository";
import { createPlanLimits } from "./plan-limits";
import { createPhoneVerificationRepository } from "./phone-verification-repository";
import { createWithApiRole, createWithUser } from "./with-user";

const URL = loadDatabaseUrl() ?? "postgresql://api_app:api_app_local_only@127.0.0.1:54322/postgres";
const TRIAL = "00000000-0000-4000-8000-000000000001";
const PRO = "00000000-0000-4000-8000-000000000002";
const EMPTY = "00000000-0000-4000-8000-000000000003";
const ctxOf = (userId: string): AuthContext => ({
  userId,
  role: "user",
  claims: { sub: userId, role: "authenticated" },
});

const withApiRole = createWithApiRole(URL);
const billing = createBillingRepository(withApiRole, createWithUser(URL));
const phones = createPhoneVerificationRepository(withApiRole);
const limits = createPlanLimits(withApiRole, 10);

afterAll(() => undefined);

describe("billing repository (database)", () => {
  it("reads the seed trial user's balance and lots", async () => {
    const summary = await billing.summary(TRIAL);
    expect(summary.balance).toBe(7);
    expect(summary.lots.length).toBeGreaterThanOrEqual(1);
    expect(summary.plan).toBeNull();
  });

  it("reads the seed Pro plan and its limits, and default limits without a plan", async () => {
    expect((await billing.summary(PRO)).plan?.code).toBe("pro");
    expect(await limits.limits(ctxOf(PRO))).toEqual({ maxClients: null, chatPerDesign: 20 });
    expect(await limits.limits(ctxOf(TRIAL))).toEqual({ maxClients: 10, chatPerDesign: 10 });
  });

  it("lists the active products cheapest first", async () => {
    const items = await billing.listProducts(ctxOf(TRIAL));
    expect(items.map((p) => p.code)).toEqual(["single", "hobby", "pack5", "pro"]);
  });

  it("does not grant the trial twice", async () => {
    expect(await billing.grantTrial(TRIAL, 3)).toBe(false);
  });

  it("rolls the verification back when the trial grant fails", async () => {
    const hash = new Uint8Array(32).fill(7);
    // Zero credits make private.grant_credits raise, so the whole confirm must roll back.
    await expect(phones.confirm(EMPTY, "+201000000077", hash, 0)).rejects.toThrow();
    const status = await phones.status(ctxOf(EMPTY));
    expect(status.verified).toBe(false);
  });
});
