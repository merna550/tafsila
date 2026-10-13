/** Drizzle profile repository: runs as the user through withUser, so RLS limits it to the caller's own row (column grants allow name and locale only). */
import { eq } from "drizzle-orm";
import type { ProfileRepository, StoredProfile } from "../../ports/profile-repository";
import { profiles } from "./schema";
import type { WithUser } from "./with-user";

/**
 * Creates the repository.
 *
 * @param withUser - Door to the database as the signed-in user.
 * @returns A ProfileRepository.
 */
export function createProfileRepository(withUser: WithUser): ProfileRepository {
  const columns = { name: profiles.name, locale: profiles.locale };
  return {
    get: (ctx) =>
      withUser(ctx, async (tx): Promise<StoredProfile | undefined> => {
        const [row] = await tx.select(columns).from(profiles).where(eq(profiles.id, ctx.userId)).limit(1);
        return row;
      }),
    update: (ctx, patch) =>
      withUser(ctx, async (tx): Promise<StoredProfile | undefined> => {
        const [row] = await tx
          .update(profiles)
          .set({
            ...(patch.name === undefined ? {} : { name: patch.name }),
            ...(patch.locale === undefined ? {} : { locale: patch.locale }),
          })
          .where(eq(profiles.id, ctx.userId))
          .returning(columns);
        return row;
      }),
  };
}
