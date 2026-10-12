/** Playwright global setup: on a local database, removes the accounts and phone hashes earlier e2e runs left behind. */

/** Number of users read per page of the admin API. */
const PAGE_SIZE = 1000;

/**
 * Deletes `e2e-*` users and then the `trial_phones` rows that no longer belong to anybody, so the test numbers can be
 * verified again. It runs only when `E2E_SERVICE_ROLE_KEY` is set (never in CI, which starts from an empty database).
 * Deleting a user sets `trial_phones.user_id` to null, which is how the leftover rows are found; the seed rows keep
 * their user and stay.
 */
export default async function globalSetup(): Promise<void> {
  const key = process.env.E2E_SERVICE_ROLE_KEY;
  const url = process.env.SUPABASE_URL;
  if (!key || !url) return;
  const headers = { apikey: key, authorization: `Bearer ${key}` };
  const list = await fetch(`${url}/auth/v1/admin/users?per_page=${PAGE_SIZE}`, { headers });
  if (!list.ok) throw new Error(`Cannot list users for the e2e cleanup (${list.status})`);
  const { users } = (await list.json()) as { users: Array<{ id: string; email?: string }> };
  for (const user of users.filter((candidate) => candidate.email?.startsWith("e2e-"))) {
    await fetch(`${url}/auth/v1/admin/users/${user.id}`, { method: "DELETE", headers });
  }
  const rows = await fetch(`${url}/rest/v1/trial_phones?user_id=is.null`, { method: "DELETE", headers });
  if (!rows.ok) throw new Error(`Cannot clear the leftover trial phones (${rows.status})`);
}
