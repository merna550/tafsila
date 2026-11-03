# Test cases — Dimension layer (edge lengths and curve markers)

| Field        | Value                       |
| ------------ | --------------------------- |
| Issue        | #391                        |
| SRS          | FR-PAT-08, FR-PAT-02        |
| Area         | engine                      |
| Last updated | 2026-11-03 (by PR for #391) |

## Test data

The 25-entry size matrix, `rectanglePattern`, `dartedBlouse` and `vNeckHalfCircleDress` from `@tafsila/test-fixtures`.

## Cases

Status legend: ⬜ not run · ✅ pass · ❌ fail (link issue)

| ID            | Title                        | Priority | Preconditions         | Steps                                                                                | Expected result                                                                             | Automated by                    | dev | staging |
| ------------- | ---------------------------- | -------- | --------------------- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------- | ------------------------------- | --- | ------- |
| TC-ENG-391-01 | Off by default               | High     | Repo checked out      | Render a pattern with no `layers` option                                             | No `layer-dimensions` group; output identical to before the layer existed                   | `src/render/dimensions.test.ts` | ⬜  | ⬜      |
| TC-ENG-391-02 | Every edge shows its length  | High     | Repo checked out      | Render with the layer; read the text of each edge                                    | Each edge has exactly one number equal to its stitch length in cm, one decimal              | `src/render/dimensions.test.ts` | ⬜  | ⬜      |
| TC-ENG-391-03 | Curves marked, straights not | High     | Repo checked out      | Render a darted blouse with the layer                                                | Neck and armhole have a chord, a depth line and `قوس`; straight edges have only the length  | `src/render/dimensions.test.ts` | ⬜  | ⬜      |
| TC-ENG-391-04 | Radius only for a true arc   | Medium   | Repo checked out      | Render the circle-skirt dress; read the curve words                                  | `نق` appears on the arc edges and not on neck or armhole curves                             | `src/pieces/edge-curve.test.ts` | ⬜  | ⬜      |
| TC-ENG-391-05 | Lengths across all sizes     | High     | Repo checked out      | Run the size-matrix test                                                             | One length per edge for all 25 sizes, no crash                                              | `src/render/dimensions.test.ts` | ⬜  | ⬜      |
| TC-ENG-391-06 | Printed numbers match a tape | High     | Printer, tape measure | `pnpm engine:print dartedBlouse size-m --dimensions`; print at 100%; measure 3 edges | Each measured length is within 2 mm of its printed number (the curve length, not the chord) | manual only                     | ⬜  | ⬜      |
| TC-ENG-391-07 | Labels readable at 1:1       | Medium   | The printed sheet     | Read a label on a short edge and on a steep edge                                     | Text is upright, inside the piece, and does not sit on a cut line                           | manual only                     | ⬜  | ⬜      |
