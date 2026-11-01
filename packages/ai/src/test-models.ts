/** Test helpers: AI SDK test models with scripted answers (issue #337). No network. */
import { loadAiConfig } from "@tafsila/config";
import { MockLanguageModelV4 } from "ai/test";
import { PHOTO_URLS } from "./fake-model";
import type { AiDeps } from "./provider";

/** Milliseconds the test clock advances per reading. */
const TICK_MS = 7;

/** Usage every scripted answer reports. */
const USAGE = {
  inputTokens: { total: 10, noCache: 10, cacheRead: 0, cacheWrite: 0 },
  outputTokens: { total: 5, text: 5, reasoning: 0 },
};

/** One scripted answer: JSON text, or tool calls. */
export type ScriptedAnswer =
  { readonly text: string } | { readonly calls: readonly { toolName: string; input: unknown }[] };

/**
 * A test model that gives the scripted answers in order.
 *
 * @param answers - One answer per call.
 * @returns The model; its `doGenerateCalls` records what it was sent.
 */
export function scriptedModel(answers: readonly ScriptedAnswer[]): MockLanguageModelV4 {
  return new MockLanguageModelV4({
    modelId: "test-model",
    supportedUrls: PHOTO_URLS,
    doGenerate: answers.map((answer) => ({
      content:
        "text" in answer
          ? [{ type: "text" as const, text: answer.text }]
          : answer.calls.map((call, index) => ({
              type: "tool-call" as const,
              toolCallId: `call-${index}`,
              toolName: call.toolName,
              input: JSON.stringify(call.input),
            })),
      finishReason: {
        unified: "text" in answer ? ("stop" as const) : ("tool-calls" as const),
        raw: undefined,
      },
      usage: USAGE,
      warnings: [],
    })),
  });
}

/**
 * Dependencies that use a scripted model and a fixed clock.
 *
 * @param model - The scripted model.
 * @returns Dependencies with the fake configuration.
 */
export function scriptedDeps(model: MockLanguageModelV4): AiDeps {
  let tick = 0;
  return { config: loadAiConfig({ AI_PROVIDER: "fake" }), model, now: () => (tick += TICK_MS) };
}
