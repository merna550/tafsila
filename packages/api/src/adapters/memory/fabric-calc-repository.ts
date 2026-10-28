/** In-memory fabric calculation repository for tests and `pnpm api:test`: one row per version and options hash, visible to the version's owner only. */
import type { FabricCalc } from "@tafsila/schemas";
import type { FabricCalcRepository } from "../../ports/fabric-calc-repository";
import type { FabricCalcRow, MemoryOptions, MemoryStore } from "./memory-store";

/**
 * The public part of a stored calculation (parsing would drop the owner and hash too, this keeps it cheap).
 *
 * @param row - Stored row.
 * @returns The calculation without the owner and the hash.
 */
function toCalc(row: FabricCalcRow): FabricCalc {
  return {
    versionId: row.versionId,
    options: row.options,
    result: row.result,
    nestingVersion: row.nestingVersion,
    updatedAt: row.updatedAt,
  };
}

/**
 * Creates the in-memory fabric calculation repository.
 *
 * @param store - Shared fake database (its `versions` decide who owns a version).
 * @param options - Time source for `updatedAt`.
 * @returns A FabricCalcRepository.
 */
export function createMemoryFabricCalcRepository(
  store: MemoryStore,
  options: MemoryOptions = {},
): FabricCalcRepository {
  const now = options.now ?? (() => new Date());
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
    save: (ctx, input) => {
      if (!owns(ctx.userId, input.versionId)) return Promise.resolve(undefined);
      const row: FabricCalcRow = {
        versionId: input.versionId,
        options: input.options,
        optionsHash: input.optionsHash,
        result: input.result,
        nestingVersion: input.nestingVersion,
        updatedAt: now().toISOString(),
        ownerId: ctx.userId,
      };
      const index = store.fabricCalcs.findIndex(
        (c) => c.versionId === input.versionId && c.optionsHash === input.optionsHash,
      );
      if (index >= 0) store.fabricCalcs[index] = row;
      else store.fabricCalcs.push(row);
      return Promise.resolve(toCalc(row));
    },
    latest: (ctx, versionId) => {
      if (!owns(ctx.userId, versionId)) return Promise.resolve(undefined);
      const rows = store.fabricCalcs.filter((c) => c.versionId === versionId);
      const newest = rows.reduce<FabricCalcRow | undefined>(
        (best, row) => (best && best.updatedAt > row.updatedAt ? best : row),
        undefined,
      );
      return Promise.resolve(newest && toCalc(newest));
    },
  };
}
