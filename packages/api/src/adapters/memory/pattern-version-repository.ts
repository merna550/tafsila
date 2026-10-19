/** In-memory pattern version repository for tests and `pnpm api:test`; filters by owner exactly as RLS does. */
import { toVersionListItem } from "../../domain/version-list-item";
import type { PatternVersionRepository } from "../../ports/pattern-version-repository";
import { toVersion, type MemoryOptions, type MemoryStore, type VersionRow } from "./memory-store";

/**
 * Creates the in-memory pattern version repository.
 *
 * @param store - Shared fake database.
 * @param options - Time and id sources.
 * @returns A PatternVersionRepository.
 */
export function createMemoryPatternVersionRepository(
  store: MemoryStore,
  options: MemoryOptions = {},
): PatternVersionRepository {
  const now = options.now ?? (() => new Date());
  const newId = options.newId ?? (() => crypto.randomUUID());
  return {
    appendVersion(ctx, input) {
      const design = store.designs.find((d) => d.id === input.designId && d.ownerId === ctx.userId);
      if (!design) return Promise.resolve(undefined);
      const current = store.versions.find((v) => v.id === design.currentVersionId);
      if (current && current.inputHash === input.inputHash) {
        return Promise.resolve({ version: toVersion(store, current), reused: true });
      }
      const at = now().toISOString();
      const versionNo =
        Math.max(0, ...store.versions.filter((v) => v.designId === design.id).map((v) => v.versionNo)) + 1;
      const row: VersionRow = {
        ...input,
        id: newId(),
        ownerId: ctx.userId,
        versionNo,
        createdBy: "user",
        createdAt: at,
      };
      store.versions.push(row);
      store.designs = store.designs.map((d) =>
        d === design ? { ...d, currentVersionId: row.id, updatedAt: at } : d,
      );
      return Promise.resolve({ version: toVersion(store, row), reused: false });
    },
    list(ctx, designId, { limit, offset }) {
      const design = store.designs.find((d) => d.id === designId && d.ownerId === ctx.userId);
      if (!design) return Promise.resolve(undefined);
      const all = store.versions
        .filter((v) => v.designId === designId)
        .sort((a, b) => b.versionNo - a.versionNo);
      const items = all
        .slice(offset, offset + limit)
        .map((row) => toVersionListItem(toVersion(store, row), row.id === design.currentVersionId));
      return Promise.resolve({ items, total: all.length, limit, offset });
    },
    get(ctx, id) {
      const row = store.versions.find((v) => v.id === id && v.ownerId === ctx.userId);
      return Promise.resolve(row ? toVersion(store, row) : undefined);
    },
  };
}
