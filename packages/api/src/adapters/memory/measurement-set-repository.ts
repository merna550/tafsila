/** In-memory measurement set repository for tests and `pnpm api:test`; filters by owner exactly as RLS does. */
import { NotFoundError } from "../../domain/errors";
import type { MeasurementSetRepository, StoredMeasurementSet } from "../../ports/measurement-set-repository";
import { newestFirst, type MemoryOptions, type MemoryStore, type SetRow } from "./memory-store";

/**
 * Removes the owner from a row.
 *
 * @param row - Stored row.
 * @returns The public stored set.
 */
function toSet(row: SetRow): StoredMeasurementSet {
  return {
    id: row.id,
    clientId: row.clientId,
    label: row.label,
    sizeLabel: row.sizeLabel,
    measurements: row.measurements,
    createdAt: row.createdAt,
  };
}

/**
 * Creates the in-memory measurement set repository.
 *
 * @param store - Shared fake database.
 * @param options - Time and id sources.
 * @returns A MeasurementSetRepository.
 */
export function createMemoryMeasurementSetRepository(
  store: MemoryStore,
  options: MemoryOptions = {},
): MeasurementSetRepository {
  const now = options.now ?? (() => new Date());
  const newId = options.newId ?? (() => crypto.randomUUID());
  /**
   * Rows owned by the user (what RLS would show).
   *
   * @param userId - The caller.
   * @returns Their rows.
   */
  const own = (userId: string) => store.sets.filter((row) => row.ownerId === userId);
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
      const clientId = input.clientId ?? null;
      const clientIsOwned = store.clients.some((c) => c.id === clientId && c.ownerId === ctx.userId);
      if (clientId !== null && !clientIsOwned) return Promise.reject(new NotFoundError("client"));
      const row: SetRow = {
        id: newId(),
        ownerId: ctx.userId,
        clientId,
        label: input.label,
        sizeLabel: input.sizeLabel ?? null,
        measurements: input.measurements,
        createdAt: now().toISOString(),
      };
      store.sets.push(row);
      return Promise.resolve(toSet(row));
    },
    list(ctx, { clientId, limit, offset }) {
      const matching = own(ctx.userId).filter((row) => clientId === undefined || row.clientId === clientId);
      const items = newestFirst(matching)
        .slice(offset, offset + limit)
        .map(toSet);
      return Promise.resolve({ items, total: matching.length, limit, offset });
    },
    get(ctx, id) {
      const row = find(ctx.userId, id);
      return Promise.resolve(row ? toSet(row) : undefined);
    },
    update(ctx, id, input) {
      const row = find(ctx.userId, id);
      if (!row) return Promise.resolve(undefined);
      const next: SetRow = {
        ...row,
        label: input.label,
        sizeLabel: input.sizeLabel ?? null,
        measurements: input.measurements,
      };
      store.sets = store.sets.map((existing) => (existing === row ? next : existing));
      return Promise.resolve(toSet(next));
    },
    remove(ctx, id) {
      const row = find(ctx.userId, id);
      if (!row) return Promise.resolve(false);
      store.sets = store.sets.filter((existing) => existing !== row);
      return Promise.resolve(true);
    },
  };
}
