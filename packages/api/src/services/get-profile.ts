/** Use case: the signed-in user's settings data (name, language, email). */
import type { Profile } from "@tafsila/schemas";
import { NotFoundError } from "../domain/errors";
import type { ProfileRepository } from "../ports/profile-repository";
import type { AuthContext } from "../ports/token-verifier";

/**
 * Reads the email from the verified token claims.
 *
 * @param ctx - Verified caller.
 * @returns The email, or null when the token carries none.
 */
export function emailOf(ctx: AuthContext): string | null {
  const { email } = ctx.claims;
  return typeof email === "string" && email !== "" ? email : null;
}

/**
 * Reads the caller's profile.
 *
 * @param deps - Profile repository.
 * @param ctx - Verified caller.
 * @returns Name and language from the profile, email from the token.
 * @throws {NotFoundError} When the profile does not exist (the account was deleted and the token is still valid).
 */
export async function getProfile(
  deps: { readonly profiles: ProfileRepository },
  ctx: AuthContext,
): Promise<Profile> {
  const stored = await deps.profiles.get(ctx);
  if (!stored) throw new NotFoundError("profile");
  return { ...stored, email: emailOf(ctx) };
}
