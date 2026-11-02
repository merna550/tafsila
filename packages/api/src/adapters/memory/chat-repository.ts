/** In-memory chat repository for tests and `pnpm api:test`; filters by owner exactly as RLS does (no admin read). */
import { toStoredChatMessage } from "../../domain/chat-message-row";
import type { ChatRepository } from "../../ports/chat-repository";
import type { ChatRow, MemoryOptions, MemoryStore } from "./memory-store";

/**
 * Creates the in-memory chat repository.
 *
 * @param store - Shared fake database (its designs decide who owns a message).
 * @param options - Time and id sources.
 * @returns A ChatRepository.
 */
export function createMemoryChatRepository(store: MemoryStore, options: MemoryOptions = {}): ChatRepository {
  const now = options.now ?? (() => new Date());
  const newId = options.newId ?? (() => crypto.randomUUID());
  return {
    list: (ctx, designId) =>
      Promise.resolve(
        store.chats
          .filter((row) => row.designId === designId && row.ownerId === ctx.userId)
          .map(toStoredChatMessage),
      ),
    addExchange(ctx, input) {
      if (!store.designs.some((d) => d.id === input.designId && d.ownerId === ctx.userId)) {
        return Promise.resolve(undefined);
      }
      const common = { designId: input.designId, ownerId: ctx.userId, createdAt: now().toISOString() };
      const user: ChatRow = {
        ...common,
        id: newId(),
        role: "user",
        content: input.userMessage,
        outcome: "none",
        changes: [],
        proposedPatch: null,
        baseVersionId: input.baseVersionId,
        appliedVersionId: null,
      };
      const assistant: ChatRow = {
        ...common,
        id: newId(),
        role: "assistant",
        content: input.answer.content,
        outcome: input.answer.outcome,
        changes: [...input.answer.changes],
        proposedPatch: input.answer.patch,
        baseVersionId: input.baseVersionId,
        appliedVersionId: null,
      };
      store.chats.push(user, assistant);
      return Promise.resolve(toStoredChatMessage(assistant));
    },
    get(ctx, designId, messageId) {
      const row = store.chats.find(
        (m) => m.id === messageId && m.designId === designId && m.ownerId === ctx.userId,
      );
      return Promise.resolve(row ? toStoredChatMessage(row) : undefined);
    },
    markApplied(ctx, messageId, versionId) {
      store.chats = store.chats.map((m) =>
        m.id === messageId && m.ownerId === ctx.userId ? { ...m, appliedVersionId: versionId } : m,
      );
      return Promise.resolve();
    },
  };
}
