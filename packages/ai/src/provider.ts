/**
 * Picks the language model from configuration (issue #337, SRS §2.4): switching provider is an env change only. The
 * provider wrappers stay in this file so an AI SDK upgrade touches one place.
 */
import { createAnthropic } from "@ai-sdk/anthropic";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import type { AiConfig } from "@tafsila/config";
import type { LanguageModel } from "ai";
import { createFakeModel } from "./fake-model";

/** Which of the two configured models a call uses. */
export type ModelKind = "analyze" | "chat";

/** What the two functions need: the configuration, and optionally a model to use instead (tests). */
export interface AiDeps {
  /** Provider, models and key, read by the caller from `packages/config/env.ts`. */
  readonly config: AiConfig;
  /** A model to use instead of the configured one (AI SDK test models in tests). */
  readonly model?: LanguageModel;
  /** Clock for latency, in ms (defaults to `performance.now`). */
  readonly now?: () => number;
}

/**
 * The model id a call reports in its usage.
 *
 * @param config - The configuration.
 * @param kind - Analysis or chat.
 * @returns The configured model id.
 */
export function modelId(config: AiConfig, kind: ModelKind): string {
  return kind === "analyze" ? config.analyzeModel : config.chatModel;
}

/**
 * Builds the language model for a call. Real providers are only constructed here; no request is sent until a call.
 *
 * @param config - The configuration.
 * @param kind - Analysis or chat.
 * @returns An AI SDK language model.
 * @throws {Error} When a real provider has no key.
 */
export function createModel(config: AiConfig, kind: ModelKind): LanguageModel {
  const id = modelId(config, kind);
  if (config.provider === "fake") return createFakeModel(kind);
  if (!config.apiKey) throw new Error(`AI_API_KEY is required for ${config.provider}`);
  if (config.provider === "anthropic") return createAnthropic({ apiKey: config.apiKey })(id);
  return createGoogleGenerativeAI({ apiKey: config.apiKey })(id);
}

/**
 * The model a call uses: the injected one, or the configured one.
 *
 * @param deps - The dependencies.
 * @param kind - Analysis or chat.
 * @returns The model.
 */
export function resolveModel(deps: AiDeps, kind: ModelKind): LanguageModel {
  return deps.model ?? createModel(deps.config, kind);
}
