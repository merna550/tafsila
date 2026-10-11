/** Drizzle client repository: every query runs as the user through withUser, so RLS decides what is visible. */
import type { Client } from "@tafsila/schemas";
import { desc, eq, ilike, sql } from "drizzle-orm";
import type { ClientRepository } from "../../ports/client-repository";
import { clients } from "./schema";
import type { WithUser } from "./with-user";

/** Database row of `clients`. */
type ClientDbRow = typeof clients.$inferSelect;

/**
 * Escapes `%`, `_` and `\` so a search term is matched literally by LIKE.
 *
 * @param term - Raw search text.
 * @returns Text safe to wrap in `%...%`.
 */
export function escapeLike(term: string): string {
  return term.replace(/[\\%_]/g, (char) => `\\${char}`);
}

/**
 * Maps a row to the API shape.
 *
 * @param row - Database row.
 * @returns The client with an ISO date.
 */
function toClient(row: ClientDbRow): Client {
  return { id: row.id, name: row.name, notes: row.notes, createdAt: row.createdAt.toISOString() };
}

/**
 * Creates the Drizzle client repository.
 *
 * @param withUser - Transaction runner that applies the user's RLS.
 * @returns A ClientRepository.
 */
export function createClientRepository(withUser: WithUser): ClientRepository {
  return {
    create: (ctx, input) =>
      withUser(ctx, async (tx) => {
        const [row] = await tx
          .insert(clients)
          .values({ ownerId: ctx.userId, name: input.name, notes: input.notes ?? null })
          .returning();
        if (!row) throw new Error("insert returned no row");
        return toClient(row);
      }),
    list: (ctx, { q, limit, offset }) =>
      withUser(ctx, async (tx) => {
        const where = q ? ilike(clients.name, `%${escapeLike(q)}%`) : undefined;
        const rows = await tx
          .select()
          .from(clients)
          .where(where)
          .orderBy(desc(clients.createdAt), desc(clients.id))
          .limit(limit)
          .offset(offset);
        const [counted] = await tx
          .select({ total: sql<number>`count(*)::int` })
          .from(clients)
          .where(where);
        return { items: rows.map(toClient), total: counted?.total ?? 0, limit, offset };
      }),
    count: (ctx) =>
      withUser(ctx, async (tx) => {
        const [counted] = await tx.select({ total: sql<number>`count(*)::int` }).from(clients);
        return counted?.total ?? 0;
      }),
    get: (ctx, id) =>
      withUser(ctx, async (tx) => {
        const [row] = await tx.select().from(clients).where(eq(clients.id, id));
        return row ? toClient(row) : undefined;
      }),
    update: (ctx, id, patch) =>
      withUser(ctx, async (tx) => {
        const changes = {
          ...(patch.name !== undefined ? { name: patch.name } : {}),
          ...(patch.notes !== undefined ? { notes: patch.notes } : {}),
        };
        const [row] = await tx.update(clients).set(changes).where(eq(clients.id, id)).returning();
        return row ? toClient(row) : undefined;
      }),
    remove: (ctx, id) =>
      withUser(ctx, async (tx) => {
        const deleted = await tx.delete(clients).where(eq(clients.id, id)).returning({ id: clients.id });
        return deleted.length > 0;
      }),
  };
}
