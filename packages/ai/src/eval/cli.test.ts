/** Command-line tests of `pnpm ai:eval` (issue #338): flags, the photo loader and pricing. No network, no key. */
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { AiOutputInvalidError } from "../errors";
import { scriptedDeps, scriptedModel } from "../test-models";
import type { AiUsage } from "../usage";
import {
  boundAnalyze,
  defaultLabelsPath,
  isInside,
  parseEvalArgs,
  parseUrlList,
  photoSource,
  SAMPLE_LABELS_PATH,
  withPrice,
} from "./cli";
import type { EvalLabel } from "./labels";
import { DEFAULT_TIMEOUT_MS } from "./run";

/** A label for the loader tests (only the photo name matters). */
const label = { id: "a", photo: "a.png" } as EvalLabel;

/** One front photo URL (never fetched). */
const photo = { url: "https://x.test/a.jpg", mediaType: "image/jpeg", view: "front" as const };

/** A usage of a model with no price row. */
const unpriced: AiUsage = {
  provider: "anthropic",
  model: "some-model",
  inputTokens: 2_000_000,
  outputTokens: 1_000_000,
  latencyMs: 5,
  costUsd: undefined,
  attempts: 1,
};

describe("parseEvalArgs", () => {
  it("defaults to the fake provider with no hint and the default money settings", () => {
    const args = parseEvalArgs([], {});
    expect(args.config.provider).toBe("fake");
    expect(args.limits).toEqual({
      hint: false,
      maxPhotos: undefined,
      budgetUsd: undefined,
      timeoutMs: DEFAULT_TIMEOUT_MS,
    });
    expect(args).toMatchObject({
      out: "eval-runs",
      usdEgp: 50,
      chatAllowanceEgp: 1,
      price: undefined,
      only: undefined,
    });
  });

  it("reads every flag, and the key only from the environment", () => {
    const args = parseEvalArgs(
      [
        "--provider",
        "anthropic",
        "--model",
        "m1",
        "--photos",
        "/x",
        "--only",
        "a, b",
        "--hint",
        "--max-photos",
        "2",
        "--budget-usd",
        "0.01",
        "--usd-egp",
        "48.5",
        "--input-usd-per-mtok",
        "3",
        "--output-usd-per-mtok",
        "15",
      ],
      { AI_API_KEY: "test-key" },
    );
    expect(args.config).toMatchObject({
      provider: "anthropic",
      analyzeModel: "m1",
      chatModel: "m1",
      apiKey: "test-key",
    });
    expect(args.only).toEqual(["a", "b"]);
    expect(args.limits).toMatchObject({ hint: true, maxPhotos: 2, budgetUsd: 0.01 });
    expect(args.price).toEqual({ inputUsdPerMTok: 3, outputUsdPerMTok: 15 });
  });

  it("refuses a real provider without photos, a bad number and an unknown flag", () => {
    expect(() => parseEvalArgs(["--provider", "google", "--model", "g"], { AI_API_KEY: "k" })).toThrow(
      /--photos/,
    );
    expect(() => parseEvalArgs(["--max-photos", "-1"], {})).toThrow(/max-photos/);
    expect(() => parseEvalArgs(["--temperature", "1"], {})).toThrow();
  });
});

describe("photoSource", () => {
  it("refuses a photos folder inside the repository", async () => {
    await expect(photoSource("/repo/photos", "/repo")).rejects.toThrow(/outside the repository/);
    expect(isInside("/repo", "/repo")).toBe(true);
    expect(isInside("/elsewhere", "/repo")).toBe(false);
  });

  it("gives placeholder URLs when there are no photos (fake runs)", async () => {
    const photoFor = await photoSource(undefined, "/repo");
    await expect(photoFor(label)).resolves.toMatchObject({ url: "https://example.invalid/ai-eval/a.png" });
    expect(defaultLabelsPath(undefined)).toBe(SAMPLE_LABELS_PATH);
  });

  it("reads bytes from a folder and URLs from a list", async () => {
    const folder = await mkdtemp(join(tmpdir(), "ai-eval-"));
    await writeFile(join(folder, "a.png"), new Uint8Array([1, 2, 3]));
    const fromFolder = await (await photoSource(folder, "/repo"))(label);
    expect(fromFolder).toMatchObject({ mediaType: "image/png", bytes: new Uint8Array([1, 2, 3]) });
    expect(defaultLabelsPath(folder)).toBe(join(folder, "labels.json"));

    const list = join(folder, "urls.txt");
    await writeFile(list, "# signed URLs\na.png https://bucket.test/a.png?sig=1\n\nb.jpg\n");
    const fromList = await photoSource(list, "/repo");
    await expect(fromList(label)).resolves.toMatchObject({ url: "https://bucket.test/a.png?sig=1" });
    await expect(fromList({ ...label, photo: "b.jpg" })).rejects.toThrow(/no URL for b.jpg/);
    expect(parseUrlList("x.webp https://u\n").get("x.webp")).toBe("https://u");
  });
});

describe("pricing", () => {
  it("prices a model with no row from the flags", () => {
    expect(withPrice(unpriced, { inputUsdPerMTok: 3, outputUsdPerMTok: 15 }).costUsd).toBe(21);
    expect(withPrice(unpriced, undefined).costUsd).toBeUndefined();
  });

  it("runs the fake provider through the bound analysis", async () => {
    const analyze = boundAnalyze({ config: parseEvalArgs([], {}).config }, undefined);
    const { usage } = await analyze({ photos: [photo] });
    expect(usage).toMatchObject({ provider: "fake", costUsd: 0 });
  });

  it("prices the usage carried by a refused answer", async () => {
    const model = scriptedModel([{ text: "not json" }, { text: "{}" }]);
    const deps = {
      ...scriptedDeps(model),
      config: { ...scriptedDeps(model).config, analyzeModel: "priced-later" },
    };
    const analyze = boundAnalyze(deps, { inputUsdPerMTok: 1_000_000, outputUsdPerMTok: 0 });
    const refused = await analyze({ photos: [photo] }).catch((error: unknown) => error);
    expect(refused).toBeInstanceOf(AiOutputInvalidError);
    expect((refused as AiOutputInvalidError).usage?.costUsd).toBe(20);
  });

  it("passes other errors through", async () => {
    const analyze = boundAnalyze(
      { config: { provider: "anthropic", analyzeModel: "m", chatModel: "m", apiKey: undefined } },
      undefined,
    );
    await expect(analyze({ photos: [photo] })).rejects.toThrow(/AI_API_KEY/);
  });
});
