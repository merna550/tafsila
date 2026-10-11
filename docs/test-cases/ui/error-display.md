# Test cases — Error display

| Field        | Value                            |
| ------------ | -------------------------------- |
| Issue        | #72                              |
| SRS          | NFR-06, NFR-09                   |
| Area         | ui                               |
| Last updated | 2026-10-11 (by PR for issue #72) |

## Test data

None: errors are produced with the debug error route outside production or by switching the browser offline.

## Cases

Status legend: ⬜ not run · ✅ pass · ❌ fail (link issue)

| ID          | Title                         | Priority | Preconditions  | Steps                                      | Expected result                                                           | Automated by                                    | dev | staging |
| ----------- | ----------------------------- | -------- | -------------- | ------------------------------------------ | ------------------------------------------------------------------------- | ----------------------------------------------- | --- | ------- |
| TC-UI-72-01 | Offline banner                | High     | Home page open | 1. Turn the network off. 2. Turn it on.    | Arabic banner at the top while offline; gone when online                  | `error-display.test.tsx` (view); banner by hand | ⬜  | ⬜      |
| TC-UI-72-02 | Each error in its place       | High     | -              | Run the unit tests                         | Field, toast, ErrorState, sign-in redirect, 403 message, offline, unknown | `error-display.test.tsx`                        | ⬜  | ⬜      |
| TC-UI-72-03 | Unknown error shows reference | High     | -              | Trigger a 500                              | Arabic message, no "500"/stack, request id with a working copy button     | `error-display.test.tsx`; copy by hand          | ⬜  | ⬜      |
| TC-UI-72-04 | Crash shows fallback          | Medium   | -              | Make a component throw while rendering     | ErrorState with reload button; one Sentry event tagged with request id    | `error-display.test.tsx`                        | ⬜  | ⬜      |
| TC-UI-72-05 | Three states                  | Medium   | -              | Show a data screen loading, empty, failing | Skeleton, EmptyState, ErrorState with "حاولي تاني"                        | `error-display.test.tsx`                        | ⬜  | ⬜      |

## Manual run log

| Date | Env | Tester | Result | Notes |
| ---- | --- | ------ | ------ | ----- |
