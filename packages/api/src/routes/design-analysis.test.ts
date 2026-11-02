import { designAnalysisResponseSchema } from "@tafsila/schemas";
import { describe, expect, it } from "vitest";
import { createMemoryApp, USER_A, USER_B, type MemoryApp } from "../test-support/memory-app";

/**
 * Creates a design of user A with a front photo in storage.
 *
 * @param api - The memory app.
 * @returns The design id.
 */
async function designWithFront(api: MemoryApp): Promise<string> {
  const created = await api.call(USER_A, "POST", "/designs", { category: "dress" });
  const { id } = (await created.json()) as { id: string };
  const up = await api.call(USER_A, "POST", `/designs/${id}/photos`, {
    photos: [{ slot: "front", contentType: "image/jpeg", sizeBytes: 2000 }],
  });
  const { uploads } = (await up.json()) as { uploads: { path: string }[] };
  api.photos.put(uploads[0]!.path);
  return id;
}

describe("design analysis API", () => {
  it("answers 401 without a token", async () => {
    const api = await createMemoryApp();
    const id = await designWithFront(api);
    expect((await api.call(undefined, "POST", `/designs/${id}/analyze`, {})).status).toBe(401);
    expect((await api.call(undefined, "GET", `/designs/${id}/analysis`)).status).toBe(401);
  });

  it("analyses (202) then polls pending and done with a valid body", async () => {
    const api = await createMemoryApp({}, { deferredJobs: true });
    const id = await designWithFront(api);
    expect(
      ((await (await api.call(USER_A, "GET", `/designs/${id}/analysis`)).json()) as { status: string })
        .status,
    ).toBe("none");
    const accepted = await api.call(USER_A, "POST", `/designs/${id}/analyze`, { categoryHint: "blouse" });
    expect(accepted.status).toBe(202);
    expect(((await accepted.json()) as { status: string }).status).toBe("pending");
    const pending = await api.call(USER_A, "GET", `/designs/${id}/analysis`);
    expect(designAnalysisResponseSchema.parse(await pending.json()).status).toBe("pending");
    await api.jobs.drain();
    const done = designAnalysisResponseSchema.parse(
      await (await api.call(USER_A, "GET", `/designs/${id}/analysis`)).json(),
    );
    expect(done.status).toBe("done");
    expect(done.result?.spec.category).toBe("blouse");
    expect(api.aiUsage.rows).toHaveLength(1);
  });

  it("accepts a request without a body", async () => {
    const api = await createMemoryApp();
    const id = await designWithFront(api);
    expect((await api.call(USER_A, "POST", `/designs/${id}/analyze`)).status).toBe(202);
  });

  it("hides another user's design (404) and refuses a design with no photos (422)", async () => {
    const api = await createMemoryApp();
    const id = await designWithFront(api);
    expect((await api.call(USER_B, "POST", `/designs/${id}/analyze`, {})).status).toBe(404);
    expect((await api.call(USER_B, "GET", `/designs/${id}/analysis`)).status).toBe(404);
    const bare = (await (await api.call(USER_A, "POST", "/designs", { category: "dress" })).json()) as {
      id: string;
    };
    const res = await api.call(USER_A, "POST", `/designs/${bare.id}/analyze`, {});
    expect(res.status).toBe(422);
    expect(((await res.json()) as { code: string }).code).toBe("PHOTO_FRONT_REQUIRED");
  });

  it("returns the documented error bodies for 409, 422 and the daily cap 429", async () => {
    const api = await createMemoryApp({}, { deferredJobs: true, jobsConfig: { analyzeDailyLimit: 1 } });
    const id = await designWithFront(api);
    const unsupported = await api.call(USER_A, "POST", `/designs/${id}/analyze`, { categoryHint: "abaya" });
    expect(unsupported.status).toBe(422);
    const body = (await unsupported.json()) as { code: string; message_ar: string };
    expect(body.code).toBe("CATEGORY_NOT_SUPPORTED");
    expect(body.message_ar).not.toBe("");
    await api.call(USER_A, "POST", `/designs/${id}/analyze`, {});
    const running = await api.call(USER_A, "POST", `/designs/${id}/analyze`, {});
    expect(running.status).toBe(409);
    expect(((await running.json()) as { code: string }).code).toBe("ANALYSIS_IN_PROGRESS");
    await api.jobs.drain();
    const capped = await api.call(USER_A, "POST", `/designs/${id}/analyze`, {});
    expect(capped.status).toBe(429);
    expect(((await capped.json()) as { code: string }).code).toBe("AI_DAILY_LIMIT");
  });

  it("rate limits the route per user (429 RATE_LIMITED) without affecting another user", async () => {
    const api = await createMemoryApp({}, { jobsConfig: { rateLimitPerMinute: 2, analyzeDailyLimit: 100 } });
    const id = await designWithFront(api);
    for (let i = 0; i < 2; i += 1)
      expect((await api.call(USER_A, "POST", `/designs/${id}/analyze`, {})).status).toBe(202);
    const limited = await api.call(USER_A, "POST", `/designs/${id}/analyze`, {});
    expect(limited.status).toBe(429);
    expect(((await limited.json()) as { code: string }).code).toBe("RATE_LIMITED");
    expect((await api.call(USER_B, "POST", `/designs/${id}/analyze`, {})).status).toBe(404);
  });
});
