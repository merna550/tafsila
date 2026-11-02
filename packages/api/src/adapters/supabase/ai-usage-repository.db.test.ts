/** Adapter test against local Supabase (`pnpm db:start`, `pnpm db:reset`); run with `pnpm --filter @tafsila/api test:db`. */
import { loadDatabaseUrl } from "@tafsila/config";
import postgres from "postgres";
import { afterAll, describe, expect, it } from "vitest";
import { createAiUsageRepository } from "./ai-usage-repository";
import { createWithApiRole } from "./with-user";

const URL = loadDatabaseUrl() ?? "postgresql://api_app:api_app_local_only@127.0.0.1:54322/postgres";
const TRIAL = "00000000-0000-4000-8000-000000000001";
const PRO = "00000000-0000-4000-8000-000000000002";
const usage = createAiUsageRepository(createWithApiRole(URL));
const raw = postgres(URL, { prepare: false });
const entry = {
  provider: "fake",
  model: "fake-1",
  inputTokens: 10,
  outputTokens: 5,
  costUsd: 0.000123,
  latencyMs: 40,
};

afterAll(async () => {
  await raw.end();
});

describe("ai usage repository (database)", () => {
  it("records a call and counts only today's calls of that user and kind", async () => {
    const before = await usage.countToday(TRIAL, "analyze", new Date());
    const beforePro = await usage.countToday(PRO, "analyze", new Date());
    await usage.record({ ...entry, userId: TRIAL, kind: "analyze" });
    await usage.record({ ...entry, userId: TRIAL, kind: "chat" });
    expect(await usage.countToday(TRIAL, "analyze", new Date())).toBe(before + 1);
    expect(await usage.countToday(PRO, "analyze", new Date())).toBe(beforePro);
    // A day far in the future starts after every row.
    expect(await usage.countToday(TRIAL, "analyze", new Date("2999-01-01T12:00:00Z"))).toBe(0);
  });
});
