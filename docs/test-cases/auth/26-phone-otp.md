# Test cases: Phone verification by OTP (API, part A)

| Field        | Value                                      |
| ------------ | ------------------------------------------ |
| Issue        | #26 (part A; part B adds the screen cases) |
| SRS          | FR-AUTH-02, FR-AUTH-03                     |
| Area         | api                                        |
| Last updated | 2026-10-12 (by PR #113)                    |

## Test data

Signed-in user with a bearer token (Postman environment). Test numbers `+201000000005` to `+201000000009` (code `123456`); `...01`, `...02`, `...04` are already used by the seed. Locally and on staging only these nine numbers work.

## Cases

Status legend: ⬜ not run · ✅ pass · ❌ fail (link issue)

| ID            | Title                              | Priority | Preconditions            | Steps                                                                          | Expected result                                                     | Automated by                                          | dev | staging |
| ------------- | ---------------------------------- | -------- | ------------------------ | ------------------------------------------------------------------------------ | ------------------------------------------------------------------- | ----------------------------------------------------- | --- | ------- |
| TC-AUTH-26-01 | Send and verify with a test number | High     | Unverified account       | `POST /api/phone/code` `010 0000 0005`, then `/verify` `123456`                | 202 then 200 `trialEligible: true`; `GET /api/phone` shows verified | `routes/phone.test.ts`, `services/phone.test.ts`      | ⬜  | ⬜      |
| TC-AUTH-26-02 | Accepted formats                   | High     | -                        | Send with `010...`, `+2010...`, `002010...`, Arabic digits                     | Same normalised number `+201000000005`                              | `packages/utils/src/phone.test.ts`                    | ⬜  | ⬜      |
| TC-AUTH-26-03 | Landline, `013`, short number      | High     | -                        | Send `0221234567`, `01312345678`, `0101234567`                                 | 400 `PHONE_INVALID`, Arabic message                                 | `phone.test.ts`, Postman ERR                          | ⬜  | ⬜      |
| TC-AUTH-26-04 | Non-test number outside production | High     | Staging or local         | Send `01012345678`                                                             | 400 `PHONE_TEST_ONLY`; no SMS                                       | `services/phone.test.ts`, Postman ERR                 | ⬜  | ⬜      |
| TC-AUTH-26-05 | Wrong code                         | High     | Code sent                | Verify with `000000`                                                           | 400 `PHONE_CODE_INVALID`                                            | `services/phone.test.ts`                              | ⬜  | ⬜      |
| TC-AUTH-26-06 | Resend cooldown                    | High     | Code sent                | Send again within 60 s, then after 60 s                                        | 429 `PHONE_RESEND_TOO_SOON` with `Retry-After`; then 202            | `domain/phone-limits.test.ts`, `routes/phone.test.ts` | ⬜  | ⬜      |
| TC-AUTH-26-07 | Too many sends or wrong codes      | High     | -                        | 6 sends in an hour; 6 wrong codes in 15 minutes                                | 429 `PHONE_TOO_MANY_ATTEMPTS` with `retryAfterSeconds`              | `services/phone.test.ts`, pgTAP                       | ⬜  | ⬜      |
| TC-AUTH-26-08 | Second account, same number        | High     | Number verified by A     | Account B sends/verifies the same number                                       | 409 `PHONE_ALREADY_USED`                                            | `services/phone.test.ts`, pgTAP                       | ⬜  | ⬜      |
| TC-AUTH-26-09 | Number of a deleted account        | High     | A verified, then deleted | Account B tries the number                                                     | Still 409 `PHONE_ALREADY_USED` (re-run after #27)                   | pgTAP, `services/phone.test.ts`                       | ⬜  | ⬜      |
| TC-AUTH-26-10 | Already verified account           | Medium   | Verified                 | Send or verify again                                                           | 409 `PHONE_ALREADY_VERIFIED`                                        | `services/phone.test.ts`                              | ⬜  | ⬜      |
| TC-AUTH-26-11 | No token                           | High     | -                        | Call the three endpoints without a token                                       | 401 `UNAUTHENTICATED`                                               | `routes/phone.test.ts`, Postman ERR                   | ⬜  | ⬜      |
| TC-AUTH-26-12 | Users cannot read the tables       | High     | Local DB                 | As `authenticated`, select `trial_phones`; update `profiles.phone_verified_at` | permission denied                                                   | `supabase/tests/database/phone.test.sql`              | ⬜  | ⬜      |

## Manual run log

| Date | Env | Tester | Result | Notes |
| ---- | --- | ------ | ------ | ----- |
