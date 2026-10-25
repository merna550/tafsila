# Plan: #244 design picker frame, category step and editor store

## Plan: #244 Design picker frame, category step and editor store

Plan wave M3 (planned together with #246 and #250 so store, routes and folders match). [ADR-236](../decisions/236-m3-scope.md) items 8, 10. The screens (#236) are not in the repo yet: the build must match `docs/design/screens/` once #236 lands; names below are fixed so builds do not guess.

### Approach

New feature `apps/web/src/features/design-picker/` (four layers, style model: `features/clients/`). It owns the editor store, the category step, the editor frame and (in #246) the feature sections.

- **Routes** (thin pages in `apps/web/src/app/[locale]/(dashboard)/designs/`): `new/page.tsx` -> `<CategoryStepScreen />` (reads `?clientId=` and passes it on); `[id]/page.tsx` -> `<DesignEditorScreen id />` (frame only; #251 later swaps this page's composition and adds viewer, options panel and save). `/designs` itself is #250.
- **Category step**: three `OptionCard`s (dress, skirt, blouse; `OptionCardGroup`, #240) built from `designSpecSchema` category values. Choosing one calls `useCreateDesign` (`POST /api/designs { category }`, #242) then `router.replace("/designs/<id>" + (clientId ? "?clientId=<clientId>" : ""))`. The new design starts at `defaultSpec(category)` (#238) in the store.
- **Editor store** (Zustand, ADR-011; add `zustand` to `apps/web` with `pnpm add`): holds editing state only, never server data (rule: `.claude/rules/frontend/state-and-forms.md`).
  ```ts
  interface EditorState {
    designId: string | null;
    spec: DesignSpec | null; // the spec being edited
    baseline: DesignSpec | null; // last loaded or saved spec (dirty = spec differs from baseline)
    previous: DesignSpec | null; // one-level undo
    resetPaths: FeaturePath[]; // paths normalizeSpec changed on the last setFeature (the notice)
    hydrate(designId: string, spec: DesignSpec): void; // loads server spec, or the local draft when its baseSpec deep-equals spec
    setFeature(path: FeaturePath, value: unknown): void; // set -> normalizeSpec -> notice; value undefined removes an optional field
    undo(): void; // restores `previous`, clears notice
    markSaved(spec: DesignSpec): void; // baseline = spec, clears draft (called by #251)
    dismissNotice(): void;
  }
  ```
  `FeaturePath`, `normalizeSpec` (returns `{ spec, changed }`), `specOptions`, `defaultSpec` come from `@tafsila/engine` (#238). The pure part (path get/set, immutable update, dirty check) lives in `model/spec-path.ts` and `model/editor-state.ts` (no React, no Zustand) and the Zustand store in `hooks/use-editor-store.ts` only wires it. `pockets` is one path whose value is the full array. Selector `selectIsDirty`.
- **Draft in browser storage**: key `tafsila.editor-draft.<designId>`, value `{ spec, baseSpec }`, written on every change, removed on `markSaved`. All access through a small guarded `shared/storage/safe-storage.ts` (`readJson`, `writeJson`, `remove`, all try/catch, returns null on failure); reuse it if one exists.
- **Sections nav**: `model/sections.ts` has `SECTION_ORDER = ["bodice","neckline","sleeve","skirt","waistband","closure","pockets","extras"]`, `SECTION_PATHS: Record<SectionId, FeaturePath[]>`, and `sectionsFor(options: SpecOptions): SectionId[]` which keeps a section when any of its paths has `applies: true`. So a skirt has no bodice, neckline or sleeve and no category rule is repeated in the UI. `components/SectionNav.tsx` (stepper on phone, side list on desktop, with a summary of chosen values from `model/spec-summary.ts`) and `components/SectionPanel.tsx`: in this issue a stub that shows the section title; #246 replaces its body. Active section in the URL `?section=<id>`.
- **Frame**: `DesignEditorScreen` (feature root, like `ClientProfileScreen`) loads the design with `useDesign(id)` (`GET /api/designs/:id`), calls `hydrate` once, shows `SectionNav`, `SectionPanel`, the reset notice (toast-like banner with "undo", text from engine paths) and `slot` area for #251 (`children` prop).
- **Engine import and bundle**: #239 requires the engine out of the main bundle. Spec rules must not drag the geometry code into the picker. Add a subpath export `"./spec-rules": "./src/spec-rules/index.ts"` in `packages/engine/package.json` (if #238 has not) and import only from it in the web app; record the picker route chunk size in the PR. If the chunk still contains geometry, load the picker routes lazily and note it (do not block).

### Files

Create (web): `features/design-picker/{index.ts,CategoryStepScreen.tsx,DesignEditorScreen.tsx}`, `components/{CategoryStep,SectionNav,SectionPanel,ResetNotice}.tsx`, `hooks/{use-editor-store.ts,use-create-design.ts,use-design.ts,query-keys.ts}`, `model/{spec-path,editor-state,sections,spec-summary}.ts` (+ `.test.ts`), `components/design-picker-components.test.tsx`; `shared/storage/safe-storage.ts` (+ test); `entities/design/design-keys.ts` (first of #244/#250 to land creates it: `designKeys = { all: ["designs"], list(params), detail(id) }`; the other reuses it); routes `app/[locale]/(dashboard)/designs/new/page.tsx` and `designs/[id]/page.tsx`; `messages/{ar,en}.json` (namespace `designPicker`: `category.{dress,skirt,blouse}`, `sections.<id>`, `notice.reset`, `undo`, `title`); `apps/web/e2e/design-picker.spec.ts`; `docs/test-cases/ui/244-design-picker-frame.md`.
Change: `apps/web/package.json` (+ zustand), `packages/engine/package.json` (subpath, if missing), `docs/SRS.md` (FR-DES-06 status), `docs/frontend/README.md` (editor store paragraph), `.dependency-cruiser.cjs` only if `entities/` is not yet covered.
Read first: its `docs/CONTEXT_MAP.md` row, the merged #238, #240, #242 code and plans.

### Data / API

Uses `POST /api/designs`, `GET /api/designs/:id` from #242 through `shared/api` (`apiRequest` + schemas `designSchema`, `createDesignBodySchema` from `@tafsila/schemas`). No new endpoint.

### Tests

- Store/model unit: `setFeature("sleeve.type","puff")` sets and marks dirty; setting a value that `normalizeSpec` changes (dress with `waistSeam:false` and `skirt.type:"gathered"`) gives `resetPaths:["skirt.type"]`; `undo` restores exactly the previous spec; `markSaved` clears dirty; `hydrate` uses a draft only when `baseSpec` equals the server spec; `sectionsFor(specOptions(defaultSpec("skirt")))` has no `bodice`, `neckline`, `sleeve`; blouse has no `skirt`; dress has all of them.
- Storage: a throwing `localStorage` leaves the editor working (no draft).
- Component: choosing "dress" calls create with `{category:"dress"}` and navigates with `clientId`; section nav shows the summary; notice shows reset paths with an undo button.
- e2e (ar and en, 360 px): `/designs/new?clientId=<seed>` -> dress -> editor opens, reload keeps the section.
- Manual cases (file above): TC-DESIGN-244-01 start each category; -02 reset notice and undo; -03 reload keeps draft; -04 RTL and 360 px; -05 API error on create shows the shared error display.

### Decisions (build writes `docs/decisions/244-editor-store.md`)

1. Store holds spec, baseline and a one-level undo only; server data stays in TanStack Query; dirty = spec differs from baseline.
2. Sections are derived from `specOptions(...).applies`, never from a second category table.
3. Routes: `/designs/new?clientId=`, `/designs/[id]?clientId=&section=`; the design is created when the category is chosen (an unused design can exist; deleting is in #250).
4. Draft key `tafsila.editor-draft.<designId>`, used only when it matches the loaded spec.
5. Spec-rules are imported from the engine subpath `@tafsila/engine/spec-rules` to keep the engine out of the main bundle.

### Risks

- #236 screens may change the step layout: logic and names stay, only components change.
- #240 `OptionCard` props and the #242 schema names are assumed; read the merged code and adjust names in this plan's files, not the design.
- A created design is empty until the first version is saved (#251); #250 shows it as "no version yet".

**Size:** M (unchanged). **Build:** `build:sonnet` (unchanged). `needs-interactive`: no (`node scripts/needs-interactive.mjs` on the files above: no).

## Deviations

- `GET /api/designs/:id` returns `{ design, currentVersion }`, so `useDesign` parses `designDetailSchema` and the store starts at the current version's spec, or `defaultSpec(category)` for a design without a version.
- Summary in the section list is a done mark (section differs from `defaultSpec`), not value text: option labels arrive with the option cards in #246 (`spec-summary.ts` becomes `customisedSections`).
- A dress has no waistband section (`waistband` does not apply to a dress in the engine rules), so "all sections" is "all except waistband".
- `setFeature` takes `FeatureValue | string[]` (an array only for `pockets`); removing an optional field with `undefined` was not needed.
- No `hooks/query-keys.ts`: the keys live in `entities/design/design-keys.ts` as the plan allows.
- A pants card is drawn disabled with "soon" as in the approved screen.
- Engine: `SLIT_SKIRT_TYPES` moved to `constants/skirt-style.ts` because the picker rules imported it from the skirt rule module, which pulled the geometry kit into the page bundle. `scripts/check-engine-chunk.mjs` now looks for geometry messages ("Segment has zero length", "No cap height fits a") instead of error codes, because the codes legitimately appear in the picker rules.
- Visual baselines are not added (no Docker here); tracked in #265.
