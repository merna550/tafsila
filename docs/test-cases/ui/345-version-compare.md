# Test cases — Version compare

| Field        | Value                       |
| ------------ | --------------------------- |
| Issue        | #345                        |
| SRS          | FR-CHAT-05, NFR-06, NFR-08  |
| Area         | ui                          |
| Last updated | 2026-11-02 (by the #345 PR) |

## Test data

Use the seeded accounts and records from `supabase/seed.sql` (see `docs/backend/seed-data.md`).

| Name | Value                                                     |
| ---- | --------------------------------------------------------- |
| User | `trial@tafsila.test` / `Test1234!` (3 free credits)       |
| Data | A dress with two saved versions (sleeve short, then long) |

## Cases

Status legend: ⬜ not run · ✅ pass · ❌ fail (link issue)

| ID           | Title                           | Priority | Preconditions                            | Steps                                                        | Expected result                                                                                                                   | Automated by                          | dev | staging |
| ------------ | ------------------------------- | -------- | ---------------------------------------- | ------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- | --- | ------- |
| TC-UI-345-01 | Compare two versions            | High     | A design with versions 1 and 2           | 1. Open the history. 2. Tick two versions. 3. Press Compare. | Both drawn as an overlay (first solid, second dashed), a legend with both numbers, and "Sleeve length: Short to Long" in the list | `e2e/version-compare.spec.ts`         | ⬜  | ⬜      |
| TC-UI-345-02 | Compare a chat-made version     | Medium   | After #343/#344: a version saved by chat | Compare it with the previous version.                        | The list shows what the chat edit changed                                                                                         | manual only                           | ⬜  | ⬜      |
| TC-UI-345-03 | Added and removed pieces        | Medium   | Two versions where a pocket was added    | Compare them.                                                | The pocket is listed as added and drawn green; a removed piece is listed and drawn red                                            | `unit/match-pieces.test.ts`           | ⬜  | ⬜      |
| TC-UI-345-04 | Mobile RTL                      | High     | Arabic, 390 px wide                      | Open the compare screen.                                     | Pickers stack, the overlay is above the list, nothing scrolls sideways, buttons are 44 px                                         | manual only                           | ⬜  | ⬜      |
| TC-UI-345-05 | English LTR                     | Medium   | English                                  | Open the compare screen.                                     | Same layout mirrored, arrows point forward, English labels                                                                        | `e2e/version-compare.spec.ts`         | ⬜  | ⬜      |
| TC-UI-345-06 | Different engine versions       | Medium   | One version saved by an older engine     | Compare it with a newer one.                                 | A warning says the drawing may differ slightly                                                                                    | `components/version-compare.test.tsx` | ⬜  | ⬜      |
| TC-UI-345-07 | Same version on both sides      | Medium   | URL with `a` equal to `b`                | Open it, or pick the same version twice.                     | "The two versions are the same. Choose two different versions"; no drawing                                                        | `e2e/version-compare.spec.ts`         | ⬜  | ⬜      |
| TC-UI-345-08 | Unknown or other user's version | High     | A version id that does not exist         | Open the compare URL with it.                                | The error state with a request id; nothing is drawn                                                                               | `e2e/version-compare.spec.ts`         | ⬜  | ⬜      |
| TC-UI-345-09 | Hide one version                | Low      | Compare screen open                      | Untick the second version in the legend.                     | Only the first version's lines remain                                                                                             | `e2e/version-compare.spec.ts`         | ⬜  | ⬜      |

## Manual run log

| Date | Env | Tester | Result | Notes |
| ---- | --- | ------ | ------ | ----- |
