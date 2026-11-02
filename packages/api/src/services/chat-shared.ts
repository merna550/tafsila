/** Helpers shared by the chat services: the answer of a proposal and the AI usage rows of chat calls. */
import type { AiDeps, AiUsage } from "@tafsila/ai";
import { applySpecPatch } from "@tafsila/engine/spec-rules";
import type { BilingualText, DesignSpec, SpecPatch } from "@tafsila/schemas";
import { describeChanges } from "../domain/describe-changes";
import type { AiUsageRepository } from "../ports/ai-usage-repository";

/** Turns of the conversation sent back to the model with each request (decision 343, 5). */
export const CHAT_HISTORY_TURNS = 6;

/** Said when the model returned changes that leave the design as it is. */
const NO_CHANGE: BilingualText = {
  ar: "التصميم بالفعل بهذا الشكل، لا يوجد تعديل لتطبيقه.",
  en: "The design already looks like this, there is no change to apply.",
};

/** What the assistant answers to one message, before it is stored. */
export interface ChatAnswer {
  readonly outcome: "proposal" | "unsupported";
  /** English text kept as the assistant turn. */
  readonly content: string;
  /** The patch to store (`unsupported` is set when the outcome is `unsupported`). */
  readonly patch: SpecPatch;
  /** Summary lines, or the closest supported changes for an `unsupported` answer. */
  readonly changes: BilingualText[];
}

/**
 * Describes the closest supported changes of an unsupported answer; one the engine refuses is left out.
 *
 * @param spec - The design the request was made on.
 * @param closest - Ops the model offered instead.
 * @returns The summary lines.
 */
function closestLines(spec: DesignSpec, closest: SpecPatch["ops"] | undefined): BilingualText[] {
  if (!closest || closest.length === 0) return [];
  const applied = applySpecPatch(spec, { ops: [...closest] });
  return applied.ok ? describeChanges(applied.changes) : [];
}

/**
 * Builds the answer from what the model proposed: a proposal only when the engine accepts the patch and it changes something.
 *
 * @param spec - The design the request was made on.
 * @param proposed - The model's patch and the engine's verdict on it.
 * @returns The answer to store and return.
 */
export function buildChatAnswer(
  spec: DesignSpec,
  proposed: { readonly patch: SpecPatch; readonly outcome: ReturnType<typeof applySpecPatch> },
): ChatAnswer {
  const { patch, outcome } = proposed;
  if (outcome.ok && patch.ops.length > 0 && outcome.changes.length > 0) {
    const changes = describeChanges(outcome.changes);
    return { outcome: "proposal", content: changes.map((line) => line.en).join("; "), patch, changes };
  }
  const text = patch.unsupported?.text ?? NO_CHANGE;
  const stored: SpecPatch = {
    ops: [],
    unsupported: { text, ...(patch.unsupported?.closest ? { closest: patch.unsupported.closest } : {}) },
  };
  return {
    outcome: "unsupported",
    content: text.en,
    patch: stored,
    changes: closestLines(spec, patch.unsupported?.closest),
  };
}

/** The part of an AI usage record a chat row needs. */
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
export function failedChatUsage(ai: AiDeps, elapsedMs: number): UsageFields {
  return {
    provider: ai.config.provider,
    model: ai.config.chatModel,
    inputTokens: 0,
    outputTokens: 0,
    costUsd: 0,
    latencyMs: elapsedMs,
  };
}

/**
 * Writes one `ai_usage` row of kind `chat`.
 *
 * @param aiUsage - AI usage repository.
 * @param userId - The user.
 * @param designId - The design.
 * @param usage - Provider, model, tokens, cost and latency.
 */
export async function recordChatUsage(
  aiUsage: AiUsageRepository,
  userId: string,
  designId: string,
  usage: UsageFields,
): Promise<void> {
  await aiUsage.record({
    userId,
    designId,
    kind: "chat",
    provider: usage.provider,
    model: usage.model,
    inputTokens: usage.inputTokens,
    outputTokens: usage.outputTokens,
    costUsd: usage.costUsd ?? 0,
    latencyMs: Math.round(usage.latencyMs),
  });
}
