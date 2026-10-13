# Make a user an admin

There is no screen for this on purpose: only the project owner can grant the admin role, with SQL. A user can never change their own `role` (the column is not writable by the API role). Decision: [32a](../../decisions/32a-mini-admin-api.md).

## Steps

1. The person signs up and signs in once, so a `profiles` row exists.
2. Open the SQL editor of the right Supabase project (local Studio at <http://127.0.0.1:54323>, staging or production in the dashboard) as the project owner. The editor runs as `postgres`, which can write `role`.
3. Run, with the person's e-mail:

   ```sql
   update public.profiles
   set role = 'admin'
   where id = (select id from auth.users where email = 'someone@example.com');
   ```

   It should say `UPDATE 1`. To undo, set `role = 'user'`.

4. The role reaches the access token at its next refresh, up to **one hour** later (the access-token hook copies `profiles.role` into the `user_role` claim). To see it at once, the person signs out and in again.
5. Check: `GET /api/admin/stats` with their token answers `200` instead of `403`.

## Good to know

- The API checks the token's role first, then the database checks `profiles.role` again inside each admin function, so removing the role takes effect in the database immediately even if the token still says admin (the API then answers `403 FORBIDDEN`).
- An admin cannot delete their own account from the app (`ACCOUNT_DELETE_FORBIDDEN`); demote first with the SQL above.
- Local seed: `admin@tafsila.test` / `Test1234!` is already an admin (`docs/backend/seed-data.md`).
- Every chart edit is written to `admin_audit` (`who`, `before`, `after`); read it in the SQL editor: `select at, who, action from public.admin_audit order by at desc;`.
