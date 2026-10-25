# Plan: #252 version history, open and restore

Copy of the approved plan comment (https://github.com/merna550/tafsila/issues/252#issuecomment-6274023213).

Plan wave M3, 2026-10-19. Planned with #251 (pattern page) and #247: routes, editor store contract and save states are fixed in the #251 plan. Follows [ADR-236](../decisions/236-m3-scope.md) items 2, 3 and 7. UI must match the pattern page screen in `docs/design/screens/` once #236 lands (not in the repo yet).

### Approach

Extends the `features/pattern-versions` feature that #251 creates (data hooks already there); no new feature folder, so the page imports one feature and there is no import cycle.

- **List.** `VersionHistoryPanel({ designId, currentVersionId, onOpen, onRestore })` in the page's history slot: newest first, paged (`useVersions(designId)`, `useInfiniteQuery`, key `["versions", designId]`). Each row: "Version N", date (Western digits), client and size label, ease name, status icon with text (pass / warn), engine version; the current version is marked.
- **Engine notice.** A row and the read-only banner show "made with engine X, now Y" when `version.engineVersion !== ENGINE_VERSION` (`@tafsila/engine` constant; same deploy as the server). The read-only view also honours the server flag from `GET /api/versions/:id`.
- **Open read-only.** `onOpen` → `router.push("/designs/<id>?v=<versionId>")` (#251 route). In read-only mode the page hides the editor and options, shows the viewer (#243/#248) and report (#249) from the `PatternResult` that `GET /api/versions/:id` returns (no worker run), and a banner "Viewing version N (read only)" with "Restore" and "Back to current" (`router.push("/designs/<id>")`). The editor store is not touched.
- **Restore.** `useRestoreVersion` → `POST /api/versions/:id/restore` → response version → `editor.load({ spec, options: fromVersion(v), baseVersion })` (#247 `fromVersion`, #251 store), invalidate `versionKeys.all` and the design, `router.replace("/designs/<id>")`, toast "Restored as version N" (N from the response; if the server returned an existing version, "Already version N"). When the editor is dirty, a confirm dialog first ("Your unsaved changes will be lost"). After restore the page's save state is computed as usual (#251): `saved`, or `outdated` when the set or engine changed since.

### Files

Create, under `apps/web/src/features/pattern-versions/`:

- `components/VersionHistoryPanel.tsx`, `components/VersionRow.tsx`, `components/ReadOnlyVersionBanner.tsx`, `components/version-history.test.tsx`
- `hooks/use-versions.ts`, `hooks/use-restore-version.ts` (+ `hooks/*.test.ts`)
- `model/version-view.ts` + `.test.ts` (`versionRowView(version, currentVersionId)`: labels, status icon key, `engineChanged`)
- `docs/test-cases/ui/252-version-history.md`
- `packages/test-fixtures/src/pattern-versions.ts`: two version summaries for `seedDress` (one with the current `ENGINE_VERSION`, one with an older string such as `"0.0.1"`) and one version detail; export from the package index.

Change:

- `apps/web/src/features/pattern-versions/index.ts`: export `VersionHistoryPanel`, `ReadOnlyVersionBanner`, `useRestoreVersion`.
- `apps/web/src/features/pattern-page/PatternPageScreen.tsx` and `hooks/use-pattern-page.ts`: history slot and read-only mode when `versionId` is set (#251 already passes it).
- `apps/web/e2e/pattern-page.spec.ts`: history test (below); `apps/web/e2e/support/pattern.ts`: `openVersion(page, n)`, `restoreVersion(page)` → new number.
- `apps/web/messages/{ar,en}.json`: `versionHistory.*`.

### Data / API

No endpoint change. Uses `GET /api/designs/:id/versions`, `GET /api/versions/:id`, `POST /api/versions/:id/restore` (#245). Row fields read: `id, versionNo, createdAt, sizeLabel, easeProfile, validationStatus, engineVersion, clientName`. If #245's list has no client name, add `clientName` (nullable, join set → client) to that list response, its OpenAPI and Postman in this PR.

### Tests

- Unit `version-view.test.ts`: current version marked; old engine fixture gives `engineChanged: true`; `warn` gives the warn icon key and text.
- Component (fixtures, mocked hooks): list renders 2 rows newest first; "Open" pushes `?v=<id>`; read-only banner shows the version number and the engine notice for the old fixture; restore calls the mutation and then `editor.load` with the restored inputs, and the toast shows the number from the response (3); restore while dirty asks first, cancel does nothing.
- **E2E** (extends #251's dress path, reused by #254, `ar` and `en`): after "save version 1", change ease to loose → save → version 2 → open version 1 from history → read-only banner and the report → Restore → toast "version 3" and the editor shows regular ease → reload → "Saved · version 3".

Manual test cases `docs/test-cases/ui/252-version-history.md`: TC-UI-252-01 list shows all saved versions; -02 open an old version read-only, nothing editable; -03 restore creates the next number; -04 restore with unsaved changes asks first; -05 seed version made with an older engine shows the notice (edit `engine_version` in Studio); -06 English, 360 px.

### Decisions (build writes `docs/decisions/252-version-history.md`)

1. History lives in `features/pattern-versions` with the version data hooks.
2. Opening a version is a URL (`?v=`), read-only, using the server's regenerated result; the editor store is untouched.
3. The engine notice compares with the browser's `ENGINE_VERSION`.
4. Restore with unsaved edits asks before replacing them; the shown version number always comes from the server's answer.

### Risks

- #237 has `unique (design_id, input_hash)` while #245 expects restore to create version n+1: restoring v1 when v1's hash is unchanged may return v1 instead of a new row. The UI shows whatever number the server returns; the conflict is for #245 to settle (flagged to Merna).
- Long histories: paged list, 20 per page.

**Size:** S (unchanged). **Build:** `build:sonnet` (unchanged). `needs-interactive`: no.

## Deviations

- The screens follow the approved design (`VersionHistory.dc.html`): a history page `/designs/[id]/versions` and a read-only page `/designs/[id]/versions/[versionId]`, not `?v=` on the pattern page. The editor store is still untouched by opening a version.
- The read-only view draws the version's stored inputs in the existing preview worker (the engine geometry cannot be built into the main bundle); the server's `pattern` field of `GET /api/versions/:id` is not used, only `engineChanged`.
- The history screens live in `features/pattern-page` (they write the page and editor stores on restore); `features/pattern-versions` holds the hooks and presentational pieces.
- No API change: the list rows have no client name; the design shows none per row. The read-only view finds the client through the version's measurement set.
- `@tafsila/engine/version` is a new subpath so the browser can read `ENGINE_VERSION` without the engine barrel.
- No shared fixtures package change; component tests use inline rows. Visual checks are left to #265.
