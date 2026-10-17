# Test cases — Fit validation

| Field        | Value                         |
| ------------ | ----------------------------- |
| Issue        | #133                          |
| SRS          | FR-VAL-01, -02, -03, -04, -07 |
| Area         | engine                        |
| Last updated | 2026-10-17 (by PR for #133)   |

## Test data

Use the five chart sizes from `SIZE_MATRIX`, the generated bodice/skirt blocks and the focused synthetic sleeve/notch failure fixtures.

## Cases

Status legend: ⬜ not run · ✅ pass · ❌ fail (link issue)

| ID            | Title                    | Priority | Preconditions          | Steps                                                      | Expected result                                                   | Automated by                                             | dev | staging |
| ------------- | ------------------------ | -------- | ---------------------- | ---------------------------------------------------------- | ----------------------------------------------------------------- | -------------------------------------------------------- | --- | ------- |
| TC-ENG-133-01 | Paired seam mismatch     | High     | Generated block        | Compare every declared seam pair after closing darts       | Difference is at most 2 mm, or matches declared ease within 2 mm  | `packages/engine/src/validation/rules/fit-rules.test.ts` | ⬜  | ⬜      |
| TC-ENG-133-02 | Declared seam ease       | High     | Synthetic paired edge  | Set positive or negative intended ease and run validation  | Report contains measured/expected mm and both edge refs           | `packages/engine/src/validation/rules/fit-rules.test.ts` | ⬜  | ⬜      |
| TC-ENG-133-03 | Sleeve cap boundaries    | High     | Synthetic sleeve       | Test cap ease at 10 mm, 40 mm and immediately outside      | 10–40 mm passes; outside fails with cap and armhole refs          | `packages/engine/src/validation/rules/fit-rules.test.ts` | ⬜  | ⬜      |
| TC-ENG-133-04 | Bust/waist/hip totals    | High     | Chart-size generation  | Measure declared lines with folds doubled and darts closed | Each total equals measurement plus ease within 5 mm               | `packages/engine/src/validation/rules/fit-rules.test.ts` | ⬜  | ⬜      |
| TC-ENG-133-05 | Reversed notch mismatch  | High     | Paired notch fixture   | Compare positions from the common sewing end               | Offset at most 2 mm passes; larger or missing partner fails       | `packages/engine/src/validation/rules/fit-rules.test.ts` | ⬜  | ⬜      |
| TC-ENG-133-06 | Dart legs and apex limit | High     | Bodice or dart fixture | Measure both legs and signed setback from the bust point   | Legs differ at most 1 mm and apex stays behind its declared limit | `packages/engine/src/validation/rules/fit-rules.test.ts` | ⬜  | ⬜      |
