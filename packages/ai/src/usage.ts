/** Usage of one AI call, for the `ai_usage` table (issue #337, decision 337, 5). */
import type { AiProviderName } from "@tafsila/config";
import type { LanguageModelUsage } from "ai";

/** Tokens, model, latency and estimated cost of one call (all attempts of a retry together). */
export interface AiUsage {
  /** Provider name. */
  readonly provider: AiProviderName;
  /** Model id. */
  readonly model: string;
  /** Prompt tokens, summed over attempts. */
  readonly inputTokens: number;
  /** Answer tokens, summed over attempts. */
  readonly outputTokens: number;
  /** Wall time of the whole call, retries included, in ms. */
  readonly latencyMs: number;
  /** Estimated cost in US dollars from `PRICE_TABLE_USD_PER_MTOK`; undefined when the model has no row. */
  readonly costUsd: number | undefined;
  /** Model attempts made: 1, or 2 after a retry. */
  readonly attempts: number;
}

/** Price per million tokens of one model, in US dollars. */
export interface ModelPrice {
  /** Input (prompt) tokens. */
  readonly inputUsdPerMTok: number;
  /** Output tokens. */
  readonly outputUsdPerMTok: number;
}

/**
 * Prices by model id, an estimate only (decision 337, 5). The fake model is free. Real models get their row when the
 * provider eval (#347) picks them; until then their cost is unknown rather than guessed.
 */
export const PRICE_TABLE_USD_PER_MTOK: Readonly<Record<string, ModelPrice>> = {
  fake: { inputUsdPerMTok: 0, outputUsdPerMTok: 0 },
};

/** Tokens in a million. */
const TOKENS_PER_MILLION = 1_000_000;

/**
 * Estimates the cost of a call.
 *
 * @param model - Model id.
 * @param inputTokens - Prompt tokens.
 * @param outputTokens - Answer tokens.
 * @param prices - Price table (defaults to `PRICE_TABLE_USD_PER_MTOK`).
 * @returns Cost in US dollars, or undefined for a model without a price.
 */
export function estimateCostUsd(
  model: string,
  inputTokens: number,
  outputTokens: number,
  prices: Readonly<Record<string, ModelPrice>> = PRICE_TABLE_USD_PER_MTOK,
): number | undefined {
  const price = prices[model];
  if (price === undefined) return undefined;
  return (inputTokens * price.inputUsdPerMTok + outputTokens * price.outputUsdPerMTok) / TOKENS_PER_MILLION;
}

/**
 * Sums the token counts of each attempt and adds latency and cost.
 *
 * @param provider - Provider name.
 * @param model - Model id.
 * @param attempts - The SDK usage of each attempt (missing counts read as 0).
 * @param latencyMs - Wall time of the whole call.
 * @returns The usage record.
 */
export function buildUsage(
  provider: AiProviderName,
  model: string,
  attempts: readonly (LanguageModelUsage | undefined)[],
  latencyMs: number,
): AiUsage {
  const inputTokens = attempts.reduce((sum, usage) => sum + (usage?.inputTokens ?? 0), 0);
  const outputTokens = attempts.reduce((sum, usage) => sum + (usage?.outputTokens ?? 0), 0);
  return {
    provider,
    model,
    inputTokens,
    outputTokens,
    latencyMs,
    costUsd: estimateCostUsd(model, inputTokens, outputTokens),
    attempts: attempts.length,
  };
}
