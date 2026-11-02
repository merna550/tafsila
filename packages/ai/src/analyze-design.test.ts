/** Tests for photo analysis with the fake provider and scripted test models (issue #337). */
import { designAnalysisResultSchema } from "@tafsila/schemas";
import { describe, expect, it } from "vitest";
import { analyzeDesign } from "./analyze-design";
import { AiOutputInvalidError } from "./errors";
import { fakeAnalysis } from "./fixtures/answers";
import { createFakeAi } from "./index";
import { scriptedDeps, scriptedModel } from "./test-models";

/** One front photo. */
const photos = [{ url: "https://example.test/front.jpg", mediaType: "image/jpeg", view: "front" as const }];

describe("analyzeDesign", () => {
  it("returns a valid dress analysis from the fake provider", async () => {
    const { result, usage } = await analyzeDesign({ photos }, createFakeAi());
    expect(designAnalysisResultSchema.parse(result).spec.category).toBe("dress");
    expect(usage).toMatchObject({
      provider: "fake",
      model: "fake",
      inputTokens: 100,
      outputTokens: 50,
      costUsd: 0,
    });
  });

  it("follows the category hint with the fake provider", async () => {
    const { result } = await analyzeDesign({ photos, hint: { category: "skirt" } }, createFakeAi());
    expect(result.spec.category).toBe("skirt");
  });

  it("sends photo bytes when there is no URL", async () => {
    const model = scriptedModel([{ text: JSON.stringify(fakeAnalysis("blouse")) }]);
    const bytes = [{ bytes: new Uint8Array([1, 2]), mediaType: "image/png", view: "back" as const }];
    await analyzeDesign({ photos: bytes }, scriptedDeps(model));
    expect(JSON.stringify(model.doGenerateCalls[0]!.prompt)).toContain("image/png");
  });

  it("sends the schema to the model as JSON Schema", async () => {
    const model = scriptedModel([{ text: JSON.stringify(fakeAnalysis()) }]);
    await analyzeDesign({ photos }, scriptedDeps(model));
    expect(model.doGenerateCalls[0]!.responseFormat).toMatchObject({
      type: "json",
      schema: { type: "object" },
    });
  });

  it("retries once after an invalid answer", async () => {
    const model = scriptedModel([{ text: '{"spec":{}}' }, { text: JSON.stringify(fakeAnalysis("blouse")) }]);
    const { result, usage } = await analyzeDesign({ photos }, scriptedDeps(model));
    expect(result.spec.category).toBe("blouse");
    expect(usage).toMatchObject({ attempts: 2, inputTokens: 20, latencyMs: 7 });
    expect(JSON.stringify(model.doGenerateCalls[1]!.prompt)).toContain("did not match the schema");
  });

  it("throws a typed error after two invalid answers", async () => {
    const model = scriptedModel([{ text: "not json" }, { text: '{"spec":{}}' }]);
    await expect(analyzeDesign({ photos }, scriptedDeps(model))).rejects.toBeInstanceOf(AiOutputInvalidError);
  });

  it("puts the usage of both attempts on the typed error, so the caller can record the cost (issue #340)", async () => {
    const model = scriptedModel([{ text: "not json" }, { text: '{"spec":{}}' }]);
    const error = await analyzeDesign({ photos }, scriptedDeps(model)).catch((e: unknown) => e);
    expect((error as AiOutputInvalidError).usage).toMatchObject({ attempts: 2, inputTokens: 20 });
  });

  it("marks a feature the engine refuses with confidence 0 and a note", async () => {
    const refused = fakeAnalysis("blouse");
    refused.spec = { ...refused.spec, pockets: ["side-seam"] };
    const model = scriptedModel([{ text: JSON.stringify(refused) }]);
    const { result } = await analyzeDesign({ photos }, scriptedDeps(model));
    expect(result.spec.pockets).toEqual([]);
    expect(result.confidence.pockets).toBe(0);
    expect(result.notes.map((note) => note.path)).toContain("pockets");
  });
});
