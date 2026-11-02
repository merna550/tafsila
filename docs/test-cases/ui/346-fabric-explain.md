# Test cases — Fabric explanation ("Why these fabrics?")

| Field        | Value                   |
| ------------ | ----------------------- |
| Issue        | #346                    |
| SRS          | FR-REC-04               |
| Area         | ui, api                 |
| Last updated | 2026-11-02 (by PR #385) |

## Test data

Use the seeded accounts and records from `supabase/seed.sql` (see `docs/backend/seed-data.md`). The local and CI provider is the fake one (`AI_PROVIDER=fake`), which names exactly the recommended fabrics.

| Name | Value                                                                                 |
| ---- | ------------------------------------------------------------------------------------- |
| User | `trial@tafsila.test` / `Test1234!`                                                    |
| Page | A saved version, section "Recommended fabrics" (`/designs/<id>/versions/<versionId>`) |

## Cases

Status legend: ⬜ not run · ✅ pass · ❌ fail (link issue)

| ID           | Title                               | Priority | Preconditions                              | Steps                                                                                                       | Expected result                                                                                                                 | Automated by                                                 | dev | staging |
| ------------ | ----------------------------------- | -------- | ------------------------------------------ | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ | --- | ------- |
| TC-UI-346-01 | Explanation in Arabic               | High     | Saved version, language Arabic             | 1. Open the version. 2. Press "لماذا هذه الأقمشة؟".                                                         | A writing state, then one short paragraph naming only the fabrics above, with "صيغ بالذكاء الاصطناعي" and the note              | `e2e/fabric-explain.spec.ts` (ar), `fabrics-explain.test.ts` | ⬜  | ⬜      |
| TC-UI-346-02 | Explanation in English              | High     | Saved version, language English            | 1. Open the version. 2. Press "Why these fabrics?".                                                         | The paragraph in English, no fabric outside the recommended and avoid lists                                                     | `e2e/fabric-explain.spec.ts` (en)                            | ⬜  | ⬜      |
| TC-UI-346-03 | Admin rule edit changes the text    | Medium   | Admin edits a recommendation rule's reason | 1. Read the explanation. 2. Admin edits a rule that the version uses. 3. Reload and press the button again. | A new text is written (a new row, one more `ai_usage` row); an unchanged recommendation returns the same text without a new row | `fabrics-explain.test.ts` (route), manual on staging         | ⬜  | ⬜      |
| TC-UI-346-04 | Daily cap message                   | Medium   | `AI_EXPLAIN_DAILY_LIMIT` reached           | 1. Ask for explanations of new versions until the cap. 2. Ask for one more.                                 | The unavailable state with "إعادة المحاولة"; the recommendations stay; an already cached text still opens                       | `fabrics-explain.test.ts` (route), `explain.test.tsx`        | ⬜  | ⬜      |
| TC-UI-346-05 | Real provider names no extra fabric | High     | After #347 (real provider chosen)          | 1. Ask for explanations for 10 different designs in both languages.                                         | No text names a fabric outside the recommended and avoid lists; texts stay within 70 words                                      | manual only                                                  | ⬜  | ⬜      |
| TC-UI-346-06 | Unavailable state and retry         | Medium   | Provider failing                           | 1. Press the button. 2. See the failure. 3. Press "إعادة المحاولة" when fixed.                              | "الشرح غير متاح الآن..." without technical text; the fabric cards stay; retry loads the text                                    | `explain.test.tsx`                                           | ⬜  | ⬜      |
| TC-UI-346-07 | Other user's version                | High     | Two users                                  | 1. User B calls `GET /api/fabrics/recommend?versionId=<A's>&explain=true`.                                  | 404, no AI call, no `ai_usage` row                                                                                              | `fabrics-explain.test.ts`                                    | ⬜  | ⬜      |
| TC-UI-346-08 | Mobile width and RTL                | Medium   | Phone width 375 px                         | 1. Open the block in each state.                                                                            | No horizontal scroll, the button is at least 44 px high, text reads right to left in Arabic                                     | screenshots under `screenshots/346/`                         | ⬜  | ⬜      |

## Manual run log

| Date | Env | Tester | Result | Notes |
| ---- | --- | ------ | ------ | ----- |
