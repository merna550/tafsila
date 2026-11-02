import { describe, expect, it } from "vitest";
import { createInngestClient } from "../adapters/inngest/inngest-client";
import { loadJobsConfig } from "@tafsila/config";
import { createMemoryApp } from "../test-support/memory-app";

describe("/api/inngest", () => {
  it("is not served with the inline queue", async () => {
    const api = await createMemoryApp();
    expect((await api.app.request("/api/inngest")).status).toBe(404);
  });

  it("answers the SDK introspection call and registers design.analyze with the dev server setup", async () => {
    const config = loadJobsConfig({ JOB_QUEUE: "inngest", APP_ENV: "local" });
    const api = await createMemoryApp({ jobsConfig: config, inngest: createInngestClient(config) });
    const res = await api.app.request("/api/inngest");
    expect(res.status).toBe(200);
    const body = (await res.json()) as { function_count?: number; mode?: string };
    expect(body.function_count).toBe(1);
    expect(body.mode).toBe("dev");
  });

  it("refuses unsigned introspection and run requests in cloud mode (staging keys)", async () => {
    const config = loadJobsConfig({
      JOB_QUEUE: "inngest",
      APP_ENV: "staging",
      INNGEST_EVENT_KEY: "test-event-key",
      INNGEST_SIGNING_KEY: "signkey-test-0123456789abcdef",
    });
    const api = await createMemoryApp({ jobsConfig: config, inngest: createInngestClient(config) });
    const res = await api.app.request("/api/inngest?fnId=tafsila-design.analyze&stepId=step", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        event: { name: "design/analyze.requested", data: {} },
        events: [],
        ctx: { run_id: "x" },
        steps: {},
      }),
    });
    expect(res.status).toBe(401);
    expect((await api.app.request("/api/inngest")).status).toBe(401);
  });
});
