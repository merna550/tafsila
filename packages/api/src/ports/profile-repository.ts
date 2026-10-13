/** Profile repository port: reads and changes the signed-in user's own profile row (RLS in the database). */
import type { Profile, UpdateProfileInput } from "@tafsila/schemas";
import type { AuthContext } from "./token-verifier";

/** The stored part of the profile; the email comes from the verified token. */
export type StoredProfile = Pick<Profile, "name" | "locale">;

/** Stores the caller's profile. */
export interface ProfileRepository {
  /**
   * Reads the caller's profile.
   *
   * @param ctx - Verified caller.
   * @returns The name and language, or undefined when the profile does not exist (deleted account).
   */
  get(ctx: AuthContext): Promise<StoredProfile | undefined>;
  /**
   * Changes name and/or language of the caller's profile.
   *
   * @param ctx - Verified caller.
   * @param patch - Fields to change.
   * @returns The updated profile, or undefined when the profile does not exist.
   */
  update(ctx: AuthContext, patch: UpdateProfileInput): Promise<StoredProfile | undefined>;
}
