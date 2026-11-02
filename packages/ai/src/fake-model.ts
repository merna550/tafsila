/**
 * The fake provider (issue #337, decision 337, 2): a language model that answers from fixtures, for tests, local
 * development and CI. It speaks the AI SDK model interface, so the real call path (schema, tools, retry) runs unchanged.
 */
import type { LanguageModel } from "ai";
import { fakeAnalysis, fakeChatCalls, fakeExplanation } from "./fixtures/answers";

/** Which of the configured models a call uses; `explain` uses the chat model (decision 346, 3). */
export type ModelKind = "analyze" | "chat" | "explain";

/** Marker the analysis prompt writes before the category hint; the fake model reads it back. */
export const CATEGORY_HINT_MARKER = "Category hint:";

/** Marker the chat prompt writes before the user's request; the fake model matches keywords after it only. */
export const REQUEST_MARKER = "Request:";

/** Photo URLs the models read directly, so the SDK never downloads a photo itself. */
export const PHOTO_URLS: Readonly<Record<string, RegExp[]>> = { "image/*": [/^https:\/\//] };

/** Marker the explanation prompt writes before the language; the fake model reads it back. */
export const LANGUAGE_MARKER = "Language:";

/** Marker the explanation prompt writes before the fabric names to explain, one per line as `- id | Arabic | English`. */
export const FABRICS_MARKER = "Recommended fabrics:";

/** A model object (not a model id string). */
type Model = Exclude<LanguageModel, string>;

/** The SDK's call options, as the fake model sees them. */
type CallOptions = Parameters<Extract<Model, { specificationVersion: "v4" }>["doGenerate"]>[0];

/** The SDK's call result. */
type GenerateResult = Awaited<ReturnType<Extract<Model, { specificationVersion: "v4" }>["doGenerate"]>>;

/** Token counts the fake model reports for every answer, so usage is never empty. */
const FAKE_TOKENS = { input: 100, output: 50 } as const;

/**
 * The text of the last user message.
 *
 * @param options - The call options.
 * @returns Its text parts joined, or an empty string.
 */
function lastUserText(options: CallOptions): string {
  const user = options.prompt.filter((message) => message.role === "user").at(-1);
  if (user === undefined) return "";
  return user.content.map((part) => (part.type === "text" ? part.text : "")).join("\n");
}

/**
 * Reads the category hint written by the analysis prompt.
 *
 * @param text - The user message text.
 * @returns The category, or undefined.
 */
function categoryHint(text: string): "dress" | "skirt" | "blouse" | undefined {
  const match = new RegExp(`${CATEGORY_HINT_MARKER} (dress|skirt|blouse)`).exec(text);
  return match?.[1] as "dress" | "skirt" | "blouse" | undefined;
}

/**
 * Wraps content in a result with fixed usage.
 *
 * @param content - The answer content.
 * @param toolCalls - True when the answer is tool calls.
 * @returns The SDK result.
 */
function result(content: GenerateResult["content"], toolCalls: boolean): GenerateResult {
  return {
    content,
    finishReason: { unified: toolCalls ? "tool-calls" : "stop", raw: undefined },
    usage: {
      inputTokens: { total: FAKE_TOKENS.input, noCache: FAKE_TOKENS.input, cacheRead: 0, cacheWrite: 0 },
      outputTokens: { total: FAKE_TOKENS.output, text: FAKE_TOKENS.output, reasoning: 0 },
    },
    warnings: [],
  };
}

/**
 * Answers one call from the fixtures.
 *
 * @param kind - Analysis (JSON text), chat (tool calls) or explanation (plain text).
 * @param options - The call options.
 * @returns The answer.
 */
function answer(kind: ModelKind, options: CallOptions): GenerateResult {
  const text = lastUserText(options);
  if (kind === "analyze") {
    return result([{ type: "text", text: JSON.stringify(fakeAnalysis(categoryHint(text))) }], false);
  }
  if (kind === "explain") return result([{ type: "text", text: fakeExplanation(text) }], false);
  const marker = text.lastIndexOf(REQUEST_MARKER);
  const request = marker < 0 ? text : text.slice(marker + REQUEST_MARKER.length);
  const calls = fakeChatCalls(request).map((call, index) => ({
    type: "tool-call" as const,
    toolCallId: `fake-${index}`,
    toolName: call.toolName,
    input: JSON.stringify(call.input),
  }));
  return result(calls, true);
}

/**
 * Builds the fake model for a kind of call.
 *
 * @param kind - Analysis or chat.
 * @returns A model whose answers come from `fixtures/answers.ts`; streaming is not supported.
 */
export function createFakeModel(kind: ModelKind): LanguageModel {
  return {
    specificationVersion: "v4",
    provider: "fake",
    modelId: "fake",
    supportedUrls: PHOTO_URLS,
    doGenerate: (options: CallOptions) => Promise.resolve(answer(kind, options)),
    doStream: () => Promise.reject(new Error("The fake AI model does not stream")),
  };
}
