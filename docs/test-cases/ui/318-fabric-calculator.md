# Test cases — Fabric calculator on the saved version

| Field        | Value                                                      |
| ------------ | ---------------------------------------------------------- |
| Issue        | #318                                                       |
| SRS          | FR-FAB-01, FR-FAB-02, FR-FAB-03, FR-FAB-05, NFR-02, NFR-06 |
| Area         | ui                                                         |
| Last updated | 2026-10-28 (by #318)                                       |

## Test data

A signed-in user with a seeded client and a saved version of a dress, a skirt and a lined dress.

## Cases

Status legend: ⬜ not run · ✅ pass · ❌ fail (link issue)

| ID           | Title                              | Priority | Preconditions                                 | Steps                                                         | Expected result                                                                                                      | Automated by                                            | dev | staging |
| ------------ | ---------------------------------- | -------- | --------------------------------------------- | ------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- | --- | ------- |
| TC-UI-318-01 | Dress on 140 cm folded             | High     | Saved dress version                           | Open the version, pick 140 and Folded, press Calculate fabric | A length in metres with one decimal for the main fabric and a marker diagram with piece names                        | `e2e/fabric-calculator.spec.ts`                         | ⬜  | ⬜      |
| TC-UI-318-02 | Skirt on 115 cm open               | High     | Saved skirt version                           | Pick 115 and Open, calculate                                  | A length and a marker with two selvedge lines and no fold line                                                       | `e2e/fabric-calculator.spec.ts` (skirt)                 | ⬜  | ⬜      |
| TC-UI-318-03 | Directional nap                    | Medium   | Saved dress version                           | Switch nap on, calculate                                      | Length is the same or longer; no piece is turned in the diagram                                                      | Manual                                                  | ⬜  | ⬜      |
| TC-UI-318-04 | Shrinkage and repeat change length | Medium   | A result is shown                             | Set shrinkage 10 and repeat 20, recalculate                   | The length grows; the note says 10%                                                                                  | `model/fabric-form.test.ts` + manual                    | ⬜  | ⬜      |
| TC-UI-318-05 | Cancel                             | High     | A slow skirt (circle) version                 | Press Calculate, then Cancel                                  | Progress disappears, the form stays usable, no result of the cancelled run shows                                     | `shared/fabric-nesting/fabric-client.test.ts`           | ⬜  | ⬜      |
| TC-UI-318-06 | Reload shows the saved result      | High     | TC-01 done                                    | Reload the page                                               | The same length shows at once; the button says Recalculate; the form holds the saved options                         | `e2e/fabric-calculator.spec.ts`                         | ⬜  | ⬜      |
| TC-UI-318-07 | Older calculator version           | Low      | A stored result with an older nesting version | Open the version                                              | The line "calculated with an older version" shows with the lengths                                                   | `model/format.test.ts` + manual                         | ⬜  | ⬜      |
| TC-UI-318-08 | Piece wider than the fabric        | High     | Saved dress version                           | Pick a custom width of 50 cm, Folded, calculate               | A red notice names the piece; lengths show a dash; "Try the open layout" switches and recalculates; nothing is saved | `shared/fabric-nesting/fabric-handler.test.ts` + manual | ⬜  | ⬜      |
| TC-UI-318-09 | Mobile, Arabic RTL                 | High     | Phone width 390                               | Open the version, calculate                                   | Options above results, no sideways scroll, the diagram fits the width, zoom buttons are 44 px                        | Screenshots in `screenshots/318/`                       | ⬜  | ⬜      |
| TC-UI-318-10 | English, LTR                       | Medium   | Interface language English                    | Calculate a lined dress                                       | Main fabric, lining and interfacing tiles; switching the diagram kind redraws                                        | Manual                                                  | ⬜  | ⬜      |
