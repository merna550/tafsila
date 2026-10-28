/** Drizzle fabric calculation repository: runs as the user through withUser (RLS: owner only); a save is one upsert on (version, options hash). */
import type { FabricCalc } from "@tafsila/schemas";
import { and, desc, eq } from "drizzle-orm";
import type { FabricCalcRepository } from "../../ports/fabric-calc-repository";
import { fabricCalcs, patternVersions } from "./schema";
import type { WithUser } from "./with-user";

/**
 * Maps a row to the calculation the port returns.
 *
 * @param row - Database row.
 * @returns The calculation with an ISO date.
 */
function toCalc(row: typeof fabricCalcs.$inferSelect): FabricCalc {
  return {
    versionId: row.patternVersionId,
    options: row.options,
    result: row.result,
    nestingVersion: row.nestingVersion,
    updatedAt: row.updatedAt.toISOString(),
  };
}

/**
 * Creates the Drizzle fabric calculation repository.
 *
 * @param withUser - Transaction runner that applies the user's RLS.
 * @returns A FabricCalcRepository.
 */
export function createFabricCalcRepository(withUser: WithUser): FabricCalcRepository {
  return {
    save: (ctx, input) =>
      withUser(ctx, async (tx) => {
        // The owner filter is explicit: an admin may read other users' versions but must not write calculations for them.
        const [version] = await tx
          .select({ id: patternVersions.id })
          .from(patternVersions)
          .where(and(eq(patternVersions.id, input.versionId), eq(patternVersions.ownerId, ctx.userId)));
        if (!version) return undefined;
        const [row] = await tx
          .insert(fabricCalcs)
          .values({
            patternVersionId: input.versionId,
            ownerId: ctx.userId,
            options: input.options,
            optionsHash: input.optionsHash,
            result: input.result,
            nestingVersion: input.nestingVersion,
          })
          .onConflictDoUpdate({
            target: [fabricCalcs.patternVersionId, fabricCalcs.optionsHash],
            set: {
              options: input.options,
              result: input.result,
              nestingVersion: input.nestingVersion,
              updatedAt: new Date(),
            },
          })
          .returning();
        if (!row) throw new Error("upsert returned no row");
        return toCalc(row);
      }),
    latest: (ctx, versionId) =>
      withUser(ctx, async (tx) => {
        const [row] = await tx
          .select()
          .from(fabricCalcs)
          .where(and(eq(fabricCalcs.patternVersionId, versionId), eq(fabricCalcs.ownerId, ctx.userId)))
          .orderBy(desc(fabricCalcs.updatedAt))
          .limit(1);
        return row && toCalc(row);
      }),
  };
}
