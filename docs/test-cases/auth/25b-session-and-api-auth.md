# Test cases — Session, route guard and API auth

| Field        | Value                      |
| ------------ | -------------------------- |
| Issue        | #91 (part B of #25)        |
| SRS          | FR-AUTH-01, NFR-04         |
| Area         | ui / api / db              |
| Last updated | 2026-10-11 (by PR for #91) |

## Test data

Seeded accounts from `supabase/seed.sql` (see `docs/backend/seed-data.md`): `trial@`, `pro@`, `empty@`, `admin@` at `tafsila.test`, password `Test1234!`. Sign-in screens arrive with #25, so until then get a token with the Supabase Auth API (`POST /auth/v1/token?grant_type=password`).

## Cases

Status legend: ⬜ not run · ✅ pass · ❌ fail (link issue)

| ID            | Title                                     | Priority | Preconditions             | Steps                                                                | Expected result                                                                  | Automated by                                         | dev | staging |
| ------------- | ----------------------------------------- | -------- | ------------------------- | -------------------------------------------------------------------- | -------------------------------------------------------------------------------- | ---------------------------------------------------- | --- | ------- |
| TC-AUTH-91-01 | Signed-out visitor is sent to sign-in     | High     | Signed out                | Open `/dashboard` (and `/en/dashboard`)                              | Redirect to `/sign-in?next=%2Fdashboard` (`/en/sign-in?next=%2Fen%2Fdashboard`)  | `apps/web/e2e/guard.spec.ts`, `access-guard.test.ts` | ⬜  | ⬜      |
| TC-AUTH-91-02 | Unsafe `next` is ignored                  | High     | None                      | Check `sanitizeNext` with `//evil.com`, `https://evil.com`, `/\evil` | All rejected, `/dashboard` accepted                                              | `safe-next.test.ts`                                  | ⬜  | ⬜      |
| TC-AUTH-91-03 | Session survives a reload in ar and en    | High     | Local Supabase, signed in | Reload `/dashboard` and `/en/dashboard`                              | Still the dashboard, sign-out button visible                                     | manual until #25 e2e                                 | ⬜  | ⬜      |
| TC-AUTH-91-04 | Sign out ends the session                 | High     | Signed in                 | Press sign out, press the browser back button                        | Home page; `/dashboard` redirects to sign-in again                               | manual until #25 e2e                                 | ⬜  | ⬜      |
| TC-AUTH-91-05 | `GET /api/me` with a valid token          | High     | Token for `trial@`        | `GET /api/me` with `Authorization: Bearer <token>`                   | `200 { userId, role: "user" }`                                                   | `routes/me.test.ts`                                  | ⬜  | ⬜      |
| TC-AUTH-91-06 | `GET /api/me` without or with a bad token | High     | None                      | No header; garbage; expired; wrong key; another project's token      | `401` standard error body with `UNAUTHENTICATED`, ar and en messages, request id | `routes/me.test.ts`, `e2e/guard.spec.ts`             | ⬜  | ⬜      |
| TC-AUTH-91-07 | Role check                                | High     | Tokens for user and admin | Call an admin-only route as each                                     | user: `403 FORBIDDEN`; admin: 200                                                | `routes/me.test.ts` (`requireRole`)                  | ⬜  | ⬜      |
| TC-AUTH-91-08 | Token carries `user_role`                 | High     | Local Supabase            | Sign in as `admin@`, decode the access token                         | `user_role` is `admin`; for `trial@` it is `user`                                | `supabase/tests/database/access-token-hook.test.sql` | ⬜  | ⬜      |
| TC-AUTH-91-09 | Hook is active on staging                 | High     | Merged to main            | Sign in as a seeded staging user, `GET /api/me`                      | Response has the right `role`                                                    | manual smoke check                                   | ⬜  | ⬜      |
| TC-AUTH-91-10 | Hook is not callable by users             | High     | Local Supabase            | Call `rpc/custom_access_token_hook` as a signed-in user              | Permission denied                                                                | `access-token-hook.test.sql` (5-6)                   | ⬜  | ⬜      |
