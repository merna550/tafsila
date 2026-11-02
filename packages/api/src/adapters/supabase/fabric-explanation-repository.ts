/** Drizzle fabric explanation repository: runs as the user through withUser (RLS: owner only); a save is one insert that ignores a duplicate. */
import { and, eq } from "drizzle-orm";
import type { FabricExplanationRepository } from "../../ports/fabric-explanation-repository";
import { fabricExplanations, patternVersions } from "./schema";
import type { WithUser } from "./with-user";

/**
 * Creates the Drizzle fabric explanation repository.
 *
 * @param withUser - Transaction runner that applies the user's RLS.
 * @returns A FabricExplanationRepository.
 */
export function createFabricExplanationRepository(withUser: WithUser): FabricExplanationRepository {
  return {
    find: (ctx, versionId, locale, catalogueHash) =>
      withUser(ctx, async (tx) => {
        const [row] = await tx
          .select({ text: fabricExplanations.text, locale: fabricExplanations.locale })
          .from(fabricExplanations)
          .where(
            and(
              eq(fabricExplanations.patternVersionId, versionId),
              eq(fabricExplanations.ownerId, ctx.userId),
              eq(fabricExplanations.locale, locale),
              eq(fabricExplanations.catalogueHash, catalogueHash),
            ),
          )
          .limit(1);
        return row;
      }),
    save: (ctx, input) =>
      withUser(ctx, async (tx) => {
        // The owner filter is explicit: an admin may read other users' versions but must not write for them.
        const [version] = await tx
          .select({ id: patternVersions.id })
          .from(patternVersions)
          .where(and(eq(patternVersions.id, input.versionId), eq(patternVersions.ownerId, ctx.userId)));
        if (!version) return false;
        await tx
          .insert(fabricExplanations)
          .values({
            patternVersionId: input.versionId,
            ownerId: ctx.userId,
            locale: input.locale,
            catalogueHash: input.catalogueHash,
            text: input.text,
          })
          .onConflictDoNothing();
        return true;
      }),
  };
}
