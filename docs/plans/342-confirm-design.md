## Plan #342: Confirmation screen, confirm or correct every analysed feature

plan:sonnet · build:sonnet · size M (unchanged) · M6 wave 3 · FR-DES-03, FR-DES-04, FR-DES-05, FR-DES-07, NFR-06 · ADR-335 item 5 · Screen: `docs/design/screens/Confirmation.dc.html` (+ `images/Confirmation.{desktop,mobile}.png`) · merged: analysis API and result type (`designAnalysisResultSchema`, `LOW_CONFIDENCE`-style threshold constant in `design-analysis.ts`, #340), the analysing screen (#341, which links to the design when `done` until this screen exists), the design picker (`features/design-picker`: `FieldChoice`, `FieldMulti`, `FieldNumber`, `specOptions`, `useEditorStore`, `draftKey`, `acceptDraft`)

### Approach

Use the `add-page` skill. A new feature `apps/web/src/features/confirm-design/` and the route `/designs/[id]/confirm`. The analysing screen's "done" state navigates here (replace the interim link in `AnalysisPanel`).

- **Data:** `use-design-analysis` reads `GET /api/designs/:id/analysis` (the hook of #341 `use-analysis-status` is reused through the `upload-design` feature's `index.ts`; if it is not exported, export it there). `status: done` gives `result: { category, spec, confidence, notes, unsupported }`; `none|pending` redirects to `/designs/[id]/analysing`; `failed` shows the failed state with "use the manual picker" and "try again".
- **Screen (`ConfirmScreen`):** the layout of `Confirmation.dc.html`: a summary header (category and its confidence), the features grouped by the picker's sections (`sectionsFor(category)`), each feature as an option card reusing the picker's card components through `design-picker`'s `index.ts` (export `FieldChoice`/`FieldMulti`/`FieldNumber` if missing; do not copy them). The AI's value is preselected and tagged "AI"; a feature with confidence **below 0.6** (the constant from the schema) is highlighted ("please check") and starts **unconfirmed**; confirming means choosing a value or pressing "Looks right" on that card. The AI notes appear under their feature. Features outside the catalogue are listed in a "not supported yet" panel (FR-DES-07) with the AI's text in the user's language.
- **Editing (FR-DES-05):** every feature stays editable from the catalogue (`specOptions(spec)`); a change goes through the engine's rules like the picker (`withFeatureValue` + `normalizeSpec` from `@tafsila/engine/spec-rules`) so incompatible features are corrected and the "we changed X" notice shows (`ResetNotice` pattern). A local reducer in `model/confirm-state.ts` holds `{ spec, confirmed: Set<FeaturePath>, touched }` (pure, tested); it is local UI state, not server data (no Zustand).
- **Continue:** enabled when every low-confidence feature is confirmed (a count "2 left to check" otherwise). "Continue" writes the confirmed spec as the **editor's browser draft** for this design (`writeJson(draftKey(designId), { spec, baseSpec: serverSpec })`, the same mechanism the picker uses; `serverSpec` = `defaultSpec(category)` as `useEditorFrame` computes it) and navigates to `/designs/[id]/pattern`, where `hydrate` picks the draft up, so saving a version works exactly as for a manual design. To avoid reaching into the store's private key, `design-picker` exports one function `seedEditorDraft(designId, category, spec)`; the confirm feature calls only that (add it with a test).
- **Failure and edge states:** analysis failed or low overall confidence (more than half of the features below 0.6) shows a banner "check every feature"; a design whose analysis category differs from `design.category` uses the analysis category (PATCH is not needed: the pattern page and the editor read the category from the spec); back to photos link.
- **Messages:** `confirmDesign.*` ar/en (titles, tags, counts, banners, errors). Feature and option labels come from the picker's existing messages (no duplication). Merna reviews the Arabic.

### Files

Create: `apps/web/src/features/confirm-design/{index.ts, ConfirmScreen.tsx, components/*, hooks/*, model/{confirm-state.ts, feature-groups.ts, confidence.ts}}` (+ tests), page `app/[locale]/(dashboard)/designs/[id]/confirm/page.tsx`, `apps/web/e2e/confirm-design.spec.ts`, `docs/test-cases/ui/342-confirm-design.md`, `docs/decisions/342-confirm-design.md`, screenshots under `docs/test-cases/ui/screenshots/342/`.
Change: `features/design-picker/index.ts` (export the field components and `seedEditorDraft`), `features/upload-design` (`AnalysisPanel` done state navigates to confirm; export the status hook), `messages/{ar,en}.json`, `docs/frontend/README.md`, `docs/CONTEXT_MAP.md`, glossary, learning log.

### Test plan

- **`confirm-state` unit:** initial state marks only features with confidence < 0.6 as unconfirmed; "looks right" confirms; changing a value confirms it and runs the rules (changing `skirt.type` away from `circle-half` resets the dependent field and lists it in the notice); continue is disabled until the low-confidence set is empty; features absent from `confidence` are treated as confirmed-by-default (the model gave none).
- **`seedEditorDraft` unit:** writes a draft that `acceptDraft` accepts for the same server spec and the editor store hydrates from it; a draft made from another server spec is ignored (existing behaviour kept).
- **Component:** low-confidence cards are highlighted and show the AI note; the unsupported panel lists texts in the right language; "2 left to check" counter; failed state; redirect when `pending`.
- **E2E (ar-desktop full; en smoke) with the fake provider:** sign up, upload a fixture photo (from #341), analyse, land on confirm, see highlighted cards, confirm them, change one feature, continue, see the pattern page showing the confirmed spec's pattern, and save a version (reuse the pattern-versions helpers); back to photos works.
- **Screenshots:** confirm screen (with highlights; all confirmed; failed), ar/en, mobile and desktop.

Manual test cases (draft): TC-UI-342-01 low-confidence features must be confirmed; 02 change a feature and see the rules notice; 03 unsupported features listed; 04 failed analysis state; 05 continue opens the pattern page with the same design; 06 reload on confirm keeps the analysis; 07 mobile RTL; 08 English LTR; 09 (after #347) real analysis of a dress photo on staging.

### Decisions to log (`docs/decisions/342-confirm-design.md`)

1. The confirmed spec travels to the pattern page as the editor's browser draft through one exported function; no new API and no new column (a PATCH of the design's spec is a later decision if drafts prove fragile across devices).
2. Features without a confidence value count as confirmed.
3. "Continue" waits only for low-confidence features, not for every feature.
4. The analysis category wins over the chosen category when they differ.

None is costly to reverse.

### Risks

- **Browser draft is per device:** the user finishes the flow on one device (acceptable before the beta; a stale draft is ignored by `acceptDraft`).
- **Reuse of picker components** may need small prop additions: keep them backwards compatible and tested in the picker's own tests.
- **Shared picker feature files:** merge main before the PR; only `index.ts` exports and one new helper change there.

### Labels and needs

Size M, `plan:sonnet`, `build:sonnet` stay. `needs-interactive` on the planned files: run below.

## Deviations

- Photo thumbnails of `Confirmation.dc.html` are not shown: the screen has no signed photo URLs yet (decision 342, item 6).
- Hooks: `use-design-analysis` was not created; `useAnalysisStatus` (upload-design) is reused directly.
- The picker exports also `EditorNotice`, `rawFeatureEdit`, `currentChoice`, `fromCard`, `sectionsFor`, `SECTION_PATHS` (`currentChoice`/`fromCard` moved from `SectionPanel` to `model/spec-path.ts`).
