# M3 - Design & pattern UI

## Goal

A user builds a design by hand in a visual picker, chooses a saved client's measurements and an ease preference, sees the pattern update live with its validation report, and saves versions of it (SRS §12). The product is usable without AI from here on (FR-DES-06).

## Scope

In: approved M3 screen designs, `designs` and `pattern_versions` tables with RLS, picker rules from the engine (`specOptions`, `defaultSpec`, `normalizeSpec`), engine preview in a Web Worker, shared option card, placeholder option drawings, designs and versions API, picker frame and feature sections with length overrides, options panel (client and set, ease preference, global seam allowance, fabric width), pattern viewer (zoom, pan, fit, layers, piece details, measure tool), validation report panel with edge highlight, pattern page with save, version history (list, open, restore), designs list and entry points from clients.
Out: photo upload, AI analysis and the confirmation screen (M6), chat edits and comparing two versions (M6), credits (M7), projector, direct-cut and PDF (M4), fabric (M5), per-edge seam allowance UI, a pattern for a standard size without a saved client, final option illustrations (before the beta).

## SRS IDs

FR-DES-06, FR-DES-05, FR-DES-02 (category only), FR-MEAS-06, FR-PAT-03 (global), FR-PAT-04, FR-VIEW-01..03, FR-VAL-09, FR-CHAT-05 (list, open, restore), SRS §5 flows 1 (manual) and 3, §7 (`designs`, `pattern_versions`), §8 (`/api/designs`, `/api/designs/:id/versions`).

## Deliverables

- `docs/design/screens/`: M3 screens with images (#236).
- `supabase/migrations/`: `designs`, `pattern_versions`, RLS, seed design with 2 versions (#237).
- `packages/engine`: `specOptions`, `defaultSpec`, `normalizeSpec` (#238).
- `packages/ui`: `OptionCard`, `OptionCardGroup` (#240).
- `packages/api`: designs and versions routes, OpenAPI, Postman (#242, #245).
- `apps/web`: preview worker, picker, options panel, viewer, report, pattern page, versions, designs list (#239, #241, #243, #244, #246-#253).
- `docs/test-cases/ui/m3-exit.md` with logged results (#254).

## Exit criteria

A user builds a design by hand and sees a validated pattern for a saved client (SRS §12). Measured by #254: dress, skirt and blouse built from a saved client on staging, pass or warn report, saved, reopened and restored; the dress path as e2e on CI.

## Dependencies

- From M2: engine #121-#147 merged, so M3 starts now. #148 (M2 exit, waits for toiles; the real size chart #32 is closed) does not block M3 builds.
- Open engine bugs: #229, #230, #231, #232 break combinations the picker offers (lining with buttons or full circle, buttons on skirts, princess seams, tiered), so the M3 exit #254 waits for them. #218, #224, #226, #233, #234 do not block M3 ([ADR-236](../decisions/236-m3-scope.md) item 12).
- From M1: clients and measurements API and screens (#29, #30, #31) are used as they are.
- Inside M3 every issue lists "Depends on #N". Critical path: #236 designs → #240 option card → #244 picker frame → #246 feature sections → #251 pattern page → #252 versions → #254 exit. #237 → #242 → #245 runs beside it.

## Decisions

[ADR-236](../decisions/236-m3-scope.md): engine in a browser worker for the preview and on the server for saving; a version stores inputs and a measurement snapshot, not the result; append-only history and restore as a new version; failing patterns are not saved; no credits until M7; measurements always from a saved set; compare moves to M6; one rule source in the engine; placeholder drawings; measure tool at P3.

## Merna's tasks

- **Approve the M3 screens on the design canvas** (#236): every UI issue waits for them.
- Approve the ease values (fitted and loose are still proposals, [ADR-126](../decisions/126-ease-tables.md)); the options panel shows them to users.
- Review the Arabic option names, refusal reasons and validation messages in the PRs.
- Run the exit check on staging (#254) for a dress, a skirt and a blouse.
- Before the beta: final option illustrations to replace the placeholders.

## Risks

- Picker and engine disagree: refused combinations come only from `specOptions` (#238), with a property test that a normalised spec never gets a refusal.
- Engine bugs on offered combinations (#229-#232): the exit waits for them; until then the preview shows the engine error through the shared error display, never a crash (#239).
- Preview speed on low-end phones: the engine runs in a worker with debounce; #233 (650 ms collar) is measured in #239.
- Server engine run on the free Vercel function limits: #245 logs the run time; the API bundle size is recorded.
- UI scope (19 issues): waves 2 and 3 run in parallel; #253 (P3) is cut first.

## Issues

| Issue | Title                                                              | Wave |
| ----- | ------------------------------------------------------------------ | ---- |
| #236  | M3 screen designs in docs/design/screens                           | 1    |
| #237  | designs and pattern_versions tables with RLS                       | 1    |
| #238  | specOptions, defaultSpec and normalizeSpec for the design picker   | 1    |
| #239  | Pattern preview in a Web Worker (usePatternPreview)                | 1    |
| #240  | OptionCard and OptionCardGroup in packages/ui                      | 2    |
| #241  | Placeholder line drawings for every catalogue option               | 2    |
| #242  | Designs endpoints (create, list, read, rename, delete)             | 2    |
| #243  | Pattern viewer with zoom, pan and fit to screen                    | 2    |
| #247  | Pattern options panel (client, measurements, ease, seam allowance) | 2    |
| #244  | Design picker frame, category step and editor store                | 3    |
| #245  | Pattern versions endpoints (save, list, read, restore)             | 3    |
| #248  | Viewer layer toggles and piece details panel                       | 3    |
| #249  | Validation report panel with edge highlight                        | 3    |
| #250  | Designs list and new-pattern entry points                          | 3    |
| #246  | Picker feature sections and length overrides                       | 4    |
| #253  | Viewer measure tool (P3)                                           | 4    |
| #251  | Pattern page with live preview and save version                    | 5    |
| #252  | Version history, open and restore                                  | 6    |
| #254  | Exit check: a hand-built design shows a validated pattern          | 7    |

Waves are the order dependencies allow; `/plan-wave M3` plans every issue whose dependencies are closed.
