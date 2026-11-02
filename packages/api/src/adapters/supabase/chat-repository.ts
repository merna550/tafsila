/** Drizzle chat repository: every query runs as the user through withUser (RLS: owner only, admins read nothing); an exchange is one transaction. */
import { and, asc, eq } from "drizzle-orm";
import { toStoredChatMessage } from "../../domain/chat-message-row";
import type { ChatRepository } from "../../ports/chat-repository";
import { chatMessages, designs } from "./schema";
import type { WithUser } from "./with-user";

/**
 * Maps a database row to the stored message.
 *
 * @param row - Database row.
 * @returns The stored message.
 */
function fromRow(row: typeof chatMessages.$inferSelect): ReturnType<typeof toStoredChatMessage> {
  return toStoredChatMessage({ ...row, createdAt: row.createdAt.toISOString() });
}

/**
 * Creates the Drizzle chat repository.
 *
 * @param withUser - Transaction runner that applies the user's RLS.
 * @returns A ChatRepository.
 */
export function createChatRepository(withUser: WithUser): ChatRepository {
  return {
    list: (ctx, designId) =>
      withUser(ctx, async (tx) => {
        const rows = await tx
          .select()
          .from(chatMessages)
          .where(and(eq(chatMessages.designId, designId), eq(chatMessages.ownerId, ctx.userId)))
          .orderBy(asc(chatMessages.seq));
        return rows.map(fromRow);
      }),
    addExchange: (ctx, input) =>
      withUser(ctx, async (tx) => {
        const [design] = await tx
          .select({ id: designs.id })
          .from(designs)
          .where(and(eq(designs.id, input.designId), eq(designs.ownerId, ctx.userId)));
        if (!design) return undefined;
        const base = { designId: input.designId, ownerId: ctx.userId, baseVersionId: input.baseVersionId };
        // Two statements in order, so `seq` keeps the user message before its answer.
        await tx.insert(chatMessages).values({ ...base, role: "user", content: input.userMessage });
        const [row] = await tx
          .insert(chatMessages)
          .values({
            ...base,
            role: "assistant",
            content: input.answer.content,
            outcome: input.answer.outcome,
            changes: [...input.answer.changes],
            proposedPatch: input.answer.patch,
          })
          .returning();
        if (!row) throw new Error("insert returned no row");
        return fromRow(row);
      }),
    get: (ctx, designId, messageId) =>
      withUser(ctx, async (tx) => {
        const [row] = await tx
          .select()
          .from(chatMessages)
          .where(
            and(
              eq(chatMessages.id, messageId),
              eq(chatMessages.designId, designId),
              eq(chatMessages.ownerId, ctx.userId),
            ),
          );
        return row ? fromRow(row) : undefined;
      }),
    markApplied: (ctx, messageId, versionId) =>
      withUser(ctx, async (tx) => {
        await tx
          .update(chatMessages)
          .set({ appliedVersionId: versionId })
          .where(and(eq(chatMessages.id, messageId), eq(chatMessages.ownerId, ctx.userId)));
      }),
  };
}
