/**
 * AccountDeleter on the GoTrue admin API: `DELETE /auth/v1/admin/users/{id}` with the service role key.
 * The database cascades the user's rows through foreign keys. One of only two files that may hold the service role key.
 */
import type { AccountDeleter } from "../../ports/account-deleter";

/** What the adapter needs to reach Supabase Auth as an admin. */
export interface AccountDeleterConfig {
  readonly supabaseUrl: string;
  readonly serviceRoleKey: string;
  /** Replaceable in tests. */
  readonly fetchImpl?: typeof fetch;
}

/** HTTP status for "no such user": a repeated deletion, which counts as success. */
const HTTP_NOT_FOUND = 404;

/**
 * Creates the GoTrue-backed AccountDeleter.
 *
 * @param config - Project URL, service role key and optional fetch.
 * @returns An AccountDeleter.
 */
export function createGotrueAccountDeleter(config: AccountDeleterConfig): AccountDeleter {
  const doFetch = config.fetchImpl ?? fetch;
  const base = `${config.supabaseUrl.replace(/\/$/, "")}/auth/v1/admin/users`;
  return {
    async deleteUser(userId) {
      const response = await doFetch(`${base}/${encodeURIComponent(userId)}`, {
        method: "DELETE",
        headers: { apikey: config.serviceRoleKey, authorization: `Bearer ${config.serviceRoleKey}` },
      });
      if (response.ok || response.status === HTTP_NOT_FOUND) return;
      // The provider's body can name the user, so only the status goes into the message that is reported.
      throw new Error(`GoTrue admin delete failed with ${response.status}`);
    },
  };
}
