/** Use case: answer a chat message with a validated proposal or a polite "not supported" (FR-CHAT-01..04, FR-CHAT-06, NFR-04). The model never writes a version. */
import { proposeEdit, type AiDeps, type ChatTurn } from "@tafsila/ai";
import type {
  DesignSpec,
  SendChatMessageInput,
  SendChatMessageResult,
  StoredChatMessage,
} from "@tafsila/schemas";
import { AppError, NotFoundError } from "../domain/errors";
import type { AiUsageRepository } from "../ports/ai-usage-repository";
import type { ChatRepository } from "../ports/chat-repository";
import type { Clock } from "../ports/clock";
import type { DesignRepository } from "../ports/design-repository";
import type { ErrorReporter } from "../ports/error-reporter";
import type { PatternVersionRepository } from "../ports/pattern-version-repository";
import type { AuthContext } from "../ports/token-verifier";
import { failedAiUsage, recordAiUsage } from "./ai-usage-shared";
import { buildChatAnswer, CHAT_HISTORY_TURNS, type ChatAnswer } from "./chat-shared";

/** Ports and limits the use case needs. */
export interface SendChatMessageDeps {
  readonly designs: DesignRepository;
  readonly versions: PatternVersionRepository;
  readonly chat: ChatRepository;
  readonly aiUsage: AiUsageRepository;
  readonly errorReporter: ErrorReporter;
  readonly clock: Clock;
  /** The AI configuration, read per request so a bad one fails the request, not the app. */
  readonly aiDeps: () => AiDeps;
  /** Messages a user may send per design. */
  readonly chatMessagesPerDesign: number;
  /** Messages a user may send per UTC day. */
  readonly chatDailyLimit: number;
}

/**
 * The last turns of the conversation as the model reads them.
 *
 * @param messages - The stored messages, oldest first.
 * @returns At most the last six turns.
 */
function recentTurns(messages: readonly StoredChatMessage[]): ChatTurn[] {
  return messages.slice(-CHAT_HISTORY_TURNS).map((m) => ({ role: m.role, text: m.content }));
}

/**
 * Maps the stored answer to what the route returns.
 *
 * @param answer - The answer.
 * @param messageId - The stored assistant message id.
 * @param used - User messages sent for the design, this one included.
 * @param limit - The per-design limit.
 * @returns The result body.
 */
function toResult(answer: ChatAnswer, messageId: string, used: number, limit: number): SendChatMessageResult {
  const unsupported =
    answer.outcome === "unsupported" && answer.patch.unsupported
      ? { text: answer.patch.unsupported.text, closest: answer.changes }
      : undefined;
  return {
    messageId,
    outcome: answer.outcome,
    changes: answer.outcome === "proposal" ? answer.changes : [],
    ...(unsupported ? { unsupported } : {}),
    used,
    limit,
  };
}

/**
 * Sends one message: checks the design, the version and the caps, asks the model, stores the exchange and logs the usage.
 * An unsupported answer counts toward the quota; a failed provider call does not store anything but is logged.
 *
 * @param deps - Ports, AI configuration and limits.
 * @param ctx - Verified caller.
 * @param designId - Design id.
 * @param input - The message and the version it is about.
 * @returns The proposal or the explanation, with the quota.
 * @throws {NotFoundError} When the design or the version is missing or not the caller's.
 * @throws {AppError} CHAT_QUOTA_EXCEEDED, CHAT_DAILY_LIMIT or AI_CHAT_FAILED.
 */
export async function sendChatMessage(
  deps: SendChatMessageDeps,
  ctx: AuthContext,
  designId: string,
  input: SendChatMessageInput,
): Promise<SendChatMessageResult> {
  if (!(await deps.designs.get(ctx, designId))) throw new NotFoundError("design");
  const version = await deps.versions.get(ctx, input.versionId);
  if (!version || version.designId !== designId) throw new NotFoundError("version");
  const history = await deps.chat.list(ctx, designId);
  const used = history.filter((m) => m.role === "user").length;
  if (used >= deps.chatMessagesPerDesign) {
    throw new AppError("CHAT_QUOTA_EXCEEDED", {
      details: { quota: { used, limit: deps.chatMessagesPerDesign } },
    });
  }
  if ((await deps.aiUsage.countToday(ctx.userId, "chat", deps.clock.now())) >= deps.chatDailyLimit) {
    throw new AppError("CHAT_DAILY_LIMIT");
  }
  const answer = await propose(deps, ctx, {
    designId,
    message: input.message,
    spec: version.spec,
    history: recentTurns(history),
  });
  const stored = await deps.chat.addExchange(ctx, {
    designId,
    baseVersionId: version.id,
    userMessage: input.message,
    answer: {
      content: answer.content,
      patch: answer.patch,
      changes: answer.changes,
      outcome: answer.outcome,
    },
  });
  if (!stored) throw new NotFoundError("design");
  return toResult(answer, stored.id, used + 1, deps.chatMessagesPerDesign);
}

/** What one model call is about. */
interface ProposeRequest {
  readonly designId: string;
  readonly message: string;
  readonly spec: DesignSpec;
  readonly history: ChatTurn[];
}

/**
 * Asks the model and logs the call, also when it fails (a failed call may still cost).
 *
 * @param deps - Ports and AI configuration.
 * @param ctx - Verified caller.
 * @param request - The design, the message, its spec and the last turns.
 * @returns The answer to store.
 * @throws {AppError} AI_CHAT_FAILED when the provider fails.
 */
async function propose(
  deps: SendChatMessageDeps,
  ctx: AuthContext,
  request: ProposeRequest,
): Promise<ChatAnswer> {
  const { designId, spec } = request;
  const began = deps.clock.now().getTime();
  let ai: AiDeps | undefined;
  let proposed: Awaited<ReturnType<typeof proposeEdit>>;
  try {
    ai = deps.aiDeps();
    proposed = await proposeEdit({ spec, message: request.message, history: request.history }, ai);
  } catch (error) {
    deps.errorReporter.captureException(error, { requestId: `chat:${designId}` });
    if (ai) {
      const failed = failedAiUsage(ai, deps.clock.now().getTime() - began);
      await recordAiUsage(deps.aiUsage, { kind: "chat", userId: ctx.userId, designId }, failed);
    }
    throw new AppError("AI_CHAT_FAILED");
  }
  await recordAiUsage(deps.aiUsage, { kind: "chat", userId: ctx.userId, designId }, proposed.usage);
  return buildChatAnswer(spec, proposed);
}
