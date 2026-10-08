import { describe, expect, it } from "vitest";
import { loadBuildInfo, loadServerEnv } from "./env";

const valid = {
  SUPABASE_URL: "http://127.0.0.1:54321",
  SUPABASE_ANON_KEY: "anon",
  SUPABASE_SERVICE_ROLE_KEY: "service",
};

const aiAndPaymob = { AI_MODEL_ANALYZE: "model", AI_API_KEY: "key", PAYMOB_API_KEY: "pay" };

describe("loadServerEnv", () => {
  it("applies defaults for optional variables", () => {
    const env = loadServerEnv(valid);
    expect(env.APP_ENV).toBe("local");
    expect(env.PAYMOB_MODE).toBe("sandbox");
  });

  it("lists every missing variable in one error", () => {
    expect(() => loadServerEnv({})).toThrow(/SUPABASE_URL.*SUPABASE_ANON_KEY/);
  });

  it("rejects an unknown environment name", () => {
    expect(() => loadServerEnv({ ...valid, APP_ENV: "qa" })).toThrow(/APP_ENV/);
  });

  it("starts without AI and Paymob variables outside production", () => {
    for (const APP_ENV of ["local", "ci", "preview", "staging"]) {
      expect(() => loadServerEnv({ ...valid, APP_ENV })).not.toThrow();
    }
  });

  it("requires AI and Paymob variables in production", () => {
    expect(() => loadServerEnv({ ...valid, APP_ENV: "production" })).toThrow(
      /AI_MODEL_ANALYZE, AI_API_KEY, PAYMOB_API_KEY/,
    );
    expect(() => loadServerEnv({ ...valid, ...aiAndPaymob, APP_ENV: "production" })).not.toThrow();
  });
});

describe("loadBuildInfo", () => {
  it("defaults to local, dev and unknown", () => {
    expect(loadBuildInfo({})).toEqual({ environment: "local", version: "dev", gitSha: "unknown" });
  });

  it("prefers GIT_SHA over the Vercel commit SHA", () => {
    expect(loadBuildInfo({ GIT_SHA: "own", VERCEL_GIT_COMMIT_SHA: "vercel" }).gitSha).toBe("own");
  });

  it("falls back to the Vercel commit SHA", () => {
    const info = loadBuildInfo({ APP_ENV: "staging", VERCEL_GIT_COMMIT_SHA: "vercel" });
    expect(info).toMatchObject({ environment: "staging", gitSha: "vercel" });
  });
});
