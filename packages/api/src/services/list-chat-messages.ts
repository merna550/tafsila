/** Use case: read a design's chat history with the quota (FR-CHAT-01, FR-CHAT-06). */
import type { ChatHistory, ChatMessage, StoredChatMessage } from "@tafsila/schemas";
import { NotFoundError } from "../domain/errors";
import type { ChatRepository } from "../ports/chat-repository";
import type { DesignRepository } from "../ports/design-repository";
import type { AuthContext } from "../ports/token-verifier";

/** Ports and limit the use case needs. */
export interface ListChatMessagesDeps {
  readonly designs: DesignRepository;
  readonly chat: ChatRepository;
  /** Messages a user may send per design. */
  readonly chatMessagesPerDesign: number;
}

/**
 * Lists the messages of a design, oldest first (newest last), without the stored patches.
 *
 * @param deps - Ports and the limit.
 * @param ctx - Verified caller.
 * @param designId - Design id.
 * @returns The messages, the user messages used and the limit.
 * @throws {NotFoundError} When the design is missing or not the caller's.
 */
export async function listChatMessages(
  deps: ListChatMessagesDeps,
  ctx: AuthContext,
  designId: string,
): Promise<ChatHistory> {
  if (!(await deps.designs.get(ctx, designId))) throw new NotFoundError("design");
  const stored = await deps.chat.list(ctx, designId);
  const items = stored.map(toPublic);
  return {
    items,
    used: stored.filter((m) => m.role === "user").length,
    limit: deps.chatMessagesPerDesign,
  };
}

/**
 * Drops the design id and the stored patch, which the client does not get.
 *
 * @param message - The stored message.
 * @returns The public message.
 */
function toPublic(message: StoredChatMessage): ChatMessage {
  return {
    id: message.id,
    role: message.role,
    content: message.content,
    outcome: message.outcome,
    changes: message.changes,
    ...(message.unsupported ? { unsupported: message.unsupported } : {}),
    baseVersionId: message.baseVersionId,
    appliedVersionId: message.appliedVersionId,
    createdAt: message.createdAt,
  };
}
