/** Server-side session reading: who is signed in, verified with Supabase (not just decoded from the cookie). */
import { cookies } from "next/headers";
import { loadPublicConfig } from "@tafsila/config";
import { createServerAuthClient, type AuthClient } from "./clients";
import { readSessionRole, type SessionRole } from "./session-role";
import { readSessionUser, type SessionUser } from "./session-user";

/**
 * Builds the server auth client over the request cookies.
 *
 * @returns The client, or null when Supabase is not configured.
 */
async function createRequestClient(): Promise<AuthClient | null> {
  const { supabaseUrl, supabaseAnonKey } = loadPublicConfig();
  if (!supabaseUrl || !supabaseAnonKey) return null;
  const store = await cookies();
  return createServerAuthClient(
    { supabaseUrl, supabaseAnonKey },
    {
      getAll: () => store.getAll(),
      // Server Components cannot set cookies; the proxy already refreshed the session, so a failure here is harmless.
      setAll: (all) => {
        try {
          for (const { name, value, options } of all) store.set(name, value, options);
        } catch {
          /* called from a Server Component: ignore */
        }
      },
    },
  );
}

/**
 * Returns the signed-in user inside Server Components and layouts.
 *
 * @returns The user, or null when signed out or when Supabase is not configured.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const client = await createRequestClient();
  return client ? readSessionUser(client) : null;
}

/**
 * Returns the role in the session token (no network call; up to an hour old). The API and the database check it again.
 *
 * @returns "admin" or "user"; "user" when signed out or when Supabase is not configured.
 */
export async function getSessionRole(): Promise<SessionRole> {
  const client = await createRequestClient();
  return client ? readSessionRole(client) : "user";
}
