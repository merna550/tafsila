/** Drizzle client repository: every query runs as the user through withUser, so RLS decides what is visible. */
import type { Client } from "@tafsila/schemas";
import { desc, eq, getTableColumns, ilike, sql } from "drizzle-orm";
import type { ClientRepository } from "../../ports/client-repository";
import { clients, measurementSets } from "./schema";
import type { WithUser } from "./with-user";

/** Columns of `clients` plus the aggregate columns of {@link summaryColumns}. */
type ClientDbRow = typeof clients.$inferSelect & {
  readonly setCount: number;
  readonly latestSizeLabel: string | null;
  readonly lastSetAt: Date | string | null;
};

/** Sets of the client in the current row, newest first (RLS limits them to the caller's). */
const ofClient = sql`${measurementSets.clientId} = ${clients.id}`;

/**
 * Aggregate columns read together with each client row: one query per page, never one per client.
 * The count comes from the sets table, the label and date from the newest set (indexed on `client_id`).
 */
const summaryColumns = {
  setCount: sql<number>`(select count(*)::int from ${measurementSets} where ${ofClient})`,
  latestSizeLabel: sql<
    string | null
  >`(select ${measurementSets.sizeLabel} from ${measurementSets} where ${ofClient} order by ${measurementSets.createdAt} desc, ${measurementSets.id} desc limit 1)`,
  lastSetAt: sql<
    Date | string | null
  >`(select max(${measurementSets.createdAt}) from ${measurementSets} where ${ofClient})`,
};

/** What every client read selects: the table columns and the summary. */
const clientColumns = { ...getTableColumns(clients), ...summaryColumns };

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
  return {
    id: row.id,
    name: row.name,
    notes: row.notes,
    createdAt: row.createdAt.toISOString(),
    summary: {
      measurementSetCount: row.setCount,
      latestSizeLabel: row.latestSizeLabel,
      lastMeasurementAt: row.lastSetAt === null ? null : new Date(row.lastSetAt).toISOString(),
    },
  };
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
        return toClient({ ...row, setCount: 0, latestSizeLabel: null, lastSetAt: null });
      }),
    list: (ctx, { q, limit, offset }) =>
      withUser(ctx, async (tx) => {
        const where = q ? ilike(clients.name, `%${escapeLike(q)}%`) : undefined;
        const rows = await tx
          .select(clientColumns)
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
        const [row] = await tx.select(clientColumns).from(clients).where(eq(clients.id, id));
        return row ? toClient(row) : undefined;
      }),
    update: (ctx, id, patch) =>
      withUser(ctx, async (tx) => {
        const changes = {
          ...(patch.name !== undefined ? { name: patch.name } : {}),
          ...(patch.notes !== undefined ? { notes: patch.notes } : {}),
        };
        const updated = await tx
          .update(clients)
          .set(changes)
          .where(eq(clients.id, id))
          .returning({ id: clients.id });
        if (updated.length === 0) return undefined;
        const [row] = await tx.select(clientColumns).from(clients).where(eq(clients.id, id));
        return row ? toClient(row) : undefined;
      }),
    remove: (ctx, id) =>
      withUser(ctx, async (tx) => {
        const deleted = await tx.delete(clients).where(eq(clients.id, id)).returning({ id: clients.id });
        return deleted.length > 0;
      }),
  };
}
