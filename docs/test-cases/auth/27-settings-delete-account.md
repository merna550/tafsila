# Test cases: Profile and delete account (Part A, API)

| Field        | Value                                                          |
| ------------ | -------------------------------------------------------------- |
| Issue        | #27 (part A API and database; part B screen adds the UI cases) |
| SRS          | FR-AUTH-04, FR-AUTH-05, NFR-05                                 |
| Area         | api, db                                                        |
| Last updated | 2026-10-13 (by the PR for #27 part A)                          |

## Test data

A signed-in throwaway user with a bearer token (never a seed user for deletion cases). Test number `+201000000006` for the trial case.

## Cases

Status legend: ⬜ not run · ✅ pass · ❌ fail (link issue)

| ID            | Title                                   | Priority | Preconditions                                  | Steps                                                                       | Expected result                                                                  | Automated by                                                   | dev | staging |
| ------------- | --------------------------------------- | -------- | ---------------------------------------------- | --------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | -------------------------------------------------------------- | --- | ------- |
| TC-AUTH-27-01 | Read the profile                        | High     | Signed in                                      | `GET /api/profile`                                                          | 200 `{ name, locale, email }`, email from the token                              | `routes/profile-account.test.ts`, Postman journey 14           | ⬜  | ⬜      |
| TC-AUTH-27-02 | Change name and language                | High     | Signed in                                      | `PATCH /api/profile` `{ "name": "منى", "locale": "en" }`, then `GET`        | 200; the read shows both                                                         | `routes/profile-account.test.ts`, Postman journey 15           | ⬜  | ⬜      |
| TC-AUTH-27-03 | Invalid patch                           | High     | Signed in                                      | `PATCH` with `{}`, `{ "name": "" }`, `{ "locale": "fr" }`, a `userId` field | 400 `VALIDATION_FAILED`                                                          | `schemas/profile.test.ts`, Postman ERR                         | ⬜  | ⬜      |
| TC-AUTH-27-04 | Another user's profile is never touched | High     | Two users                                      | A patches own name; B reads own profile                                     | B's name unchanged                                                               | `routes/profile-account.test.ts`, `rls.test.sql`               | ⬜  | ⬜      |
| TC-AUTH-27-05 | No token                                | High     | -                                              | Call the three routes without a token                                       | 401 `UNAUTHENTICATED`                                                            | `routes/profile-account.test.ts`, Postman ERR                  | ⬜  | ⬜      |
| TC-AUTH-27-06 | Delete without the confirmation         | High     | Signed in                                      | `DELETE /api/account` with `{}` or a wrong `confirm`                        | 400 `VALIDATION_FAILED`; nothing removed                                         | `routes/profile-account.test.ts`, Postman ERR                  | ⬜  | ⬜      |
| TC-AUTH-27-07 | Delete a throwaway account              | High     | Throwaway user with a client and a set         | `DELETE /api/account` `{ "confirm": "DELETE_MY_ACCOUNT" }`                  | 204; service role finds no auth user, profile, client, set, OTP events, or files | `services/delete-account.test.ts`, `account-deletion.test.sql` | ⬜  | ⬜      |
| TC-AUTH-27-08 | Repeat after a failure                  | High     | A step failed before the auth user was deleted | Send the request again                                                      | 204; account removed                                                             | `services/delete-account.test.ts`                              | ⬜  | ⬜      |
| TC-AUTH-27-09 | Admin cannot delete from the app        | High     | Admin token                                    | `DELETE /api/account` with the literal                                      | 403 `ACCOUNT_DELETE_FORBIDDEN`, Arabic message; nothing removed                  | `routes/profile-account.test.ts`                               | ⬜  | ⬜      |
| TC-AUTH-27-10 | Same phone cannot get a new trial       | High     | User A verified `+201000000006`, then deleted  | User B verifies the same number                                             | 409 `PHONE_ALREADY_USED`; `trial_phones` keeps the hash with `user_id` null      | `account-deletion.test.sql`, `phone.test.sql`                  | ⬜  | ⬜      |
| TC-AUTH-27-11 | Audit row has no identity               | High     | After TC-AUTH-27-07                            | `select * from admin_audit where action = 'account.deleted'`                | One new row, `who`, `target`, `before`, `after` all null                         | `account-deletion.test.sql`                                    | ⬜  | ⬜      |
| TC-AUTH-27-12 | Token of a deleted user                 | Medium   | After TC-AUTH-27-07                            | `GET /api/profile` with the old token                                       | 404 (no profile)                                                                 | `routes/profile-account.test.ts`                               | ⬜  | ⬜      |
| TC-AUTH-27-13 | Postman manual delete on staging        | Medium   | Throwaway account on staging                   | Send the request by hand (see the tutorial)                                 | 204                                                                              | manual only                                                    | ⬜  | ⬜      |
| TC-AUTH-27-14 | Missing PostHog key                     | Low      | No `POSTHOG_PERSONAL_API_KEY`                  | Delete a throwaway account                                                  | 204; one warning in the API log                                                  | `posthog-identity-eraser.test.ts`                              | ⬜  | ⬜      |

## Manual run log

| Date | Env | Tester | Result | Notes |
| ---- | --- | ------ | ------ | ----- |
