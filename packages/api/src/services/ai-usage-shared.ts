/** Helpers shared by the services that call the chat-tier model (chat edits, fabric explanation): the `ai_usage` row of a call, also a failed one. */
import type { AiDeps, AiUsage } from "@tafsila/ai";
import type { AiUsageKind, AiUsageRepository } from "../ports/ai-usage-repository";

/** The part of an AI usage record an `ai_usage` row needs. */
type UsageFields = Pick<AiUsage, "provider" | "model" | "inputTokens" | "outputTokens" | "latencyMs"> & {
  readonly costUsd: number | undefined;
};

/**
 * What a failed call cost: nothing is known about the tokens when the provider never answered.
 *
 * @param ai - The AI configuration used.
 * @param elapsedMs - Time spent.
 * @returns The usage fields to record.
 */
export function failedAiUsage(ai: AiDeps, elapsedMs: number): UsageFields {
  return {
    provider: ai.config.provider,
    model: ai.config.chatModel,
    inputTokens: 0,
    outputTokens: 0,
    costUsd: 0,
    latencyMs: elapsedMs,
  };
}

/** What one `ai_usage` row is about. */
export interface UsageSubject {
  /** Kind of call. */
  readonly kind: AiUsageKind;
  /** The user. */
  readonly userId: string;
  /** The design. */
  readonly designId: string;
}

/**
 * Writes one `ai_usage` row.
 *
 * @param aiUsage - AI usage repository.
 * @param subject - Kind of call, user and design.
 * @param usage - Provider, model, tokens, cost and latency.
 */
export async function recordAiUsage(
  aiUsage: AiUsageRepository,
  subject: UsageSubject,
  usage: UsageFields,
): Promise<void> {
  const { kind, userId, designId } = subject;
  await aiUsage.record({
    userId,
    designId,
    kind,
    provider: usage.provider,
    model: usage.model,
    inputTokens: usage.inputTokens,
    outputTokens: usage.outputTokens,
    costUsd: usage.costUsd ?? 0,
    latencyMs: Math.round(usage.latencyMs),
  });
}
