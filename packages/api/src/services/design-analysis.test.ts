import { fakeAnalysis, scriptedDeps, scriptedModel } from "@tafsila/ai/testing";
import { createFakeAi, type AiDeps } from "@tafsila/ai";
import type { DesignAnalysisResult } from "@tafsila/schemas";
import { describe, expect, it } from "vitest";
import { createMemoryAiUsageRepository } from "../adapters/memory/ai-usage-repository";
import { createMemoryDesignRepository } from "../adapters/memory/design-repository";
import { createInlineJobQueue } from "../adapters/memory/inline-job-queue";
import { createMemoryStore } from "../adapters/memory/memory-store";
import { createMemoryPhotoDownloader } from "../adapters/memory/photo-downloader";
import { createMemoryPhotoStorage } from "../adapters/memory/photo-storage";
import { createMemoryUnsupportedFeatures } from "../adapters/memory/unsupported-feature-repository";
import { authFor, USER_A, USER_B } from "../test-support/memory-app";
import { createDesign } from "./create-design";
import { getDesignAnalysis } from "./get-design-analysis";
import { runDesignAnalysis } from "./run-design-analysis";
import { startDesignAnalysis } from "./start-design-analysis";

const a = authFor(USER_A);
const b = authFor(USER_B);
const START = new Date("2026-11-02T10:00:00.000Z");

/**
 * Fresh memory dependencies, a controllable clock, and one design of user A with a front photo.
 *
 * @param options - Daily limit, AI dependencies, whether the photo exists, and deferred jobs.
 * @returns The dependencies, the design id and helpers.
 */
async function setup(options: { limit?: number; ai?: AiDeps; withFront?: boolean; deferred?: boolean } = {}) {
  const store = createMemoryStore();
  const time = { now: START };
  const clock = { now: () => time.now };
  const photoStorage = createMemoryPhotoStorage();
  const downloader = createMemoryPhotoDownloader();
  const unsupported = createMemoryUnsupportedFeatures();
  const reported: unknown[] = [];
  const designs = createMemoryDesignRepository(store);
  const aiUsage = createMemoryAiUsageRepository(clock.now);
  const deps = {
    designs,
    photoStorage,
    photoDownloader: downloader,
    aiUsage,
    unsupportedFeatures: unsupported,
    errorReporter: {
      captureException: (error: unknown) => {
        reported.push(error);
      },
      setUser: () => undefined,
    },
    clock,
    aiDeps: () => options.ai ?? createFakeAi(),
    analyzeDailyLimit: options.limit ?? 10,
    jobQueue: undefined as unknown as ReturnType<typeof createInlineJobQueue>,
  };
  deps.jobQueue = createInlineJobQueue((_name, payload) => runDesignAnalysis(deps, payload), {
    deferred: options.deferred,
  });
  const design = await createDesign(
    {
      designs,
      profiles: { get: () => Promise.resolve(undefined), update: () => Promise.resolve(undefined) },
      clock,
    },
    a,
    { category: "dress" },
  );
  if (options.withFront !== false) {
    const path = `${USER_A}/${design.id}/front.jpg`;
    await designs.setPhotoPaths(a, design.id, [path]);
    photoStorage.put(path);
  }
  return { deps, id: design.id, time, downloader, unsupported, reported };
}

describe("start and run the analysis (fake provider, inline queue)", () => {
  it("goes pending then done, stores the result, logs one ai_usage row", async () => {
    const { deps, id } = await setup({ deferred: true });
    const accepted = await startDesignAnalysis(deps, a, id, {});
    expect(accepted).toEqual({ status: "pending", startedAt: START.toISOString() });
    expect((await getDesignAnalysis(deps, a, id)).status).toBe("pending");
    await deps.jobQueue.drain();
    const done = await getDesignAnalysis(deps, a, id);
    expect(done.status).toBe("done");
    expect(done.result?.spec.category).toBe("dress");
    expect(done.startedAt).toBe(START.toISOString());
    expect(done.finishedAt).toBeDefined();
    expect(deps.aiUsage.rows).toHaveLength(1);
    expect(deps.aiUsage.rows[0]).toMatchObject({
      userId: USER_A,
      designId: id,
      kind: "analyze",
      provider: "fake",
    });
  });

  it("answers none before the first request", async () => {
    const { deps, id } = await setup();
    expect(await getDesignAnalysis(deps, a, id)).toEqual({ status: "none" });
  });

  it("passes the category hint to the provider", async () => {
    const { deps, id } = await setup();
    await startDesignAnalysis(deps, a, id, { categoryHint: "skirt" });
    expect((await getDesignAnalysis(deps, a, id)).result?.spec.category).toBe("skirt");
  });

  it("refuses a second start while pending (409) and replaces a pending older than 5 minutes", async () => {
    const { deps, id, time } = await setup({ deferred: true });
    await startDesignAnalysis(deps, a, id, {});
    await expect(startDesignAnalysis(deps, a, id, {})).rejects.toMatchObject({
      code: "ANALYSIS_IN_PROGRESS",
    });
    time.now = new Date(START.getTime() + 5 * 60 * 1000);
    expect((await getDesignAnalysis(deps, a, id)).status).toBe("failed");
    await expect(startDesignAnalysis(deps, a, id, {})).resolves.toMatchObject({ status: "pending" });
  });

  it("refuses a design without a front photo (422) and another user's design (404)", async () => {
    const none = await setup({ withFront: false });
    await expect(startDesignAnalysis(none.deps, a, none.id, {})).rejects.toMatchObject({
      code: "PHOTO_FRONT_REQUIRED",
    });
    const { deps, id } = await setup();
    await expect(startDesignAnalysis(deps, b, id, {})).rejects.toMatchObject({ code: "NOT_FOUND" });
    await expect(getDesignAnalysis(deps, b, id)).rejects.toMatchObject({ code: "NOT_FOUND" });
  });

  it("answers 'coming soon' for an unsupported category and does not queue anything", async () => {
    const { deps, id } = await setup({ deferred: true });
    await expect(startDesignAnalysis(deps, a, id, { categoryHint: "abaya" })).rejects.toMatchObject({
      code: "CATEGORY_NOT_SUPPORTED",
    });
    expect(deps.jobQueue.held).toBe(0);
    expect(await getDesignAnalysis(deps, a, id)).toEqual({ status: "none" });
  });

  it("stops the 11th analysis of a UTC day (429) and starts again the next day", async () => {
    const { deps, id, time } = await setup({ limit: 10 });
    for (let i = 0; i < 10; i += 1) await startDesignAnalysis(deps, a, id, {});
    expect(deps.aiUsage.rows).toHaveLength(10);
    await expect(startDesignAnalysis(deps, a, id, {})).rejects.toMatchObject({ code: "AI_DAILY_LIMIT" });
    time.now = new Date("2026-11-03T00:00:01.000Z");
    await expect(startDesignAnalysis(deps, a, id, {})).resolves.toMatchObject({ status: "pending" });
  });

  it("marks the state failed when the queue refuses the job, and rethrows", async () => {
    const { deps, id } = await setup();
    const broken = { ...deps, jobQueue: { enqueue: () => Promise.reject(new Error("queue down")) } };
    await expect(startDesignAnalysis(broken, a, id, {})).rejects.toThrow("queue down");
    expect(await getDesignAnalysis(deps, a, id)).toMatchObject({
      status: "failed",
      errorCode: "AI_ANALYSIS_FAILED",
    });
  });
});

describe("the job body", () => {
  it("strips GPS data before the provider sees the photo", async () => {
    const model = scriptedModel([{ text: JSON.stringify(fakeAnalysis("dress")) }]);
    const { deps, id, downloader } = await setup({ ai: scriptedDeps(model) });
    await startDesignAnalysis(deps, a, id, {});
    expect(downloader.urls[0]).toContain(`${USER_A}/${id}/front.jpg`);
    const parts = (model.doGenerateCalls[0]?.prompt ?? []).flatMap((message) =>
      typeof message.content === "string"
        ? []
        : (message.content as readonly { data?: { data?: unknown } }[]),
    );
    const sent = parts.find((part) => part.data?.data instanceof Uint8Array)?.data?.data as
      Uint8Array | undefined;
    expect(sent).toBeDefined();
    expect(Buffer.from(sent ?? []).includes("GPS")).toBe(false);
    expect(Buffer.from(downloader.bytes).includes("GPS")).toBe(true);
  });

  it("records unsupported features once, even over two analyses", async () => {
    const result: DesignAnalysisResult = {
      ...fakeAnalysis("dress"),
      unsupported: [
        { text: { ar: "غطاء رأس", en: "Hood" } },
        { text: { ar: "غطاء رأس", en: "Hood" } },
        { text: { ar: "بيبلوم", en: "Peplum" } },
      ],
    };
    const model = scriptedModel([{ text: JSON.stringify(result) }, { text: JSON.stringify(result) }]);
    const { deps, id, unsupported } = await setup({ ai: scriptedDeps(model) });
    await startDesignAnalysis(deps, a, id, {});
    await startDesignAnalysis(deps, a, id, {});
    expect(unsupported.rows.map((row) => row.text)).toEqual(["Hood", "Peplum"]);
  });

  it("logs the usage of a refused answer and ends failed with a safe code", async () => {
    const model = scriptedModel([{ text: "not json" }, { text: '{"spec":{}}' }]);
    const { deps, id } = await setup({ ai: scriptedDeps(model) });
    await startDesignAnalysis(deps, a, id, {});
    const state = await getDesignAnalysis(deps, a, id);
    expect(state).toMatchObject({ status: "failed", errorCode: "AI_OUTPUT_INVALID" });
    expect(state.result).toBeUndefined();
    expect(deps.aiUsage.rows).toHaveLength(1);
    expect(deps.aiUsage.rows[0]).toMatchObject({ inputTokens: 20, outputTokens: 10 });
  });

  it("ends failed with a generic code when the provider throws, hides its message and logs a zero-token row", async () => {
    const model = scriptedModel([]);
    model.doGenerate = () => Promise.reject(new Error("secret provider text sk-123"));
    const { deps, id, reported } = await setup({ ai: scriptedDeps(model) });
    await startDesignAnalysis(deps, a, id, {});
    const state = await getDesignAnalysis(deps, a, id);
    expect(state).toMatchObject({ status: "failed", errorCode: "AI_ANALYSIS_FAILED" });
    expect(JSON.stringify(state)).not.toContain("secret");
    expect(deps.aiUsage.rows[0]).toMatchObject({ inputTokens: 0, outputTokens: 0 });
    expect(reported).toHaveLength(1);
  });

  it("fails without an ai_usage row when a photo cannot be downloaded (the provider was never called)", async () => {
    const { deps, id, downloader } = await setup();
    downloader.failing = true;
    await startDesignAnalysis(deps, a, id, {});
    expect(await getDesignAnalysis(deps, a, id)).toMatchObject({
      status: "failed",
      errorCode: "AI_ANALYSIS_FAILED",
    });
    expect(deps.aiUsage.rows).toHaveLength(0);
  });

  it("fails without an ai_usage row when the photo is not an image", async () => {
    const { deps, id, downloader } = await setup();
    downloader.bytes = Uint8Array.from([1, 2, 3]);
    await startDesignAnalysis(deps, a, id, {});
    expect((await getDesignAnalysis(deps, a, id)).status).toBe("failed");
    expect(deps.aiUsage.rows).toHaveLength(0);
  });

  it("does nothing for a design that was deleted meanwhile", async () => {
    const { deps, id } = await setup();
    await expect(runDesignAnalysis(deps, { userId: USER_B, designId: id })).resolves.toBeUndefined();
    expect(deps.aiUsage.rows).toHaveLength(0);
  });
});
