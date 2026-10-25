# Test cases - Pattern viewer

| Field        | Value                          |
| ------------ | ------------------------------ |
| Issue        | #243                           |
| SRS          | FR-PAT-04                      |
| Area         | ui                             |
| Last updated | 2026-10-25 (by the PR of #243) |

## Test data

Open `/ar/dev/pattern-viewer` (and `/en/dev/pattern-viewer`) on the dev or preview deployment: it drafts the seed dress at size M. The route returns 404 in production.

## Cases

Status legend: ⬜ not run · ✅ pass · ❌ fail (link issue)

| ID           | Title                          | Priority | Preconditions          | Steps                                                                             | Expected result                                                                                   | Automated by                       | dev | staging |
| ------------ | ------------------------------ | -------- | ---------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- | ---------------------------------- | --- | ------- |
| TC-UI-243-01 | Pinch and drag on a real phone | High     | Phone, 360 px or wider | 1. Open the page. 2. Pinch out with two fingers. 3. Drag with one finger.         | The pattern zooms around the fingers and moves; the page behind does not scroll                   | `e2e/pattern-viewer-touch.spec.ts` | ⬜  | ⬜      |
| TC-UI-243-02 | Trackpad and mouse             | Medium   | Laptop                 | 1. Scroll the wheel or pinch the trackpad over the pattern. 2. Drag. 3. Press Fit | Zooms at the cursor, stops at the limit, Fit restores the whole sheet                             | `e2e/pattern-viewer.spec.ts`       | ⬜  | ⬜      |
| TC-UI-243-03 | Keyboard                       | Medium   | Keyboard               | 1. Tab to the canvas. 2. Arrows, + and -, 0. 3. Escape after selecting a piece    | Arrows move the content in the arrow direction; + and - zoom; 0 fits; Escape clears the selection | `e2e/pattern-viewer.spec.ts`       | ⬜  | ⬜      |
| TC-UI-243-04 | Arabic (RTL) is not mirrored   | High     | `/ar` and `/en` open   | 1. Compare the two pages.                                                         | The pieces sit in the same places; only the buttons switch side and language                      | `e2e/pattern-viewer.spec.ts`       | ⬜  | ⬜      |

## Manual run log

| Date | Env | Tester | Result | Notes |
| ---- | --- | ------ | ------ | ----- |
