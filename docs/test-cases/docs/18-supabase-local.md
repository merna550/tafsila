# Test cases — Local Supabase

| Field        | Value                      |
| ------------ | -------------------------- |
| Issue        | #18                        |
| SRS          | FR-AUTH-02, NFR-04         |
| Area         | infra                      |
| Last updated | 2026-10-07 (by PR for #18) |

## Test data

Docker running, dependencies installed. Test phones `+201000000001..3`, code `123456`.

## Cases

Status legend: ⬜ not run · ✅ pass · ❌ fail (link issue)

| ID             | Title                             | Priority | Preconditions  | Steps                                                                         | Expected result                              | Automated by                      | dev | staging |
| -------------- | --------------------------------- | -------- | -------------- | ----------------------------------------------------------------------------- | -------------------------------------------- | --------------------------------- | --- | ------- |
| TC-INFRA-18-01 | Start and reset on a clean stack  | High     | Docker running | `pnpm db:start && pnpm db:reset`                                              | Both succeed; bucket `design-photos` created | `.github/workflows/supabase.yml`  | ✅  | ⬜      |
| TC-INFRA-18-02 | Test OTP login                    | High     | Stack running  | POST `/auth/v1/otp` for `+201000000001`, then `/auth/v1/verify` with `123456` | Access token returned, no SMS sent           | manual only                       | ✅  | ⬜      |
| TC-INFRA-18-03 | Emails reach the mail catcher     | High     | Stack running  | Sign up by email, open http://127.0.0.1:54324                                 | Confirmation email is listed                 | manual only                       | ✅  | ⬜      |
| TC-INFRA-18-04 | App starts without AI/Paymob keys | High     | none           | `loadServerEnv` with only Supabase variables                                  | No error unless `APP_ENV=production`         | `packages/config/src/env.test.ts` | ✅  | ⬜      |
