# Test cases - Viewer layers and piece panel

| Field        | Value                             |
| ------------ | --------------------------------- |
| Issue        | #248                              |
| SRS          | FR-VIEW-01, FR-VIEW-02, FR-PAT-02 |
| Area         | ui                                |
| Last updated | 2026-10-25 (by the PR of #248)    |

## Test data

Open `/ar/dev/pattern-viewer` (and `/en/dev/pattern-viewer`): it drafts the seed dress at size M. The route returns 404 in production.

## Cases

Status legend: ⬜ not run · ✅ pass · ❌ fail (link issue)

| ID           | Title                              | Priority | Preconditions   | Steps                                                                                       | Expected result                                                              | Automated by                                              | dev | staging |
| ------------ | ---------------------------------- | -------- | --------------- | ------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- | --------------------------------------------------------- | --- | ------- |
| TC-UI-248-01 | Layers hide and survive a reload   | High     | Viewer is drawn | 1. Untick notches, cut line. 2. Tick grid. 3. Reload.                                       | Layers disappear or appear at once; the choice is kept after the reload.     | `e2e/pattern-viewer-panel.spec.ts`                        | ⬜  | ⬜      |
| TC-UI-248-02 | Piece list and panel               | High     | Viewer is drawn | 1. Click a piece. 2. Choose another from the list. 3. Press Escape.                         | Panel shows name, cut text, size in cm and every edge; Escape clears it.     | `e2e/pattern-viewer-panel.spec.ts`, `PiecePanel.test.tsx` | ⬜  | ⬜      |
| TC-UI-248-03 | Screen reader reads list and panel | Medium   | A screen reader | 1. Tab to the piece list. 2. Choose a piece.                                                | Each piece is announced by name; the selected one is current; panel is read. | manual only                                               | ⬜  | ⬜      |
| TC-UI-248-04 | Cut line toggle against paper      | Medium   | Printed pattern | 1. Switch the cut line off and on. 2. Compare the distance from the stitch line to the cut. | The cut line sits one seam allowance outside the stitch line.                | manual only                                               | ⬜  | ⬜      |
| TC-UI-248-05 | Arabic plural of the cut text      | Medium   | Language Arabic | Select pieces cut 1, 2, 3 or more times.                                                    | "قطعة واحدة", "قطعتان", "3 قطع", "11 قطعة".                                  | `PiecePanel.test.tsx`                                     | ⬜  | ⬜      |
