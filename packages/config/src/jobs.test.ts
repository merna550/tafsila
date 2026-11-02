import { describe, expect, it } from "vitest";
import { loadServerEnv } from "./env";
import { loadJobsConfig } from "./jobs";

const valid = {
  SUPABASE_URL: "http://127.0.0.1:54321",
  SUPABASE_ANON_KEY: "anon",
  SUPABASE_SERVICE_ROLE_KEY: "service",
};

describe("Jobs configuration (decision 340)", () => {
  it("defaults to the inline queue and the documented caps", () => {
    expect(loadServerEnv(valid).JOB_QUEUE).toBe("inline");
    expect(loadJobsConfig({})).toEqual({
      queue: "inline",
      appEnv: "local",
      inngestEventKey: undefined,
      inngestSigningKey: undefined,
      analyzeDailyLimit: 10,
      rateLimitPerMinute: 5,
      chatMessagesPerDesign: 10,
      chatDailyLimit: 100,
    });
  });

  it("reads the caps and keys from the environment", () => {
    const config = loadJobsConfig({
      JOB_QUEUE: "inngest",
      APP_ENV: "staging",
      INNGEST_EVENT_KEY: "event",
      INNGEST_SIGNING_KEY: "signkey-test",
      AI_ANALYZE_DAILY_LIMIT: "3",
      AI_RATE_LIMIT_PER_MINUTE: "2",
    });
    expect(config).toMatchObject({ queue: "inngest", analyzeDailyLimit: 3, rateLimitPerMinute: 2 });
  });

  it("reads the chat caps from the environment", () => {
    expect(loadJobsConfig({ CHAT_MESSAGES_PER_DESIGN: "3", AI_CHAT_DAILY_LIMIT: "7" })).toMatchObject({
      chatMessagesPerDesign: 3,
      chatDailyLimit: 7,
    });
    expect(() => loadJobsConfig({ CHAT_MESSAGES_PER_DESIGN: "0" })).toThrow(/CHAT_MESSAGES_PER_DESIGN/);
  });

  it("refuses inngest without keys in staging and production only", () => {
    expect(() => loadJobsConfig({ JOB_QUEUE: "inngest", APP_ENV: "staging" })).toThrow(
      /INNGEST_EVENT_KEY, INNGEST_SIGNING_KEY/,
    );
    expect(() => loadServerEnv({ ...valid, JOB_QUEUE: "inngest", APP_ENV: "staging" })).toThrow(/INNGEST/);
    expect(loadJobsConfig({ JOB_QUEUE: "inngest", APP_ENV: "local" }).queue).toBe("inngest");
    expect(loadJobsConfig({ JOB_QUEUE: "inline", APP_ENV: "staging" }).queue).toBe("inline");
  });

  it("rejects an unknown queue and a bad cap", () => {
    expect(() => loadJobsConfig({ JOB_QUEUE: "redis" })).toThrow(/JOB_QUEUE/);
    expect(() => loadJobsConfig({ AI_ANALYZE_DAILY_LIMIT: "0" })).toThrow(/AI_ANALYZE_DAILY_LIMIT/);
    expect(() => loadJobsConfig({ AI_RATE_LIMIT_PER_MINUTE: "abc" })).toThrow(/AI_RATE_LIMIT_PER_MINUTE/);
  });
});
