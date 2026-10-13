/** E2E helper: reads a profile's saved language with the service role. Works only on a local database (see global-setup). */

/**
 * Reads `profiles.locale` of the account with the given email.
 *
 * @param email - The account's address.
 * @returns The saved language, or null when no service role key is configured (CI) or the account has no profile.
 */
export async function readProfileLocale(email: string): Promise<string | null> {
  const key = process.env.E2E_SERVICE_ROLE_KEY;
  const url = process.env.SUPABASE_URL;
  if (!key || !url) return null;
  const headers = { apikey: key, authorization: `Bearer ${key}` };
  const list = await fetch(`${url}/auth/v1/admin/users?per_page=1000`, { headers });
  const { users } = (await list.json()) as { users: Array<{ id: string; email?: string }> };
  const id = users.find((user) => user.email === email)?.id;
  if (!id) return null;
  const rows = await fetch(`${url}/rest/v1/profiles?id=eq.${id}&select=locale`, { headers });
  const [row] = (await rows.json()) as Array<{ locale: string }>;
  return row?.locale ?? null;
}
