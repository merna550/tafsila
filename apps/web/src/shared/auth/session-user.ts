/** Reading the signed-in user from an auth client; no Next imports, so it is easy to unit test. */
import type { AuthClient } from "./clients";

/** The signed-in user as the app needs it. */
export interface SessionUser {
  /** User id (same as profiles.id). */
  readonly id: string;
  /** The sign-in email, if any. */
  readonly email: string | undefined;
}

/**
 * Asks Supabase who the cookie's session belongs to. A missing session, an error or a network failure all mean "nobody".
 *
 * @param client - An auth client.
 * @returns The user or null.
 */
export async function readSessionUser(client: AuthClient): Promise<SessionUser | null> {
  try {
    const { data, error } = await client.auth.getUser();
    if (error || !data.user) return null;
    return { id: data.user.id, email: data.user.email };
  } catch {
    return null;
  }
}
