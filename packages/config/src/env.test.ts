import { describe, expect, it } from "vitest";
import { loadBuildInfo, loadPublicConfig, loadServerEnv } from "./env";

const valid = {
  SUPABASE_URL: "http://127.0.0.1:54321",
  SUPABASE_ANON_KEY: "anon",
  SUPABASE_SERVICE_ROLE_KEY: "service",
};

const observability = { SENTRY_DSN: "https://key@o1.ingest.sentry.io/1", POSTHOG_KEY: "phc_test" };
const aiAndPaymob = { AI_MODEL_ANALYZE: "model", AI_API_KEY: "key", PAYMOB_API_KEY: "pay", ...observability };

describe("loadServerEnv", () => {
  it("applies defaults for optional variables", () => {
    const env = loadServerEnv(valid);
    expect(env.APP_ENV).toBe("local");
    expect(env.PAYMOB_MODE).toBe("sandbox");
  });

  it("reads AUTH_GOOGLE_ENABLED as a boolean that defaults to false", () => {
    expect(loadServerEnv(valid).AUTH_GOOGLE_ENABLED).toBe(false);
    expect(loadServerEnv({ ...valid, AUTH_GOOGLE_ENABLED: "true" }).AUTH_GOOGLE_ENABLED).toBe(true);
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
      /AI_MODEL_ANALYZE, AI_API_KEY, PAYMOB_API_KEY, SENTRY_DSN, POSTHOG_KEY/,
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

describe("observability variables", () => {
  it("are optional locally and default the PostHog host to the US region", () => {
    const env = loadServerEnv(valid);
    expect(env.SENTRY_DSN).toBeUndefined();
    expect(env.POSTHOG_KEY).toBeUndefined();
    expect(env.POSTHOG_HOST).toBe("https://us.i.posthog.com");
  });

  it("are required in production", () => {
    expect(() =>
      loadServerEnv({ ...valid, ...aiAndPaymob, SENTRY_DSN: undefined, APP_ENV: "production" }),
    ).toThrow(/SENTRY_DSN/);
  });
});

describe("loadPublicConfig", () => {
  it("returns the browser-safe subset with release from the git SHA", () => {
    const config = loadPublicConfig({ ...observability, APP_ENV: "staging", GIT_SHA: "abc" });
    expect(config).toEqual({
      sentryDsn: observability.SENTRY_DSN,
      posthogKey: "phc_test",
      posthogHost: "https://us.i.posthog.com",
      appEnv: "staging",
      release: "abc",
      supabaseUrl: undefined,
      supabaseAnonKey: undefined,
      authGoogleEnabled: false,
    });
  });

  it("never returns secrets", () => {
    const config = loadPublicConfig({ ...valid, ...aiAndPaymob, AI_API_KEY: "SECRET-AI" });
    expect(JSON.stringify(config)).not.toMatch(/SECRET-AI|service|pay/);
    expect(Object.keys(config).sort((a, b) => a.localeCompare(b))).toEqual([
      "appEnv",
      "authGoogleEnabled",
      "posthogHost",
      "posthogKey",
      "release",
      "sentryDsn",
      "supabaseAnonKey",
      "supabaseUrl",
    ]);
  });

  it("passes the public Supabase URL and anon key but never the service role key", () => {
    const config = loadPublicConfig({ ...valid, AUTH_GOOGLE_ENABLED: "true" });
    expect(config).toMatchObject({
      supabaseUrl: valid.SUPABASE_URL,
      supabaseAnonKey: "anon",
      authGoogleEnabled: true,
    });
    expect(JSON.stringify(config)).not.toContain("service");
  });

  it("is empty-safe when nothing is configured", () => {
    const config = loadPublicConfig({});
    expect(config.sentryDsn).toBeUndefined();
    expect(config.appEnv).toBe("local");
  });
});
