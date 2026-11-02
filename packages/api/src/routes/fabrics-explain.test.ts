/** Tests for GET /api/fabrics/recommend?explain=true (issue #346, FR-REC-04): cache, cap, failure log, privacy. */
import { scriptedDeps, scriptedModel } from "@tafsila/ai/testing";
import { recommendFabricsResponseSchema, type RecommendFabricsResponse } from "@tafsila/schemas";
import { sizeM, vNeckHalfCircleDress } from "@tafsila/test-fixtures";
import { describe, expect, it } from "vitest";
import { createMemoryApp, USER_A, USER_B, type MemoryApp } from "../test-support/memory-app";

/** Loose shape of the JSON bodies these tests read. */
interface Json {
  id: string;
  code: string;
  version: { id: string };
}

/**
 * Reads the JSON body of a response.
 *
 * @param res - The response.
 * @returns The parsed body.
 */
async function json(res: Response): Promise<Json> {
  return (await res.json()) as Json;
}

/**
 * Saves a version of the dress for a user.
 *
 * @param api - The app.
 * @param userId - Owner.
 * @returns The version id.
 */
async function seedVersion(api: MemoryApp, userId: string): Promise<string> {
  const design = await json(await api.call(userId, "POST", "/designs", { category: "dress", title: "t" }));
  const set = await json(
    await api.call(userId, "POST", "/measurements", { label: "M", sizeLabel: "M", measurements: sizeM }),
  );
  const saved = await json(
    await api.call(userId, "POST", `/designs/${design.id}/versions`, {
      spec: vNeckHalfCircleDress,
      measurementSetId: set.id,
      easeProfile: "regular",
      options: { fabricWidthMm: 1400 },
    }),
  );
  return saved.version.id;
}

/**
 * Asks for the recommendation with the explanation.
 *
 * @param api - The app.
 * @param userId - Caller.
 * @param versionId - Version id.
 * @param locale - Language.
 * @returns The response.
 */
function explain(api: MemoryApp, userId: string, versionId: string, locale = "ar"): Promise<Response> {
  return api.call(userId, "GET", `/fabrics/recommend?versionId=${versionId}&explain=true&locale=${locale}`);
}

describe("GET /api/fabrics/recommend?explain=true", () => {
  it("returns the fake explanation, naming only recommended or avoided fabrics, and logs the usage", async () => {
    const api = await createMemoryApp();
    const versionId = await seedVersion(api, USER_A);
    const res = await explain(api, USER_A, versionId, "en");
    expect(res.status).toBe(200);
    const body = recommendFabricsResponseSchema.parse(await res.json());
    expect(body.explanation?.locale).toBe("en");
    for (const item of body.recommended) expect(body.explanation?.text).toContain(item.fabric.nameEn);
    expect(api.aiUsage.rows.map((r) => r.kind)).toEqual(["explain"]);
  });

  it("caches the text: the second call asks no AI and logs nothing", async () => {
    const api = await createMemoryApp();
    const versionId = await seedVersion(api, USER_A);
    const first = (await (await explain(api, USER_A, versionId)).json()) as RecommendFabricsResponse;
    const second = (await (await explain(api, USER_A, versionId)).json()) as RecommendFabricsResponse;
    expect(second.explanation).toEqual(first.explanation);
    expect(api.aiUsage.rows).toHaveLength(1);
    await explain(api, USER_A, versionId, "en");
    expect(api.aiUsage.rows).toHaveLength(2);
  });

  it("writes a new text after an admin edit of a rule changes the recommendation", async () => {
    const api = await createMemoryApp();
    const versionId = await seedVersion(api, USER_A);
    await explain(api, USER_A, versionId);
    for (const rule of api.store.fabricRules)
      rule.reason = { ...rule.reason, ar: `${rule.reason.ar} (محدّث)` };
    await explain(api, USER_A, versionId);
    expect(api.aiUsage.rows).toHaveLength(2);
  });

  it("refuses the 21st new explanation of a UTC day with 429 EXPLAIN_DAILY_LIMIT", async () => {
    const api = await createMemoryApp({}, { jobsConfig: { explainDailyLimit: 1, rateLimitPerMinute: 100 } });
    const first = await seedVersion(api, USER_A);
    const second = await seedVersion(api, USER_A);
    api.store.fabricRules.forEach((rule) => (rule.reason = { ...rule.reason, en: "x" }));
    expect((await explain(api, USER_A, first, "en")).status).toBe(200);
    // A cached text is still served at the cap.
    expect((await explain(api, USER_A, first, "en")).status).toBe(200);
    const res = await explain(api, USER_A, second, "ar");
    expect(res.status).toBe(429);
    expect((await json(res)).code).toBe("EXPLAIN_DAILY_LIMIT");
  });

  it("answers 502 AI_EXPLAIN_FAILED when the text names an outside fabric twice, logs it and caches nothing", async () => {
    const api = await createMemoryApp();
    const versionId = await seedVersion(api, USER_A);
    const plain = recommendFabricsResponseSchema.parse(
      await (await api.call(USER_A, "GET", `/fabrics/recommend?versionId=${versionId}`)).json(),
    );
    const named = new Set([...plain.recommended, ...plain.avoid].map((i) => i.fabricId));
    const [one, two] = api.store.fabrics.filter((f) => !named.has(f.id));
    const model = scriptedModel([
      { text: `${one!.nameEn} is lovely.` },
      { text: `${two!.nameEn} is lovely.` },
    ]);
    const failing = await createMemoryApp({}, { ai: scriptedDeps(model) });
    const failingVersion = await seedVersion(failing, USER_A);
    const res = await explain(failing, USER_A, failingVersion, "en");
    expect(res.status).toBe(502);
    expect((await json(res)).code).toBe("AI_EXPLAIN_FAILED");
    expect(failing.aiUsage.rows.map((r) => [r.kind, r.inputTokens])).toEqual([["explain", 20]]);
    expect(failing.store.fabricExplanations).toHaveLength(0);
  });

  it("answers 404 for another user's version and 401 without a token", async () => {
    const api = await createMemoryApp();
    const versionId = await seedVersion(api, USER_A);
    expect((await explain(api, USER_B, versionId)).status).toBe(404);
    expect(
      (await api.call(undefined, "GET", `/fabrics/recommend?versionId=${versionId}&explain=true`)).status,
    ).toBe(401);
    expect(api.aiUsage.rows).toHaveLength(0);
  });

  it("leaves the plain recommendation without an explanation and without AI", async () => {
    const api = await createMemoryApp();
    const versionId = await seedVersion(api, USER_A);
    const body = (await (
      await api.call(USER_A, "GET", `/fabrics/recommend?versionId=${versionId}`)
    ).json()) as RecommendFabricsResponse;
    expect(body.explanation).toBeUndefined();
    expect(api.aiUsage.rows).toHaveLength(0);
  });

  it("counts only explain requests in the rate limit", async () => {
    const api = await createMemoryApp({}, { jobsConfig: { rateLimitPerMinute: 1 } });
    const versionId = await seedVersion(api, USER_A);
    for (let i = 0; i < 3; i++) {
      expect((await api.call(USER_A, "GET", `/fabrics/recommend?versionId=${versionId}`)).status).toBe(200);
    }
    expect((await explain(api, USER_A, versionId)).status).toBe(200);
    const limited = await explain(api, USER_A, versionId);
    expect(limited.status).toBe(429);
    expect((await json(limited)).code).toBe("RATE_LIMITED");
  });

  it("rejects an unknown language", async () => {
    const api = await createMemoryApp();
    const versionId = await seedVersion(api, USER_A);
    expect((await explain(api, USER_A, versionId, "fr")).status).toBe(400);
  });
});
