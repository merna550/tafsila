/**
 * Photo analysis (issue #337, FR-DES-03, FR-DES-07, SRS §9): photos in, a schema-valid `DesignAnalysisResult` out,
 * checked by the engine's spec rules.
 */
import { normalizeSpec } from "@tafsila/engine/spec-rules";
import {
  designAnalysisResultSchema,
  type DesignAnalysisResult,
  type GarmentCategory,
} from "@tafsila/schemas";
import { generateText, NoObjectGeneratedError, Output, type LanguageModelUsage, type ModelMessage } from "ai";
import { AiOutputInvalidError } from "./errors";
import { CATEGORY_HINT_MARKER } from "./fake-model";
import { analyzeSystemPrompt } from "./prompts";
import { modelId, resolveModel, type AiDeps } from "./provider";
import { buildUsage, type AiUsage } from "./usage";

/** One garment photo: a URL or the bytes, never both needed. */
export interface DesignPhoto {
  /** Signed URL of the photo. */
  readonly url?: string;
  /** Photo bytes, when there is no URL. */
  readonly bytes?: Uint8Array;
  /** IANA media type, such as `image/jpeg`. */
  readonly mediaType: string;
  /** Which side of the garment it shows. */
  readonly view: "front" | "back" | "side" | "detail";
}

/** Input of `analyzeDesign`. */
export interface AnalyzeDesignInput {
  /** One to a few photos of the same garment. */
  readonly photos: readonly DesignPhoto[];
  /** What the user already told us. */
  readonly hint?: { readonly category?: GarmentCategory };
}

/** Output of `analyzeDesign`. */
export interface AnalyzeDesignOutput {
  /** The analysis, with any feature the engine refused already replaced and marked. */
  readonly result: DesignAnalysisResult;
  /** Tokens, model, latency and cost. */
  readonly usage: AiUsage;
}

/** Note added to a feature the engine refused in the model's answer. */
const ENGINE_CHANGED_NOTE = {
  ar: "غيّرنا هذه الميزة لأن الباترون لا يُرسم بها مع باقي التصميم. راجعيها.",
  en: "We changed this feature because the pattern cannot be drafted with it and the rest of the design. Please check it.",
} as const;

/**
 * The user message: the hint, then one image per photo.
 *
 * @param input - The photos and hint.
 * @returns The message.
 */
function userMessage(input: AnalyzeDesignInput): ModelMessage {
  const hint = input.hint?.category ? `${CATEGORY_HINT_MARKER} ${input.hint.category}` : "No category hint.";
  const views = input.photos.map((photo) => photo.view).join(", ");
  return {
    role: "user",
    content: [
      { type: "text", text: `${hint}\nPhoto views in order: ${views}.` },
      ...input.photos.map((photo) => ({
        type: "image" as const,
        image: photo.url === undefined ? (photo.bytes ?? new Uint8Array()) : new URL(photo.url),
        mediaType: photo.mediaType,
      })),
    ],
  };
}

/**
 * Replaces features the engine refuses with ones it accepts, at confidence 0 with a note (decision 337).
 *
 * @param result - The model's schema-valid answer.
 * @returns The same result when the engine accepts the spec, otherwise the corrected one.
 */
export function withEngineRules(result: DesignAnalysisResult): DesignAnalysisResult {
  const { spec, changed } = normalizeSpec(result.spec);
  if (changed.length === 0) return result;
  return {
    ...result,
    spec,
    confidence: { ...result.confidence, ...Object.fromEntries(changed.map((path) => [path, 0])) },
    notes: [
      ...result.notes.filter((note) => !changed.includes(note.path)),
      ...changed.map((path) => ({ path, text: { ...ENGINE_CHANGED_NOTE } })),
    ],
  };
}

/** One model attempt: the parsed answer, or the error to send back. */
type Attempt =
  | { readonly ok: true; readonly result: DesignAnalysisResult; readonly usage: LanguageModelUsage }
  | {
      readonly ok: false;
      readonly text: string;
      readonly error: string;
      readonly usage?: LanguageModelUsage;
    };

/**
 * Asks the model once.
 *
 * @param deps - The dependencies.
 * @param messages - The conversation so far.
 * @returns The answer or its validation error.
 */
async function attempt(deps: AiDeps, messages: ModelMessage[]): Promise<Attempt> {
  try {
    const answer = await generateText({
      model: resolveModel(deps, "analyze"),
      system: analyzeSystemPrompt(),
      messages,
      temperature: 0,
      output: Output.object({ schema: designAnalysisResultSchema, name: "DesignAnalysisResult" }),
    });
    return { ok: true, result: answer.output, usage: answer.usage };
  } catch (error) {
    if (!NoObjectGeneratedError.isInstance(error)) throw error;
    const cause = error.cause instanceof Error ? error.cause.message : error.message;
    return { ok: false, text: error.text ?? "", error: cause, usage: error.usage };
  }
}

/**
 * Analyses garment photos into a design. Invalid model output is retried once with the validation error; a second
 * invalid answer throws.
 *
 * @param input - Photos and an optional category hint.
 * @param deps - Configuration (and a test model).
 * @returns The analysis and its usage.
 * @throws {AiOutputInvalidError} When both answers fail the schema.
 * @example
 * const { result } = await analyzeDesign({ photos: [photo] }, createFakeAi());
 */
export async function analyzeDesign(input: AnalyzeDesignInput, deps: AiDeps): Promise<AnalyzeDesignOutput> {
  const now = deps.now ?? (() => performance.now());
  const started = now();
  const messages: ModelMessage[] = [userMessage(input)];
  const first = await attempt(deps, messages);
  const final = first.ok ? first : await attempt(deps, [...messages, ...retryMessages(first)]);
  const usages = first.ok ? [first.usage] : [first.usage, final.usage];
  if (!final.ok) throw new AiOutputInvalidError("analyzeDesign", final.error);
  const usage = buildUsage(deps.config.provider, modelId(deps.config, "analyze"), usages, now() - started);
  return { result: withEngineRules(final.result), usage };
}

/**
 * The messages that show the model its invalid answer and the error.
 *
 * @param failed - The failed attempt.
 * @returns The assistant answer and the user's correction request.
 */
function retryMessages(failed: Extract<Attempt, { ok: false }>): ModelMessage[] {
  return [
    { role: "assistant", content: failed.text || "(no answer)" },
    {
      role: "user",
      content: `Your answer did not match the schema: ${failed.error}\nAnswer again with valid JSON only.`,
    },
  ];
}
