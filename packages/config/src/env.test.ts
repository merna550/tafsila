import { describe, expect, it } from "vitest";
import { loadServerEnv } from "./env";

const valid = {
  SUPABASE_URL: "http://127.0.0.1:54321",
  SUPABASE_ANON_KEY: "anon",
  SUPABASE_SERVICE_ROLE_KEY: "service",
  AI_MODEL_ANALYZE: "model",
  AI_API_KEY: "key",
};

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
});
