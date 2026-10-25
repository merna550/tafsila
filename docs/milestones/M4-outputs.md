# M4 - Outputs

## Goal

A user takes a saved pattern version to the fabric three ways: projected at 1:1 on the cutting table after calibration, cut directly from numbered marking steps, or printed as a tiled A4 or A0 PDF with a test square (SRS §12). A toile sewn from the projector and from the PDF fits.

## Scope

In: approved M4 screen designs; projector calibration per device (separate X/Y factors), projector view at 1:1 (fullscreen, black background, high-contrast lines, line width, verification square, pan in mm, mirror), one piece or full layout with move and 0°/180° rotation; direct-cut marking steps from the engine, checklist with ticks, print view and per-step diagram; new `packages/export` with the tile maths, A4 tiled PDF (overlap marks, page map, test square) and A0 PDF; export dialog with A4, A0 and SVG download; an exit check; Merna's physical checks.
Out: keystone correction (FR-PROJ-06), DXF (FR-EXP-04), background export jobs and stored files (FR-EXP-05, deferred by [ADR-281](../decisions/281-m4-scope.md) item 3), projecting a fabric layout (FR-FAB-04, M5), outputs from an unsaved pattern, credits (M7), AI (M6).

## SRS IDs

FR-PROJ-01..05, FR-CUT-01..04, FR-EXP-01..03, FR-PAT-02 (labels on outputs), NFR-01 (projector ≤ 2 mm over 50 cm, ± 1 mm prints), NFR-02 (PDF A4 < 20 s), NFR-07 (projector keyboard-operable), SRS §5 flow 1 (the "Use" step), §11 projector QA and physical QA.

## Deliverables

- `docs/design/screens/`: M4 screens with images (#281).
- `packages/export` (new, SRS §3.2): tile layout (#283), A4 PDF (#288), A0 PDF (#290); library choice from the spike (#282).
- `packages/engine`: `cutSteps` direct-cut marking steps (#284).
- `apps/web`: projector calibration and view (#285, #286, #287), export dialog and export worker (#289, #290), direct-cut checklist and diagram (#291, #292).
- `docs/test-cases/ui/m4-exit.md` with logged results (#293); physical results in `docs/test-cases/engine/sew-tests.md` (#294, #295, #296).

## Exit criteria

A toile sewn from the projector and from the PDF fits (SRS §12). Measured by #293 (every output works from a saved version on staging, e2e on CI) together with Merna's #294 (projector within 2 mm over 50 cm at 4 positions, toile fits) and #295 (A4 and A0 test squares 10 cm ± 1 mm, toile fits).

## Dependencies

- From M3: all UI issues #240-#253 are merged (viewer, pattern page, versions, read-only version view), so M4 starts now. The M3 exit #254 waits for engine bugs #229-#232; M4 does not wait for it, and the M4 toiles use a dress or skirt those bugs do not touch ([ADR-281](../decisions/281-m4-scope.md) item 10).
- From M2: open sew-test issues (#197-#225, #148) are Merna's and do not block M4 builds.
- Inside M4 every issue lists "Depends on #N". Critical paths: #282 spike + #283 tiles → #288 A4 → #289 dialog → #290 A0 → #293 exit; #281 screens → #285 calibration → #286 projector → #287 pieces → #294 → #293; #284 steps → #291 checklist → #292 diagram.

## Decisions

[ADR-281](../decisions/281-m4-scope.md): outputs only from a saved version; everything in the browser (no API, table or job in M4); PDF in a worker with `pdf-lib`, FR-EXP-05 storage deferred; new `packages/export`; direct-cut steps mark the cut line from the fold or a grain-parallel line; routes under the version; calibration per device in `localStorage`; keystone, DXF and fabric layout out; physical checks are Merna's issues; M4 does not wait for the M3 exit.

## Merna's tasks

- **Approve the M4 screens on the design canvas** (#281): every UI issue waits for them.
- Check the Arabic PDF labels in the spike PR (#282) read correctly.
- Review the Arabic step texts ("from the fold, measure ... and mark point A") in #284 and #291.
- Physical checks: projector accuracy and a projector toile (#294), A4 and A0 prints and a PDF toile (#295), a direct-cut toile (#296, not in the exit).
- Run the exit check on staging (#293).
- Needs a projector over a cutting table and access to a copy shop that prints A0.

## Risks

- Arabic in the PDF: `pdf-lib` may not join or order Arabic letters. The spike #282 tries it first and records a fallback (reorder, text as paths, or Latin labels with Arabic on the map) before #288 is built.
- Print scale: browsers and printers "fit to page" by default. Every PDF carries the 10 cm test square and the dialog says "print at 100 %"; #295 checks a real printer.
- Projector accuracy: lens distortion and an angled projector are not corrected without keystone (FR-PROJ-06 out). Calibration uses separate X/Y factors; #294 measures 4 positions and keystone moves into a later issue if the error is over 2 mm.
- Bundle size: `pdf-lib`, the font and the engine must stay in worker chunks; `scripts/check-engine-chunk.mjs` is extended in #289.
- PDF build time on low-end machines (NFR-02): #288 records the time; a miss is the trigger to bring back server jobs (ADR-281 item 3).
- Direct-cut steps too many to follow: curve spacing is configurable (20-30 mm) and #296 records unclear steps.

## Issues

| Issue | Title                                                                  | Wave |
| ----- | ---------------------------------------------------------------------- | ---- |
| #281  | M4 screen designs in docs/design/screens                               | 1    |
| #282  | Spike: Arabic labels and 1:1 vector lines in a browser PDF             | 1    |
| #283  | packages/export with the print tile layout for A4 and A0               | 1    |
| #284  | Direct-cut marking steps per piece (engine)                            | 1    |
| #285  | Projector calibration stored per device                                | 2    |
| #288  | A4 tiled PDF with overlap marks, page map and test square              | 2    |
| #291  | Direct-cut checklist with ticks and print view                         | 2    |
| #286  | Projector view at 1:1 with verification square, pan and mirror         | 3    |
| #289  | Export dialog with A4 PDF and SVG download                             | 3    |
| #292  | Direct-cut step diagram with the current point highlighted (P3)        | 3    |
| #287  | Projector one piece or full layout, move and rotate 0/180              | 4    |
| #290  | A0 copy-shop PDF                                                       | 4    |
| #294  | Merna: projector calibration accuracy and toile cut from the projector | 5    |
| #295  | Merna: A4 and A0 print accuracy and toile from the PDF                 | 5    |
| #296  | Merna: toile cut from the direct-cut steps (not in the exit)           | 5    |
| #293  | Exit check: every output works from a saved version                    | 6    |

Waves are the order dependencies allow; `/plan-wave M4` plans every issue whose dependencies are closed. All code issues are size S or M; #292 (P3) is cut first if time runs short.
