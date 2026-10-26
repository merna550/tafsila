## Plan: #291 direct-cut checklist with ticks and print view (planned together with #292, the per-step diagram)

Plan wave M4, 2026-10-25. Depends on #281 (screens) and #284 (`cutSteps`, plan written in parallel; this plan refers to it by issue number and fixes only the shape the UI needs). Follows [ADR-281](../decisions/281-m4-scope.md) items 1, 2, 5, 6, 7. **The build must match the direct-cut screen that #281 puts in `docs/design/screens/` (expected `DirectCut.dc.html` + `images/DirectCut.{desktop,mobile}.png`; use the row for `/cut` in that folder's README table if the name differs).** Routes, files and interfaces below are fixed so the build and #292 do not guess. #292 reuses everything here and only adds the highlight (see its plan).

### Approach

1. **Worker.** Add a second message type to the preview worker (no new worker, no engine code in the page bundle): request `{ kind: "cut-steps", id, spec, measurements, options?, curveStepMm }`, answer `{ kind: "cut-steps", id, ok: true, plan: CutPlan } | { id, ok: false, error }`. `kind` is optional on the existing preview request (`"preview"` by default), so #239/#243 code and tests stay unchanged. The worker calls `generatePattern` then #284 `cutSteps(result, { curveStepMm })` and maps it to `CutPlan` in one adapter `shared/pattern-preview/cut-plan.ts` (worker side). **First build step:** read #284's merged result type and make the adapter the only place that knows it; if #284 returns message keys + params, the adapter resolves them to `{ ar, en }` with the engine's i18n helper there, so `apps/web` never imports engine i18n or geometry. `PreviewClient` gets `runCutSteps(input, curveStepMm)` (same pending map, latest wins).
2. **Hook** `useCutSteps(input, curveStepMm)` in `shared/pattern-preview/use-cut-steps.ts` (own worker, terminated on unmount; no debounce, the setting is a select): `{ status: "idle"|"running"|"ready"|"error", plan, error }`. Errors go through `previewErrorToApiError` and the shared error display.
3. **Feature `apps/web/src/features/direct-cut/`** (components → hooks → model):
   - `DirectCutScreen({ designId, versionId })`: `useVersion(versionId)` + `useDesign(designId)` (both from existing feature indexes) → builds the worker input exactly like `useReadOnlyVersion` (spec, measurements, options of the stored version) → `useCutSteps`. Header shows design title, "Version N", engine version (ADR-281 item 1) and the engine-changed badge when `detail.engineChanged`.
   - Screen layout (phone 360 first): piece list → chosen piece: reference lines in words → curve step select (20/25/30) → steps with tick boxes → `PieceDiagram`. Desktop: steps left, diagram sticky right. Progress "5 of 18" per piece. Actions: Print, Clear ticks (confirm), Back to version.
   - `components/`: `CutPieceList`, `ReferenceLines`, `CurveStepSelect`, `StepList` + `StepRow` (checkbox = tick; tapping the row body marks it current, see #292), `PieceDiagram` (reference drawing, see contract), `PrintSheet`, `DirectCutLink` (button "Direct cut" for the version view).
   - `hooks/use-ticks.ts`, `hooks/use-cut-settings.ts`, `hooks/use-direct-cut.ts` (composes the above for the screen).
   - `model/types.ts` (contract below), `model/format.ts`, `model/ticks.ts`, `model/steps.ts`, each with a `.test.ts`.
4. **Route** `apps/web/src/app/[locale]/(dashboard)/designs/[id]/versions/[versionId]/cut/page.tsx`: thin Server Component, `await params`, renders `DirectCutScreen`. `DirectCutLink` is added to `features/pattern-page/components/ReadOnlyVersionBody.tsx` (next to the badges; imported from `@/features/direct-cut`), disabled with the reason when the version failed to draft.
5. **Print** (FR-CUT-03): the same page; `@media print` through Tailwind `print:` variants. Screen UI gets `print:hidden`; `PrintSheet` is `hidden print:block` and renders every piece: title block (design, version N, engine version, piece name, cut count, fold), reference lines, the numbered steps with **empty boxes** (it never reads tick state), and the piece diagram, one piece per page (`break-after: page`). The print view uses the same curve step as the screen. Print button calls `window.print()`.
6. **Numbers.** `formatCm(mm)` = cm with exactly one decimal ("22.5", "10.0"); `localizeDigits(text, digits)` converts digits and the decimal point for `digits: "western" | "arabic-indic"`, default **western** (NFR-06; there is no digits setting in the app yet, so the screen passes `"western"`; the print view uses the same). Step sentences come ready from the engine with cm numbers already rounded; the UI only runs them through `localizeDigits`. No geometry or rounding of lengths in `apps/web`.

### Contract: `CutPlan` (UI side, fixed; the #284 adapter fills it)

```ts
type LocalizedText = { ar: string; en: string };
type Pt = { x: number; y: number }; // mm, piece-local frame, same frame as outlineD
type CutPlan = { engineVersion: string; curveStepMm: number; pieces: CutPiecePlan[] };
type CutPiecePlan = {
  pieceId: string;
  name: LocalizedText;
  cutCount: number;
  onFold: boolean;
  reference: {
    text: LocalizedText;
    lines: { id: string; kind: "fold" | "grain" | "top"; from: Pt; to: Pt }[];
  };
  points: { id: string; label: string; at: Pt }[]; // label "A", "B", ... as shown in the steps
  steps: CutStep[]; // ordered, numbered 1..n without gaps
  diagram: { widthMm: number; heightMm: number; outlineD: string }; // cut line as an SVG path, piece-local mm
};
type CutStep = {
  id: string; // stable for one version + curveStepMm + engine version
  no: number;
  group: "corners" | "curves" | "marks";
  text: LocalizedText; // full sentence, cm already in it
  pointIds: string[]; // points this step marks or connects
  guides: { from: Pt; to: Pt; mm: number }[]; // distance segments to draw (along / across the reference), computed by the engine
};
```

If #284 names things differently, change only the adapter; the UI types stay. If #284 has no stable step id, the adapter builds `${pieceId}#${no}`.

### Checklist state (ticks per version, browser storage)

- Key `tafsila.cut.ticks.<versionId>.<curveStepMm>`, value `{ v: 1, engineVersion, ticked: string[] }` through `shared/storage/safe-storage.ts` (`readJson`/`writeJson`, try/catch inside). Different curve steps keep separate ticks (their step lists differ); a stored value with another `engineVersion` or a bad shape is ignored (steps may have changed).
- `tafsila.cut.settings` = `{ curveStepMm: 20 | 25 | 30 }` (per viewer, default 25); an invalid value falls back to 25.
- `useTicks` starts empty and reads storage in an effect (no hydration mismatch), writes on every change, and works with storage blocked (ticks live in memory). Pure helpers in `model/ticks.ts`: `ticksKey`, `parseTicks(raw, engineVersion)`, `toggleTick`, `clearTicks`, `pieceProgress(steps, ticked)`.

### Files

Create: everything under `apps/web/src/features/direct-cut/` listed above; `apps/web/src/shared/pattern-preview/{cut-plan.ts,cut-plan.test.ts,use-cut-steps.ts}`; the route `page.tsx`; `apps/web/e2e/direct-cut.spec.ts`; `docs/test-cases/ui/291-direct-cut.md`; `docs/decisions/291-direct-cut-ui.md`; `packages/test-fixtures` cut-plan fixture (a small hand-written `CutPlan`, 1 fold piece + 1 piece without fold, 3 groups) for component tests, exported from the index.
Change: `shared/pattern-preview/{protocol.ts,preview-client.ts,pattern-preview.worker.ts,index.ts}` (+ their tests); `features/pattern-page/components/ReadOnlyVersionBody.tsx`; `apps/web/messages/{ar,en}.json` (`directCut.*`); `docs/design/copy.md` (glossary rows below); `docs/frontend/README.md` (section "Direct cut"); `docs/CONTEXT_MAP.md` (row "Direct-cut work"). SRS: no change (FR-CUT-01..03 stay as written).

### Data / API

No endpoint, table or migration. Reads `GET /api/versions/:id` and the design through the existing hooks. `scripts/check-engine-chunk.mjs` already scans every page, so the new route is guarded without a change; confirm it passes after `next build`.

### Tests

- Unit (`model/`): `formatCm(225)` = "22.5", `formatCm(100)` = "10.0", `formatCm(0)` = "0.0"; `localizeDigits("22.5 سم", "arabic-indic")` = "٢٢٫٥ سم" and `"western"` returns the text unchanged; `ticksKey`; `parseTicks` rejects junk, another engine version and unknown shapes; `toggleTick` twice is identity; `pieceProgress` counts only ids that exist in the steps (stale ids ignored).
- Unit (adapter): `cut-plan` maps a sample #284 result to `CutPlan` (steps numbered without gaps, every `pointIds` entry exists in `points`, every point inside the diagram box ±1 mm).
- Worker/client: the new message type resolves, latest wins, an engine error comes back as `{ ok: false }`; preview messages without `kind` still work.
- Server-render (fixture plan, `renderWithIntl`, `ar` and `en`): list shows piece name, cut count, fold label; steps show text in the right language; boxes are unchecked; the print sheet has one section per piece with empty boxes whatever the ticks; no `direction` hard-coded; Arabic strings come from `ar.json`.
- **E2E** `direct-cut.spec.ts` (seeded client, dress path from `e2e/support/pattern.ts`: start design, `saveVersion`, open the version, click "Direct cut"; `ar` and `en`, desktop and `mobile-360`): tick two steps, reload, ticks and progress kept; change curve step to 30, the step list changes (fewer curve points) and the first set's ticks are not shown, change back to 25 and they return; "Clear ticks" confirms and empties; blocked storage (`addInitScript` making `localStorage` throw) still renders and ticks work in memory; no horizontal overflow at 360 px; no call to the engine on the main thread (the existing chunk guard).
- Print snapshot: `page.emulateMedia({ media: "print" })`, screenshot of the seed dress front page (`ar`, A4 viewport), plus an assertion that tick boxes are empty after ticking and that the title block shows version number and engine version.
- Visual: screenshots of the screen at 360 px and desktop in `ar` against the #281 images.
- Manual cases `docs/test-cases/ui/291-direct-cut.md` (the #292 cases are added to the same file): TC-UI-291-01 open from a saved version; -02 tick and reload; -03 curve step 20/25/30 changes the list; -04 print preview, one piece per page, boxes empty, version printed; -05 360 px phone in Arabic; -06 English. Cutting a toile from the steps is **#296**, not here.

### Docs

JSDoc on every function, component and type (rule 3); frontend README "Direct cut" (route, worker message, `CutPlan`, tick keys); CONTEXT_MAP row; copy.md rows (draft, Merna reviews the Arabic): direct cut = قص مباشر / direct cut; marking step = خطوة تعليم / marking step; point = نقطة / point; fold line = خط الطي / fold line; curve step = المسافة بين النقاط على المنحنى / curve point spacing; clear ticks = مسح العلامات / clear ticks; print = طباعة / print.

### Decisions (build writes `docs/decisions/291-direct-cut-ui.md`; #292 adds its own file)

1. Steps are computed in the preview worker through a second message type; the UI contract is `CutPlan`, filled by one adapter, so #284's exact type touches one file.
2. Ticks are keyed by version **and** curve step, store the engine version, and are ignored when it differs; curve step is a per-viewer setting, default 25.
3. Numbers: cm with one decimal, Western digits by default (NFR-06). The issue text "Arabic digits in Arabic" is not followed because no digits setting exists yet; the formatter already supports Arabic-Indic and a later settings issue only flips the parameter.
4. Print is the same page with `@media print`; tick state is never printed (empty boxes), one piece per page.
5. Engine computes the distance guides drawn in the diagram; the UI only draws them.

### Risks

- #284 not merged or shaped differently: the adapter isolates it; the build starts after #284 and #281, and stops with `status:blocked` if the steps cannot supply `guides` or a diagram outline.
- Arabic step text order in mixed RTL/numbers: the sentence is rendered in a block with `dir` from the locale and numbers inside `<bdi>` where needed; checked in the Arabic print snapshot and by Merna's review of texts.
- Browsers print backgrounds off and add headers: the print CSS uses borders, not fills, for boxes; manual case TC-UI-291-04 checks Chrome and Safari.
- Too many steps on a phone: piece-by-piece view and the 20-30 mm setting; unclear steps are recorded by #296.

**Size:** M (unchanged). **Build:** `build:sonnet` (unchanged). `needs-interactive`: no (script says `no` for the planned files).

## Deviations

- `CutPlan` types live in `shared/pattern-preview/cut-plan-types.ts` (the worker adapter and the feature both use them; `shared` cannot import from a feature).
- The merged #284 returns message keys and parameters, not sentences. The adapter fills both languages with `cutStepText` from `@tafsila/engine/cut-text`; the three `cut.reference.*` steps become the piece's `reference.text` and are not ticked, so the ticked steps are numbered 1..n from the first marking step (as the approved screen shows). Step ids are `<pieceId>#<engine step number>`.
- `CutStep.group` and `CutStep.guides` are not in the plan: nothing in #291 uses them, and the engine step has no ready-made guide segments. #292 adds `guides` to the adapter when it draws them.
- `formatCm` and `model/steps.ts` are not built: the engine already prints cm; the unit tests cover `localizeDigits`, `showText`, ticks and settings.
- The print view is a state of the same page ("Print view" button, then Print/Back) as in `DirectCutPrint.dc.html`; `@media print` shows the same sheet. The "Clear ticks" button reads "إعادة ضبط التقدّم" as in the approved screen (not "مسح العلامات").
- The curve step is read from storage before the first worker run, so the steps are worked out once.
- No visual baselines (no Docker here); the visual check is listed on #265. The e2e spec is written but not run locally (CI runs it).
