/** In-memory profile repository for tests and `pnpm api:test`. A profile is created on first use, like the sign-up trigger does. */
import type { ProfileRepository, StoredProfile } from "../../ports/profile-repository";
import type { MemoryStore } from "./memory-store";

/**
 * Creates the repository on the shared fake database.
 *
 * @param store - Shared fake database; deleting a user removes the profile from it.
 * @returns A ProfileRepository.
 */
export function createMemoryProfileRepository(store: MemoryStore): ProfileRepository {
  /**
   * Finds the caller's profile, creating the default one when the account has never been seen.
   *
   * @param userId - The caller.
   * @returns The stored profile.
   */
  const ensure = (userId: string): StoredProfile => {
    const existing = store.profiles.get(userId);
    if (existing) return existing;
    const created: StoredProfile = { name: null, locale: "ar" };
    store.profiles.set(userId, created);
    return created;
  };
  return {
    get: (ctx) => Promise.resolve(store.deletedUsers.has(ctx.userId) ? undefined : { ...ensure(ctx.userId) }),
    update: (ctx, patch) => {
      if (store.deletedUsers.has(ctx.userId)) return Promise.resolve(undefined);
      const next: StoredProfile = {
        name: patch.name ?? ensure(ctx.userId).name,
        locale: patch.locale ?? ensure(ctx.userId).locale,
      };
      store.profiles.set(ctx.userId, next);
      return Promise.resolve({ ...next });
    },
  };
}
