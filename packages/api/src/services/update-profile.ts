/** Use case: change the signed-in user's name and/or language. */
import type { Profile, UpdateProfileInput } from "@tafsila/schemas";
import { NotFoundError } from "../domain/errors";
import type { Analytics } from "../ports/analytics";
import type { ProfileRepository } from "../ports/profile-repository";
import type { AuthContext } from "../ports/token-verifier";
import { emailOf } from "./get-profile";

/**
 * Updates the caller's profile and records a language change.
 *
 * @param deps - Profile repository and analytics.
 * @param ctx - Verified caller.
 * @param patch - Fields to change.
 * @returns The updated profile.
 * @throws {NotFoundError} When the profile does not exist.
 */
export async function updateProfile(
  deps: { readonly profiles: ProfileRepository; readonly analytics: Analytics },
  ctx: AuthContext,
  patch: UpdateProfileInput,
): Promise<Profile> {
  const stored = await deps.profiles.update(ctx, patch);
  if (!stored) throw new NotFoundError("profile");
  if (patch.locale !== undefined)
    deps.analytics.capture(ctx.userId, "locale_changed", { locale: patch.locale });
  return { ...stored, email: emailOf(ctx) };
}
