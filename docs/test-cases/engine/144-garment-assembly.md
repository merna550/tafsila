# Test cases — Garment assembly (dress with or without a waist seam, category parts)

| Field        | Value                               |
| ------------ | ----------------------------------- |
| Issue        | #144                                |
| SRS          | FR-PAT-01, FR-PAT-05, FR-VAL-01..07 |
| Area         | engine                              |
| Last updated | 2026-10-19 (by PR #222)             |

## Test data

Seed designs from `@tafsila/test-fixtures`: `seedDress`, `onePieceDress`, `princessOnePieceDress`, `CATEGORY_SEEDS`. Print with `pnpm engine:print`.

## Cases

Status legend: ⬜ not run · ✅ pass · ❌ fail (link issue)

| ID            | Title                           | Priority | Preconditions             | Steps                                                           | Expected result                                                | Automated by                                 | dev | staging |
| ------------- | ------------------------------- | -------- | ------------------------- | --------------------------------------------------------------- | -------------------------------------------------------------- | -------------------------------------------- | --- | ------- |
| TC-ENG-144-01 | Waist seam dart notches meet    | High     | `seedDress` size M        | 1. Print at 1:1. 2. Lay the bodice waist on the skirt waist.    | The `waist-dart` notches and the darts meet within 2 mm        | `modules/assembly/assembly.test.ts` + manual | ⬜  | ⬜      |
| TC-ENG-144-02 | One-piece fisheye and side seam | High     | `onePieceDress` M         | 1. Print. 2. Check the fisheye dart and the side seam.          | Diamond dart, legs equal; smooth side seam through the waist   | `assembly.test.ts`, snapshots + manual       | ⬜  | ⬜      |
| TC-ENG-144-03 | Princess seam to the hem        | Medium   | `princessOnePieceDress` M | 1. Print. 2. Walk the centre and side panel seams.              | The seam continues from the waist to the hem; both sides match | `assembly.test.ts` + manual                  | ⬜  | ⬜      |
| TC-ENG-144-04 | Blouse seed still drafts        | Medium   | `dartedBlouse` M          | 1. Print.                                                       | Waist-length blouse (hip length is #224)                       | `assembly.test.ts` (category seeds)          | ⬜  | ⬜      |
| TC-ENG-144-05 | Conflicting spec message        | High     | —                         | 1. Draft a dress with `waistSeam: false` and a gathered skirt.  | `fail`, no pieces, Arabic message names the fix                | `pipeline/category-rules.test.ts`            | ⬜  | ⬜      |
| TC-ENG-144-06 | Toile: dress                    | High     | Sew-test #223             | Sew `seedDress` and `onePieceDress` in S, M, XXL                | Fit notes logged in `sew-tests.md`                             | manual only (`needs:sew-test`)               | ⬜  | ⬜      |
| TC-ENG-144-07 | Toile: skirt                    | High     | Sew-test #223             | Sew `straightBandSkirt` in S, M, XXL                            | Fit notes logged in `sew-tests.md`                             | manual only (`needs:sew-test`)               | ⬜  | ⬜      |
| TC-ENG-144-08 | Toile: blouse                   | High     | Sew-test #223             | Sew `dartedBlouse` in S, M, XXL                                 | Fit notes logged in `sew-tests.md`                             | manual only (`needs:sew-test`)               | ⬜  | ⬜      |
| TC-ENG-144-09 | Method check against Aldrich    | Medium   | —                         | Compare the one-piece step with Aldrich's one-piece dress block | Merna agrees with decision 144, 4 or opens an issue            | manual only                                  | ⬜  | ⬜      |
