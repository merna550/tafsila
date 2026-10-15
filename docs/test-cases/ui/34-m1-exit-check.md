# Test cases — M1 exit check

| Field        | Value                                          |
| ------------ | ---------------------------------------------- |
| Issue        | #34                                            |
| SRS          | FR-AUTH-01, FR-AUTH-02, FR-MEAS-01, FR-MEAS-02 |
| Area         | ui                                             |
| Last updated | 2026-10-14 (by PR for issue #34)               |

## Test data

A fresh account per run (the e2e creates `e2e-*@example.com`). Test phone `010 0000 0010` (local code `123456`); on staging use the staging test number.

| Name        | Value                                    |
| ----------- | ---------------------------------------- |
| Size M (cm) | bust 96, high bust 91, waist 78, hip 104 |

## Cases

Status legend: ⬜ not run · ✅ pass · ❌ fail (link issue)

| ID          | Title                                                    | Priority | Preconditions    | Steps                                                                                                                                      | Expected result                                                                                              | Automated by           | dev | staging |
| ----------- | -------------------------------------------------------- | -------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------ | ---------------------- | --- | ------- |
| TC-UI-34-01 | M1 exit: sign up, verify phone, client with measurements | High     | Test phone free  | 1. Sign up, open the mail link 2. Verify the test phone 3. Add a client 4. New set from size M, change waist and hip 5. Save               | Dashboard after verification; two boxes marked adjusted; the set is saved and listed on the client's profile | `e2e/m1-exit.spec.ts`  | ⬜  | ⬜      |
| TC-UI-34-02 | M1 exit: a second user cannot see the client             | High     | TC-UI-34-01 done | 1. Sign out 2. Open the client's address (guarded) 3. Sign up a second user 4. Open her clients list, then the first user's client address | Sign-in is required when signed out; the second user sees an empty list and never the client's name          | `e2e/m1-exit.spec.ts`  | ⬜  | ⬜      |
| TC-UI-34-03 | M1 flow on staging by hand (Merna)                       | High     | Staging deployed | Repeat 01 and 02 on staging in Arabic on a phone                                                                                           | Same results; no real SMS is sent                                                                            | manual only            | ⬜  | ⬜      |
| TC-UI-34-04 | Postman "Clients and measurements" folder on staging     | High     | Staging login    | `pnpm api:test --base-url <staging url>`                                                                                                   | All steps green                                                                                              | `postman/journey.json` | ⬜  | ⬜      |

## Manual run log

| Date | Env | Tester | Result | Notes |
| ---- | --- | ------ | ------ | ----- |
