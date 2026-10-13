# Delete an account (FR-AUTH-04, NFR-05)

`DELETE /api/account` with `{ "confirm": "DELETE_MY_ACCOUNT" }` and the user's bearer token deletes that user's account and personal data. It cannot be undone. Decision: [27](../../decisions/27a-settings-delete-account.md).

## What happens, in order

| Step | What                             | Where                                                                                                                    | Failure                                  |
| ---- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------- |
| 1    | Refuse admins (403)              | `services/delete-account.ts`                                                                                             | nothing removed                          |
| 2    | Remove files under `<userId>/`   | Supabase Storage, every bucket in `domain/storage-buckets.ts`                                                            | 500, account intact, repeat is safe      |
| 3    | Erase the person at PostHog      | `adapters/posthog/posthog-identity-eraser.ts` (no-op without a key)                                                      | 500, account intact, repeat is safe      |
| 4    | Delete the auth user             | GoTrue admin API; the database cascades `profiles`, `clients`, `measurement_sets`, `phone_otp_events`, own `size_charts` | 500, repeat is safe (404 counts as done) |
| 5    | Record `account.deleted` (no id) | `private.record_account_deleted()` through `adapters/supabase/account-audit.ts`                                          | reported to Sentry, request still `204`  |

`trial_phones.user_id` becomes null (the hash stays, so the number never gets a second trial). `admin_audit.who` of earlier rows becomes null.

## Try it locally

1. `pnpm dev:all`, sign up a throwaway user (never a seed user), copy its access token.
2. `curl -X DELETE http://localhost:3000/api/account -H "authorization: Bearer $TOKEN" -H "content-type: application/json" -d '{"confirm":"DELETE_MY_ACCOUNT"}'` returns `204`.
3. Check with the service role (Studio SQL editor): `select count(*) from auth.users where id = '<id>'`, same for `public.profiles`, `public.clients`, `storage.objects where name like '<id>/%'` are all 0; `select * from public.admin_audit where action = 'account.deleted'` has a row with `who` null.

Postman: the generated run never calls it; on staging use a throwaway account and send the request by hand.

## PostHog erasure key (optional now, needed before the beta)

1. PostHog, Personal API keys, create a key with the `person:write` scope (free tier).
2. Set `POSTHOG_PERSONAL_API_KEY` and `POSTHOG_PROJECT_ID` (the number in the project URL), both or neither: GitHub secret for staging, Vercel variable.
3. Without them deletion works and logs one warning.

## Deleting an admin account

The app refuses (`ACCOUNT_DELETE_FORBIDDEN`). Demote first in the SQL editor with the service role: `update public.profiles set role = 'user' where id = '<id>';`, ask the person to sign in again so the token carries the new role, then delete.

## Backups

Deleted rows can stay in Supabase backups until they expire. The privacy policy (M8) must say so.
