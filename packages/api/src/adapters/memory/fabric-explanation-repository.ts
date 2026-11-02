/** In-memory fabric explanation repository for tests and `pnpm api:test`: one row per version, language and hash, visible to the version's owner only. */
import type { FabricExplanationRepository } from "../../ports/fabric-explanation-repository";
import type { MemoryStore } from "./memory-store";

/**
 * Creates the in-memory fabric explanation repository.
 *
 * @param store - Shared fake database (its `versions` decide who owns a version).
 * @returns A FabricExplanationRepository.
 */
export function createMemoryFabricExplanationRepository(store: MemoryStore): FabricExplanationRepository {
  /**
   * Tells whether the user owns the version.
   *
   * @param userId - Caller.
   * @param versionId - Version id.
   * @returns True when the version is the caller's.
   */
  const owns = (userId: string, versionId: string): boolean =>
    store.versions.some((v) => v.id === versionId && v.ownerId === userId);
  return {
    find: (ctx, versionId, locale, catalogueHash) => {
      const row = store.fabricExplanations.find(
        (e) =>
          e.ownerId === ctx.userId &&
          e.versionId === versionId &&
          e.locale === locale &&
          e.catalogueHash === catalogueHash,
      );
      return Promise.resolve(row && { text: row.text, locale: row.locale });
    },
    save: (ctx, input) => {
      if (!owns(ctx.userId, input.versionId)) return Promise.resolve(false);
      const exists = store.fabricExplanations.some(
        (e) =>
          e.versionId === input.versionId &&
          e.locale === input.locale &&
          e.catalogueHash === input.catalogueHash,
      );
      if (!exists) store.fabricExplanations.push({ ...input, ownerId: ctx.userId });
      return Promise.resolve(true);
    },
  };
}
