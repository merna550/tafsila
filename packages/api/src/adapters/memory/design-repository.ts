/** In-memory design repository for tests and `pnpm api:test`; filters by owner exactly as RLS does. */
import { patternVersionSchema } from "@tafsila/schemas";
import type { Design, DesignDetail, DesignSummary, PatternVersion } from "@tafsila/schemas";
import type { DesignRepository } from "../../ports/design-repository";
import type { DesignRow, MemoryOptions, MemoryStore, VersionRow } from "./memory-store";

/**
 * Strips the owner from a design row.
 *
 * @param row - Stored row.
 * @returns The public design.
 */
function toDesign(row: DesignRow): Design {
  return {
    id: row.id,
    category: row.category,
    title: row.title,
    currentVersionId: row.currentVersionId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

/**
 * A version as the API shows it: a deleted measurement set reads as null (ON DELETE SET NULL).
 *
 * @param store - Shared fake database.
 * @param row - Stored version.
 * @returns The public version.
 */
function toVersion(store: MemoryStore, row: VersionRow): PatternVersion {
  const setExists = store.sets.some((set) => set.id === row.measurementSetId);
  // Parsing drops the owner (unknown keys are stripped).
  return patternVersionSchema.parse({ ...row, measurementSetId: setExists ? row.measurementSetId : null });
}

/**
 * Computes the list summary like the database adapter's join: count, status and client of the current version.
 *
 * @param store - Shared fake database.
 * @param design - The design.
 * @returns Its summary.
 */
function summarize(store: MemoryStore, design: DesignRow): DesignSummary {
  const current = store.versions.find((v) => v.id === design.currentVersionId);
  const set = store.sets.find((s) => s.id === current?.measurementSetId);
  const client = store.clients.find((c) => c.id === set?.clientId);
  return {
    versionCount: store.versions.filter((v) => v.designId === design.id).length,
    currentStatus: current?.validationStatus ?? null,
    clientName: client?.name ?? null,
  };
}

/**
 * Whether the design has a version made from a set of the given client.
 *
 * @param store - Shared fake database.
 * @param design - The design.
 * @param clientId - The client.
 * @returns True when one version's set belongs to the client.
 */
function hasVersionFor(store: MemoryStore, design: DesignRow, clientId: string): boolean {
  return store.versions.some(
    (v) =>
      v.designId === design.id &&
      store.sets.some((s) => s.id === v.measurementSetId && s.clientId === clientId),
  );
}

/**
 * Orders designs like `order by updated_at desc, id desc`.
 *
 * @param a - First design.
 * @param b - Second design.
 * @returns Sort order.
 */
function byUpdatedDesc(a: DesignRow, b: DesignRow): number {
  return a.updatedAt === b.updatedAt ? b.id.localeCompare(a.id) : b.updatedAt.localeCompare(a.updatedAt);
}

/**
 * Creates the in-memory design repository.
 *
 * @param store - Shared fake database.
 * @param options - Time and id sources.
 * @returns A DesignRepository.
 */
export function createMemoryDesignRepository(
  store: MemoryStore,
  options: MemoryOptions = {},
): DesignRepository {
  const now = options.now ?? (() => new Date());
  const newId = options.newId ?? (() => crypto.randomUUID());
  /**
   * Designs owned by the user (what RLS would show).
   *
   * @param userId - The caller.
   * @returns Their rows.
   */
  const own = (userId: string) => store.designs.filter((row) => row.ownerId === userId);
  /**
   * One owned design by id.
   *
   * @param userId - The caller.
   * @param id - Row id.
   * @returns The row, or undefined.
   */
  const find = (userId: string, id: string) => own(userId).find((row) => row.id === id);
  return {
    create(ctx, input) {
      const at = now().toISOString();
      const row: DesignRow = {
        id: newId(),
        ownerId: ctx.userId,
        category: input.category,
        title: input.title,
        currentVersionId: null,
        createdAt: at,
        updatedAt: at,
      };
      store.designs.push(row);
      return Promise.resolve(toDesign(row));
    },
    list(ctx, { q, clientId, limit, offset }) {
      const needle = q?.toLowerCase();
      const matching = own(ctx.userId)
        .filter((row) => !needle || row.title.toLowerCase().includes(needle))
        .filter((row) => !clientId || hasVersionFor(store, row, clientId))
        .sort(byUpdatedDesc);
      const items = matching
        .slice(offset, offset + limit)
        .map((row) => ({ ...toDesign(row), summary: summarize(store, row) }));
      return Promise.resolve({ items, total: matching.length, limit, offset });
    },
    get(ctx, id) {
      const row = find(ctx.userId, id);
      if (!row) return Promise.resolve(undefined);
      const current = store.versions.find((v) => v.id === row.currentVersionId);
      const detail: DesignDetail = {
        design: toDesign(row),
        currentVersion: current ? toVersion(store, current) : null,
      };
      return Promise.resolve(detail);
    },
    rename(ctx, id, title) {
      const row = find(ctx.userId, id);
      if (!row) return Promise.resolve(undefined);
      const next: DesignRow = { ...row, title, updatedAt: now().toISOString() };
      store.designs = store.designs.map((existing) => (existing === row ? next : existing));
      return Promise.resolve(toDesign(next));
    },
    remove(ctx, id) {
      const row = find(ctx.userId, id);
      if (!row) return Promise.resolve(false);
      store.designs = store.designs.filter((existing) => existing !== row);
      store.versions = store.versions.filter((v) => v.designId !== id);
      return Promise.resolve(true);
    },
  };
}
