/**
 * Command-line side of `pnpm ai:eval` (issue #338): flags, the photo loader and the provider binding. The photos stay
 * outside the repo; a photos folder inside it is refused so a photo can never be committed by accident.
 */
import { readFile, stat } from "node:fs/promises";
import { createRequire } from "node:module";
import { extname, isAbsolute, join, relative, resolve } from "node:path";
import { parseArgs } from "node:util";
import { loadAiConfig, type AiConfig } from "@tafsila/config";
import { analyzeDesign, type DesignPhoto } from "../analyze-design";
import { AiOutputInvalidError } from "../errors";
import type { AiDeps } from "../provider";
import { estimateCostUsd, type AiUsage, type ModelPrice } from "../usage";
import type { EvalLabel } from "./labels";
import { DEFAULT_CHAT_ALLOWANCE_EGP, DEFAULT_USD_EGP } from "./report";
import { DEFAULT_TIMEOUT_MS, type RunDeps, type RunLimits } from "./run";

/** Media types of the photo files the harness reads. */
const MEDIA_TYPES: Readonly<Record<string, string>> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

/** Where a placeholder photo points when the fake provider runs without photos. */
const PLACEHOLDER_PHOTO_BASE = "https://example.invalid/ai-eval/";

/** The 3-label sample set in `@tafsila/test-fixtures` that CI and fake runs use. */
export const SAMPLE_LABELS_PATH = createRequire(import.meta.url).resolve(
  "@tafsila/test-fixtures/ai-eval/labels.sample.json",
);

/**
 * The labels file when `--labels` is not given.
 *
 * @param photos - The photos folder, if any.
 * @returns `labels.json` in the photos folder, or the sample set when there are no photos.
 */
export function defaultLabelsPath(photos: string | undefined): string {
  return photos === undefined ? SAMPLE_LABELS_PATH : join(photos, "labels.json");
}

/** Everything a run needs from the command line. */
export interface EvalArgs {
  /** Provider, models and key (flags over env). */
  readonly config: AiConfig;
  /** Photos folder or URL-list file; none for a fake run. */
  readonly photos: string | undefined;
  /** Labels file; undefined means the 3-label sample (fake runs) or `labels.json` in the photos folder. */
  readonly labels: string | undefined;
  /** Output folder. */
  readonly out: string;
  /** Only these label ids. */
  readonly only: readonly string[] | undefined;
  /** Hint, photo cap, budget, timeout. */
  readonly limits: RunLimits;
  /** EGP per USD. */
  readonly usdEgp: number;
  /** Chat allowance per pattern, EGP. */
  readonly chatAllowanceEgp: number;
  /** Price to use for the model when the price table has none. */
  readonly price: ModelPrice | undefined;
}

/**
 * Reads an optional number flag.
 *
 * @param value - The flag's text.
 * @param name - The flag, for the error.
 * @returns The number, or undefined when not given.
 * @throws {Error} When the text is not a non-negative number.
 */
function numberFlag(value: string | undefined, name: string): number | undefined {
  if (value === undefined) return undefined;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) throw new Error(`--${name} must be a non-negative number`);
  return parsed;
}

/** The flags of `pnpm ai:eval`. */
const FLAGS = {
  provider: { type: "string" },
  model: { type: "string" },
  photos: { type: "string" },
  labels: { type: "string" },
  out: { type: "string", default: "eval-runs" },
  only: { type: "string" },
  hint: { type: "boolean", default: false },
  "max-photos": { type: "string" },
  "budget-usd": { type: "string" },
  "timeout-ms": { type: "string" },
  "usd-egp": { type: "string" },
  "chat-egp": { type: "string" },
  "input-usd-per-mtok": { type: "string" },
  "output-usd-per-mtok": { type: "string" },
} as const;

/**
 * The AI configuration: `--provider` and `--model` override `AI_PROVIDER` and `AI_MODEL_ANALYZE`; the key is only ever
 * read from `AI_API_KEY`.
 *
 * @param values - Parsed flags.
 * @param env - The environment.
 * @returns The configuration.
 */
function configFrom(
  values: { provider?: string; model?: string },
  env: Record<string, string | undefined>,
): AiConfig {
  const model = values.model ?? env.AI_MODEL_ANALYZE;
  return loadAiConfig({
    ...env,
    AI_PROVIDER: values.provider ?? env.AI_PROVIDER,
    AI_MODEL_ANALYZE: model,
    AI_MODEL_CHAT: env.AI_MODEL_CHAT ?? model,
  });
}

/**
 * Parses the command line.
 *
 * @param argv - Arguments after the script name.
 * @param env - The environment (for `AI_*`).
 * @returns The run settings.
 * @throws {Error} On an unknown flag, a bad number, or a real provider without `--photos`.
 */
export function parseEvalArgs(argv: readonly string[], env: Record<string, string | undefined>): EvalArgs {
  const { values } = parseArgs({ args: [...argv], options: FLAGS, strict: true, allowPositionals: false });
  const config = configFrom(values, env);
  if (config.provider !== "fake" && values.photos === undefined)
    throw new Error("--photos is required for a real provider");
  const input = numberFlag(values["input-usd-per-mtok"], "input-usd-per-mtok");
  const output = numberFlag(values["output-usd-per-mtok"], "output-usd-per-mtok");
  return {
    config,
    photos: values.photos,
    labels: values.labels,
    out: values.out,
    only: values.only?.split(",").map((id) => id.trim()),
    limits: {
      hint: values.hint,
      maxPhotos: numberFlag(values["max-photos"], "max-photos"),
      budgetUsd: numberFlag(values["budget-usd"], "budget-usd"),
      timeoutMs: numberFlag(values["timeout-ms"], "timeout-ms") ?? DEFAULT_TIMEOUT_MS,
    },
    usdEgp: numberFlag(values["usd-egp"], "usd-egp") ?? DEFAULT_USD_EGP,
    chatAllowanceEgp: numberFlag(values["chat-egp"], "chat-egp") ?? DEFAULT_CHAT_ALLOWANCE_EGP,
    price:
      input === undefined || output === undefined
        ? undefined
        : { inputUsdPerMTok: input, outputUsdPerMTok: output },
  };
}

/**
 * Whether a path lies inside a folder.
 *
 * @param path - The path.
 * @param folder - The folder.
 * @returns True when inside (or equal).
 */
export function isInside(path: string, folder: string): boolean {
  const rel = relative(resolve(folder), resolve(path));
  return rel === "" || (!rel.startsWith("..") && !isAbsolute(rel));
}

/**
 * Reads a URL-list file: one `<photo name> <https URL>` per line; blank lines and `#` comments are skipped.
 *
 * @param text - The file's text.
 * @returns Photo name to URL.
 */
export function parseUrlList(text: string): Map<string, string> {
  const entries = text
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line !== "" && !line.startsWith("#"))
    .map((line) => line.split(/\s+/) as [string, string?]);
  return new Map(entries.flatMap(([name, url]) => (url === undefined ? [] : [[name, url] as const])));
}

/**
 * Builds the photo loader for a run.
 *
 * @param photos - A folder, a URL-list file, or undefined (placeholder URLs, fake provider only).
 * @param repoRoot - The repository root; a photos folder inside it is refused.
 * @returns A loader that gives each label's photo as bytes (folder) or as a URL.
 * @throws {Error} When the photos path is inside the repository.
 */
export async function photoSource(
  photos: string | undefined,
  repoRoot: string,
): Promise<RunDeps["photoFor"]> {
  if (photos === undefined) {
    return (label) =>
      Promise.resolve({
        url: `${PLACEHOLDER_PHOTO_BASE}${label.photo}`,
        mediaType: "image/jpeg",
        view: "front",
      });
  }
  if (isInside(photos, repoRoot))
    throw new Error("--photos must be outside the repository (photos never enter git)");
  if ((await stat(photos)).isDirectory()) return (label) => photoFromFolder(photos, label);
  const urls = parseUrlList(await readFile(photos, "utf8"));
  return (label) => {
    const url = urls.get(label.photo);
    if (url === undefined) return Promise.reject(new Error(`no URL for ${label.photo}`));
    return Promise.resolve({ url, mediaType: mediaTypeOf(label.photo), view: "front" });
  };
}

/**
 * The media type of a photo file name.
 *
 * @param name - The file name.
 * @returns The media type (JPEG when the extension is unknown).
 */
function mediaTypeOf(name: string): string {
  return MEDIA_TYPES[extname(name).toLowerCase()] ?? "image/jpeg";
}

/**
 * Reads one photo from the photos folder.
 *
 * @param folder - The folder.
 * @param label - The label.
 * @returns The photo as bytes.
 */
async function photoFromFolder(folder: string, label: EvalLabel): Promise<DesignPhoto> {
  const bytes = new Uint8Array(await readFile(join(folder, label.photo)));
  return { bytes, mediaType: mediaTypeOf(label.photo), view: "front" };
}

/**
 * The usage with its cost taken from a given price when the price table has no row for the model.
 *
 * @param usage - The usage.
 * @param price - The price from the flags, if any.
 * @returns The usage, re-priced when needed.
 */
export function withPrice(usage: AiUsage, price: ModelPrice | undefined): AiUsage {
  if (usage.costUsd !== undefined || price === undefined) return usage;
  const costUsd = estimateCostUsd(usage.model, usage.inputTokens, usage.outputTokens, {
    [usage.model]: price,
  });
  return { ...usage, costUsd };
}

/**
 * `analyzeDesign` bound to a configuration, with the flags' price applied to every usage (refused answers too).
 *
 * @param deps - Provider, model and key (and a test model in tests).
 * @param price - The price from the flags, if any.
 * @returns The analysis function of the run.
 */
export function boundAnalyze(deps: AiDeps, price: ModelPrice | undefined): RunDeps["analyze"] {
  return async (input) => {
    try {
      const output = await analyzeDesign(input, deps);
      return { ...output, usage: withPrice(output.usage, price) };
    } catch (error) {
      if (!(error instanceof AiOutputInvalidError) || error.usage === undefined) throw error;
      throw new AiOutputInvalidError(error.operation, error.detail, withPrice(error.usage, price));
    }
  };
}
