# Test cases - Pattern versions API

| Field        | Value                                |
| ------------ | ------------------------------------ |
| Issue        | #245                                 |
| SRS          | FR-PAT-01, FR-CHAT-05, FR-VAL-01..08 |
| Area         | api                                  |
| Last updated | 2026-10-19 (by PR for #245)          |

## Test data

Seed account `trial@tafsila.test` (password in `docs/backend/seed-data.md`), its seed design and a measurement set from `GET /api/measurements`.

## Cases

Status legend: ⬜ not run · ✅ pass · ❌ fail (link issue)

| ID            | Title                     | Priority | Preconditions                               | Steps                                                                         | Expected result                                                               | Automated by                                                 | dev | staging |
| ------------- | ------------------------- | -------- | ------------------------------------------- | ----------------------------------------------------------------------------- | ----------------------------------------------------------------------------- | ------------------------------------------------------------ | --- | ------- |
| TC-API-245-01 | Save, list, read, restore | High     | Token, design, set                          | Postman: `POST` version, `GET` list, `GET /api/versions/{id}`, `POST` restore | 201, 200, 200 (`engineChanged` false), restore of the current version 200     | `routes/pattern-versions.test.ts`                            | ⬜  | ⬜      |
| TC-API-245-02 | Refused spec              | High     | Token, dress design                         | Save a dress with `waistSeam: false` and a gathered skirt                     | 422 `PATTERN_INVALID`, `details.report.status` is `fail`, no version stored   | `services/pattern-versions.test.ts`                          | ⬜  | ⬜      |
| TC-API-245-03 | Save twice                | High     | Token, design, set                          | Send the same save body twice                                                 | Second answer 200, same version id, `reused` true, list total unchanged       | `services/pattern-versions.test.ts`                          | ⬜  | ⬜      |
| TC-API-245-04 | Foreign set or design     | High     | Two users                                   | User B saves with A's set, on A's design; lists, reads, restores A's version  | 404 `NOT_FOUND` each                                                          | `routes/pattern-versions.test.ts`, `repositories.db.test.ts` | ⬜  | ⬜      |
| TC-API-245-05 | Engine time on staging    | Medium   | Staging token                               | Save a version and read the `Server-Timing` header                            | `engine;dur=` is well under the 10 s function limit; note the value in the PR | manual                                                       | ⬜  | ⬜      |
| TC-API-245-06 | Engine version changed    | Medium   | A version row with `engine_version` `0.0.1` | `GET /api/versions/{id}`                                                      | 200 with a fresh pattern and `engineChanged` true                             | `routes/pattern-versions.test.ts`                            | ⬜  | ⬜      |
