## Plan #320: Admin fabric catalogue and rules editor

plan:sonnet · build:sonnet · size M (unchanged) · M5 wave 4 · FR-REC-03, FR-ADM-02, NFR-04 · Screens: `AdminFabrics.dc.html`, `AdminFabricEdit.dc.html` (+ images) · API from #317 (`/api/admin/fabrics`, `/api/admin/fabric-rules`) · pattern: `features/admin-sizes` (ADR-32b)

### Approach

Use the `add-page` skill. A new feature `apps/web/src/features/admin-fabrics/` and two pages under `app/[locale]/(admin)/admin/`. Non-admins already get the not-found page from the `(admin)` layout (ADR-32a item 11), which is re-checked by the API (403).

- **Pages:** `admin/fabrics/page.tsx` (list + edit drawer or page as the screen shows) and `admin/fabric-rules/page.tsx`; link both from the admin shell navigation (`features/admin-shell`).
- **Fabrics screen:** list (Arabic/English names, property scales as small bars), add/edit form (names, five property selectors 0 to 4 with `stretch` fixed to 0 and disabled in v1, care notes in both languages), delete with confirmation. Form with React Hook Form + the shared `fabric` schema from `@tafsila/schemas`; the API's `422` details map to fields.
- **Rules screen:** list by priority; edit form where the **condition is picked from `RULE_PATHS`** (path dropdown, then op, then values from the allowed list of that path, never free text; exported from `@tafsila/fabric-kb`); effect (property, min/max, `prefer`/`must`), priority 1 to 5, reason ar/en.
- **Preview box:** a fixture design picker (a small list of `@tafsila/test-fixtures` designs bundled as constants; or the shared `DesignSpec` fixtures through a light `model/preview-designs.ts`) plus `recommend` from `@tafsila/fabric-kb` run **in the browser** on the draft catalogue/rules (database rows with the unsaved edit applied) so the effect is visible before saving. `@tafsila/fabric-kb` is pure and tiny, so no worker is needed.
- **Hooks (`hooks/`):** `use-admin-fabrics`, `use-admin-fabric-rules` (list), `use-save-fabric`, `use-delete-fabric`, same for rules, invalidating the lists; every error through `ApiError` and the toast/inline placement rules (`placementFor`).
- **Audit** is written by the API; the UI states in a note that changes are logged.
- **Messages:** `admin.fabrics.*` and `admin.fabricRules.*` in ar/en; property and operator labels from the shared label map of #319 (`features/fabric` exports it through its `index.ts`; if #319 is not merged yet the builder defines it in `features/fabric/model` and #319 reuses it, whichever lands first).

### Files

Create: `apps/web/src/features/admin-fabrics/{index.ts, AdminFabricsScreen.tsx, AdminFabricRulesScreen.tsx, components/*, hooks/*, model/*}` with tests; the two pages; `apps/web/e2e/admin-fabrics.spec.ts`; `docs/test-cases/ui/320-admin-fabrics.md`; `docs/decisions/320-admin-fabrics-ui.md`; screenshots under `docs/test-cases/ui/screenshots/320/`.
Change: admin shell nav, `messages/{ar,en}.json`, `docs/frontend/README.md`, `docs/CONTEXT_MAP.md`, `docs/backend/tutorials/make-a-user-admin.md` cross-link if useful, glossary, learning log.

### Test plan

- **Model unit:** condition builder only offers `RULE_PATHS` values; changing the path resets the values; draft rule to API input mapping; preview applies an unsaved edit over the loaded rows; sorting by priority.
- **Component:** fabric form validation (missing Arabic name, property out of range), 422 mapped to the field, delete confirmation, the preview updates when a rule's priority changes, the condition picker cannot produce an unknown value.
- **E2E (ar-desktop; en smoke):** as the seeded admin (use the e2e admin helper from `admin-sizes`/`admin-users` specs), open `/admin/fabrics`, edit a fabric's Arabic name, then open a saved version's recommendations and see the new name (acceptance criterion); add and delete a fabric; edit a rule and see the preview change; a non-admin user gets the not-found page on both URLs.
- **Screenshots:** ar/en, mobile/desktop for the list and edit screens.
- Manual test cases (draft): TC-UI-320-01 add fabric; 02 edit; 03 delete; 04 edit rule; 05 preview before saving; 06 non-admin not found; 07 audit row visible in the database after a save; 08 mobile RTL.

### Decisions to log (`docs/decisions/320-admin-fabrics-ui.md`)

1. Preview runs `recommend` in the browser on the unsaved rows (pure package, no new API).
2. Preview designs are bundled fixtures, not the admin's own designs (privacy: admins never see user data, ADR-32a item 4).
3. `stretch` is shown disabled at 0 in v1.
4. Deleting a fabric or rule is a hard delete with a confirmation (audit keeps the before value).

None is costly to reverse.

### Risks

- **Bundling fixtures into the admin chunk:** import them only in the admin preview module so the main bundles stay small (check the bundle guard).
- **Two screens in one build run:** fabrics first, push a checkpoint, then rules (ADR-032).
- **Admin e2e needs an admin user:** reuse the existing e2e admin helper; if absent in staging, the e2e runs on CI only.

### Labels and needs

Size M, `plan:sonnet`, `build:sonnet` stay. `node scripts/needs-interactive.mjs` on the files above: `no`.

## Deviations

- The edit form is a page (`/admin/fabrics/new`, `/admin/fabrics/[id]`) as in the design; the rules are edited in a dialog (the design's third state), so there is one rules page and no rule routes.
- The design's "local market name", "type" and "default reason" fields are not in the shared fabric schema, so the form has the schema's fields only: names, care notes in both languages, the four properties and the reviewed flag.
- Levels are stored 0 to 4 and shown 1 to 5, as in the design (ADR-320 item 5).
- `features/fabric` now exports `LevelDots` (extracted from `PropertyMeter`), `fabricName`, `fabricAltName`, `pickLocalized`, `SHOWN_PROPERTIES`, `METER_STEPS` and `fabricKeys` through its `index.ts`, so the admin feature reuses them.
- `packages/ui` `Select` gained an optional `aria-label` (the dialog has selects without a visible label).
- `@tafsila/test-fixtures` moved from `devDependencies` to `dependencies` of `apps/web` (the preview designs) and got `"sideEffects": false` so only the used fixtures are bundled; `@tafsila/fabric-kb` was added to `dependencies` and `transpilePackages`.
- The admin menu highlights "Fabrics and rules" on both `/admin/fabrics` and `/admin/fabric-rules` (`alsoActiveOn`).
