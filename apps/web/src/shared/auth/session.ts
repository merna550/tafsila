/** Server-side session reading: who is signed in, verified with Supabase (not just decoded from the cookie). */
import { cookies } from "next/headers";
import { loadPublicConfig } from "@tafsila/config";
import { createServerAuthClient } from "./clients";
import { readSessionUser, type SessionUser } from "./session-user";

/**
 * Returns the signed-in user inside Server Components and layouts.
 *
 * @returns The user, or null when signed out or when Supabase is not configured.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const { supabaseUrl, supabaseAnonKey } = loadPublicConfig();
  if (!supabaseUrl || !supabaseAnonKey) return null;
  const store = await cookies();
  const client = createServerAuthClient(
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
  return readSessionUser(client);
}
