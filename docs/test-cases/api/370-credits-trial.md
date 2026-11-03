# Test cases — Credits balance and the free trial

| Field        | Value                       |
| ------------ | --------------------------- |
| Issue        | #370                        |
| SRS          | FR-BILL-02, FR-BILL-03      |
| Area         | api                         |
| Last updated | 2026-11-03 (by PR for #370) |

## Test data

| Name       | Value                                                                                               |
| ---------- | --------------------------------------------------------------------------------------------------- |
| Trial user | `trial@tafsila.test` / `Test1234!` (balance 7: trial 3 + pack 5, one design used)                   |
| Pro user   | `pro@tafsila.test` / `Test1234!` (Pro plan ending in 5 days)                                        |
| Empty user | `empty@tafsila.test` / `Test1234!` (phone not verified); test number `+201000000003`, code `123456` |

## Cases

Status legend: ⬜ not run · ✅ pass · ❌ fail (link issue)

| ID            | Title                           | Priority | Preconditions                                                     | Steps                                                                                 | Expected result                                                                                       | Automated by                                         | dev | staging |
| ------------- | ------------------------------- | -------- | ----------------------------------------------------------------- | ------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | ---------------------------------------------------- | --- | ------- |
| TC-API-370-01 | Verify, then read credits       | High     | Empty user, signed in                                             | 1. Send a code to `+201000000003`. 2. Verify with `123456`. 3. `GET /api/me/credits`. | Verify answers `trialGranted: true`; credits show `balance: 3`, one grant, `plan: null`, limits 10/10 | `routes/billing.test.ts`, `services/billing.test.ts` | ⬜  | ⬜      |
| TC-API-370-02 | Lazy grant for a pre-M7 user    | High     | A verified user whose `trial_granted_at` is null and no trial lot | 1. `GET /api/me/credits` twice.                                                       | First read grants 3 credits, the second grants nothing (one `trial` ledger row)                       | `services/billing.test.ts`, `credits_trial.test.sql` | ⬜  | ⬜      |
| TC-API-370-03 | Plan renews soon                | Medium   | Pro user                                                          | 1. `GET /api/me/credits`.                                                             | `plan.code: pro`, `renewSoon: true`, `limits.maxClients: null`, `chatPerDesign: 20`                   | `services/billing.test.ts`                           | ⬜  | ⬜      |
| TC-API-370-04 | Products list                   | Medium   | Any signed-in user                                                | 1. `GET /api/billing/products`.                                                       | Four items cheapest first (single, hobby, pack5, pro), prices in piastres; no token gives 401         | `routes/billing.test.ts`                             | ⬜  | ⬜      |
| TC-API-370-05 | Same number on a second account | High     | Trial user verified                                               | 1. Verify the trial user's number from another account.                               | `PHONE_ALREADY_USED`; the second account has balance 0                                                | `services/billing.test.ts`, `credits_trial.test.sql` | ⬜  | ⬜      |
| TC-API-370-06 | Another user's balance          | High     | Two users                                                         | 1. Give user B credits. 2. User A reads credits.                                      | A's balance does not change                                                                           | `routes/billing.test.ts`                             | ⬜  | ⬜      |

## Manual run log

| Date | Env | Tester | Result | Notes |
| ---- | --- | ------ | ------ | ----- |
