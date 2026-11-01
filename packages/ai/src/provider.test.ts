/** Tests for provider selection and usage (issue #337): models are constructed only, never called. */
import { loadAiConfig } from "@tafsila/config";
import { describe, expect, it } from "vitest";
import { createFakeModel } from "./fake-model";
import { createModel } from "./provider";
import { buildUsage, estimateCostUsd } from "./usage";

/**
 * A real-provider configuration with a placeholder key (no request is ever sent).
 *
 * @param provider - Provider name.
 * @returns The configuration.
 */
const real = (provider: string) =>
  loadAiConfig({
    AI_PROVIDER: provider,
    AI_MODEL_ANALYZE: "analyze-model",
    AI_MODEL_CHAT: "chat-model",
    AI_API_KEY: "test-key",
  });

/**
 * Reads provider and model id of a constructed model.
 *
 * @param model - The model.
 * @returns Its provider and id.
 */
const describeModel = (model: unknown) => {
  const { provider, modelId } = model as { provider: string; modelId: string };
  return { provider, modelId };
};

describe("createModel", () => {
  it("builds an Anthropic model from configuration", () => {
    expect(describeModel(createModel(real("anthropic"), "analyze"))).toMatchObject({
      modelId: "analyze-model",
    });
    expect(describeModel(createModel(real("anthropic"), "chat")).provider).toMatch(/anthropic/);
  });

  it("builds a Google model from configuration", () => {
    expect(describeModel(createModel(real("google"), "chat"))).toMatchObject({ modelId: "chat-model" });
    expect(describeModel(createModel(real("google"), "chat")).provider).toMatch(/google/);
  });

  it("needs no key for the fake provider", () => {
    expect(describeModel(createModel(loadAiConfig({}), "chat")).provider).toBe("fake");
  });

  it("refuses a real provider without a key", () => {
    const config = { ...real("google"), apiKey: undefined };
    expect(() => createModel(config, "analyze")).toThrow(/AI_API_KEY/);
  });
});

describe("fake model", () => {
  it("does not stream", async () => {
    const model = createFakeModel("chat") as unknown as { doStream: () => Promise<unknown> };
    await expect(model.doStream()).rejects.toThrow(/does not stream/);
  });
});

describe("usage", () => {
  it("has no cost for a model without a price", () => {
    expect(estimateCostUsd("unknown-model", 1000, 1000)).toBeUndefined();
  });

  it("estimates cost from the price table", () => {
    const prices = { m: { inputUsdPerMTok: 3, outputUsdPerMTok: 15 } };
    expect(estimateCostUsd("m", 1_000_000, 100_000, prices)).toBeCloseTo(4.5);
  });

  it("reads missing token counts as zero", () => {
    expect(buildUsage("fake", "fake", [undefined], 5)).toMatchObject({
      inputTokens: 0,
      outputTokens: 0,
      attempts: 1,
    });
  });
});
