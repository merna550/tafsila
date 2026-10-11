/** In-memory client repository for tests and `pnpm api:test`; filters by owner exactly as RLS does. */
import type { Client } from "@tafsila/schemas";
import type { ClientRepository } from "../../ports/client-repository";
import { newestFirst, type ClientRow, type MemoryOptions, type MemoryStore } from "./memory-store";

/**
 * Removes the owner from a row.
 *
 * @param row - Stored row.
 * @returns The public client.
 */
function toClient(row: ClientRow): Client {
  return { id: row.id, name: row.name, notes: row.notes, createdAt: row.createdAt };
}

/**
 * Creates the in-memory client repository.
 *
 * @param store - Shared fake database.
 * @param options - Time and id sources.
 * @returns A ClientRepository.
 */
export function createMemoryClientRepository(
  store: MemoryStore,
  options: MemoryOptions = {},
): ClientRepository {
  const now = options.now ?? (() => new Date());
  const newId = options.newId ?? (() => crypto.randomUUID());
  /**
   * Rows owned by the user (what RLS would show).
   *
   * @param userId - The caller.
   * @returns Their rows.
   */
  const own = (userId: string) => store.clients.filter((row) => row.ownerId === userId);
  /**
   * One owned row by id.
   *
   * @param userId - The caller.
   * @param id - Row id.
   * @returns The row, or undefined.
   */
  const find = (userId: string, id: string) => own(userId).find((row) => row.id === id);
  return {
    create(ctx, input) {
      const row: ClientRow = {
        id: newId(),
        ownerId: ctx.userId,
        name: input.name,
        notes: input.notes ?? null,
        createdAt: now().toISOString(),
      };
      store.clients.push(row);
      return Promise.resolve(toClient(row));
    },
    list(ctx, { q, limit, offset }) {
      const needle = q?.toLowerCase();
      const matching = own(ctx.userId).filter((row) => !needle || row.name.toLowerCase().includes(needle));
      const items = newestFirst(matching)
        .slice(offset, offset + limit)
        .map(toClient);
      return Promise.resolve({ items, total: matching.length, limit, offset });
    },
    count: (ctx) => Promise.resolve(own(ctx.userId).length),
    get(ctx, id) {
      const row = find(ctx.userId, id);
      return Promise.resolve(row ? toClient(row) : undefined);
    },
    update(ctx, id, patch) {
      const row = find(ctx.userId, id);
      if (!row) return Promise.resolve(undefined);
      const next: ClientRow = {
        ...row,
        ...(patch.name !== undefined ? { name: patch.name } : {}),
        ...(patch.notes !== undefined ? { notes: patch.notes } : {}),
      };
      store.clients = store.clients.map((existing) => (existing === row ? next : existing));
      return Promise.resolve(toClient(next));
    },
    remove(ctx, id) {
      const row = find(ctx.userId, id);
      if (!row) return Promise.resolve(false);
      store.clients = store.clients.filter((existing) => existing !== row);
      store.sets = store.sets.filter((set) => set.clientId !== id);
      return Promise.resolve(true);
    },
  };
}
