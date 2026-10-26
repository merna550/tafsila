## Plan: #289 export dialog with A4 PDF and SVG download (and the export worker protocol for #290)

Plan wave M4 (PDF family), 2026-10-25. Planned together with #282, #288, #290. This issue owns the worker protocol, the download helper and the dialog; #290 adds one kind (`a0`) and one dialog row. Depends on #281 (screens) and #288. **The build must match the export dialog in `docs/design/screens/` once #281 lands** (spacing, option rows, progress, buttons, mobile layout, copy); the file names, props and message keys below are fixed so the build does not guess. If the screen shows the Export button on the pattern page too, render the same `ExportButton` there disabled with the reason "save the version first" (ADR-281 item 1); no extra route.

### Approach

1. **Worker `apps/web/src/shared/pattern-export/`** (own module worker, own chunk, no new dependency; same shape as `shared/pattern-preview`, ADR-239). Files:
   - `protocol.ts`:
     ```ts
     type ExportKind = "a4" | "svg"; // #290 adds "a0"
     type ExportMeta = PdfMeta; // type import from @tafsila/export: { title, versionNo, clientLabel, engineVersion, createdAt }
     type ExportRequest = { id: number; kind: ExportKind; input: PreviewInput; meta: ExportMeta };
     type ExportMessage =
       | { id: number; progress: { done: number; total: number } }
       | {
           id: number;
           ok: true;
           kind: ExportKind;
           bytes: ArrayBuffer;
           mime: string;
           pageCount: number | null;
           durationMs: number;
         }
       | { id: number; ok: false; error: PreviewWorkerError }; // reuse the preview error shape
     type ExportOutcome = Exclude<ExportMessage, { progress: unknown }> | { id: number; stale: true };
     ```
     `bytes` is transferred, not copied. The SVG is UTF-8 text in the same field (`mime: "image/svg+xml"`); `pageCount` is null for SVG.
   - `export-handler.ts` (pure, no `self`): `runExport(request, deps: { loadFonts(): Promise<PdfFonts> }, onProgress): Promise<ExportMessage>`: `generatePattern(spec, measurements, options)` then `buildPatternScene`; `svg` -> `renderPrintSheet(result)`; `a4` -> `await deps.loadFonts()` then `buildA4Pdf(result, scene, meta, { fonts, onProgress })`. A table `BUILDERS: Record<ExportKind, Builder>` so #290 adds one entry.
   - `pattern-export.worker.ts`: `self.onmessage` -> `runExport` with `loadFonts` = `fetch("/fonts/IBMPlexSansArabic-Regular.ttf")` and Bold (cached in a module variable; failure maps to code `FONT_LOAD_FAILED`).
   - `export-client.ts`: `createExportClient(factory)` like `createPreviewClient`: `run(request, onProgress): Promise<ExportOutcome>`; a new `run` or `cancel()` resolves the old one as `{ stale: true }` and terminates + recreates the worker on `cancel()` (a PDF build cannot be interrupted otherwise); worker `onerror` -> `WORKER_FAILED`.
   - `export-error.ts`: `exportErrorToApiError(error)` reuses `previewErrorToApiError` for engine input errors and adds `FONT_LOAD_FAILED`, `PDF_BUILD_FAILED`, `WORKER_FAILED` (shared error display; entries added to `docs/errors.md`).
   - `worker-error.ts`: `toWorkerError` moved out of `pattern-preview.worker.ts` (both workers use it; not exported from `index.ts`, so it never reaches a page bundle).
   - `file-name.ts`: `exportFileName({ title, versionNo, kind }): string` -> `<title>-v<N>-A4.pdf` / `<title>-v<N>-A0.pdf` / `<title>-v<N>.svg`. Rules: replace `\\ / : * ? " < > |` and control characters with nothing, whitespace runs with `-`, trim `-`, keep Arabic letters and digits, cut the title at 60 characters (by code point), empty title -> `pattern`.
   - `download.ts`: `downloadBytes(bytes, fileName, mime)` (Blob + object URL + temporary `<a download>`, revokes the URL after a tick).
   - `use-pattern-export.ts`: `usePatternExport(createWorker = createBrowserExportWorker)` returns `{ state: ExportState; start(request); cancel(); reset() }`. Pure reducer in `export-state.ts`: `idle -> running(progress) -> done(fileName, pageCount, bytes) | error(ApiError)`; `cancel`/`reset` -> `idle`. The hook downloads automatically on `done` and keeps the bytes for "Download again" until the dialog closes. Worker created lazily on first `start` and terminated on unmount. `index.ts` exports the hook, state types, `exportFileName` and `exportErrorToApiError` only (no worker file).
2. **Feature `apps/web/src/features/pattern-export/`**:
   - `model/export-source.ts`: `exportSourceOf({ version, title, clientLabel }): { input: PreviewInput; meta: ExportMeta }` (from the stored `spec`, `measurements`, `options`, `versionNo`, `engineVersion`, `createdAt`); `model/export-options.ts`: `EXPORT_OPTIONS: readonly { kind: ExportKind; labelKey; hintKey }[]` (A4 first; #290 appends A0).
   - `components/ExportButton.tsx` (`{ source: ExportSource | null; disabledReason?: "needs-save" }`, opens the dialog, `aria-haspopup="dialog"`), `ExportDialog.tsx` (`{ open; onOpenChange; source; dir }`, uses the `packages/ui` dialog like `RestoreVersionDialog`), `ExportOptionList.tsx` (radio group), `ExportInstructions.tsx` (print at 100 % / "actual size", check the 10 cm square before cutting), `ExportProgress.tsx` (`role="progressbar"` with `aria-valuenow`, live status text, Cancel). Dialog states: choose -> running (options disabled, progress, Cancel) -> done ("N pages ready", the file starts downloading, "Download again", Close) -> error (shared error display: toast via `useApiErrorHandler`, dialog returns to choose with "Try again"). Closing while running cancels. Esc and focus return to the button are handled by the dialog primitive. `index.ts`: `ExportButton`, `ExportDialog`, `exportSourceOf`.
   - Mounted in `features/pattern-page/components/ReadOnlyVersionBody.tsx` (`PageHeader` actions, next to the badges) with `title` and the client label already used by `VersionInputs`. Cross-feature import only through the feature `index.ts`.
3. **PostHog**: add `pattern_exported` to `packages/schemas/src/analytics-events.ts` (strict: `kind: "a4"|"a0"|"svg"`, `pages: int >= 0`, no title, no measurements, no client); the hook calls `track("pattern_exported", { kind, pages: pageCount ?? 0 })` once per successful export. Schema test and the event list doc updated.
4. **Bundle guard**: `scripts/check-engine-chunk.mjs` gains marker groups `{ engine: ENGINE_MARKERS, pdf: PDF_MARKERS }`. `PDF_MARKERS` are two strings found by grepping the built worker chunk for pdf-lib and fontkit error messages (build step: find them in `node_modules/pdf-lib/cjs` and `@pdf-lib/fontkit` and confirm they survive minification in `.next/static`). Rule: each group must appear in at least one chunk (so the worker bundled it) and in no chunk loaded by a page manifest. Test in `check-engine-chunk.test.mjs` with fake `.next` folders (PDF marker in a page chunk fails; only in worker passes; missing in all fails). Also a dependency-cruiser rule in `.dependency-cruiser.cjs`: only `shared/pattern-export/export-handler.ts` and `*.worker.ts` may import `@tafsila/export` as a value (type imports are fine), and `apps/web/src` may not import `pdf-lib`.
5. **Messages** `patternExport.*` in `apps/web/messages/{ar,en}.json` (button, dialog title, `option.a4.label/hint`, `option.svg.label/hint`, instructions, progress, done with `{pages}`, download again, cancel, `needsSave`, errors); wording from the design and `docs/design/copy.md`. #290 adds `option.a0.*`.

### Files

Create: `apps/web/src/shared/pattern-export/{protocol,export-handler,pattern-export.worker,export-client,export-error,worker-error,file-name,download,export-state,use-pattern-export,index}.ts` and tests (`file-name.test.ts`, `export-client.test.ts`, `export-error.test.ts`, `export-state.test.ts`, `export-handler.test.ts`); `apps/web/src/features/pattern-export/{index.ts,model/export-source.ts,model/export-options.ts,components/*.tsx}` + tests; `apps/web/e2e/export-dialog.spec.ts`; `docs/test-cases/ui/289-export-dialog.md`; `docs/decisions/289-export-worker.md`. Change: `apps/web/src/shared/pattern-preview/pattern-preview.worker.ts` (import `toWorkerError` from the shared file), `apps/web/src/features/pattern-page/components/ReadOnlyVersionBody.tsx`, `apps/web/messages/{ar,en}.json`, `packages/schemas/src/analytics-events.ts` (+ test), `scripts/check-engine-chunk.mjs` (+ test), `.dependency-cruiser.cjs`, `docs/errors.md`, `docs/frontend/README.md` (new section "Export"), `docs/CONTEXT_MAP.md`, `docs/ARCHITECTURE.md` (web line: export worker).

### Data / API

No endpoint, no table (ADR-281 item 2). The worker regenerates the pattern from the version's stored inputs, independent of the page's preview (a second draft of a few tens of ms, so the export never depends on page state). Only schema change: the analytics event.

### Tests

- Unit (web, pure): `exportFileName`: `("فستان سهرة", 3, "a4") = "فستان-سهرة-v3-A4.pdf"`; `("a/b:c*?", 1, "svg") = "abc-v1.svg"` after stripping; `""` -> `pattern-v2-A4.pdf`; a 100-character title is cut at 60 without splitting a surrogate pair; a title of only forbidden characters falls back to `pattern`.
- Unit: client: a second `run` resolves the first as stale and its late answer is dropped; progress messages reach the callback only for the live id; `cancel()` resolves stale and recreates the worker; worker `onerror` -> `WORKER_FAILED`; `exportErrorToApiError` maps `FONT_LOAD_FAILED` and an engine input code to the expected `ApiError` placement. Reducer: all transitions including cancel while running and a late `done` after `cancel` being ignored.
- Unit: `runExport` on the seed dress M (test fonts from `apps/web/public/fonts` via `fs`): `svg` text starts with `<svg` and has `width="...mm"`; `a4` bytes start with `%PDF-` and `pageCount` equals the page count read back with `read-pdf`; an invalid spec returns `ok: false` with the engine code; a failing `loadFonts` returns `FONT_LOAD_FAILED`.
- Server-render: dialog markup in `ar` and `en` (option rows, instructions text, `dir`), disabled button with reason, progress `aria-valuenow`.
- Build guard: `check-engine-chunk.test.mjs` cases above; the e2e web server command already runs the guard after `pnpm build`, so the real build proves `pdf-lib` is only in worker chunks.
- E2E Playwright (`ar` and `en`, desktop and mobile; seeded dress version created with the same helper `pattern-page.spec.ts` uses): open the version view -> Export -> choose A4 -> wait for `download`; file name matches `-v<N>-A4.pdf`; bytes start with `%PDF-`; page count (count of `/Type /Page` objects, object streams are off) equals the "N pages" text shown in the dialog; the dialog states "100 %"; export SVG -> file starts with `<svg` and has `mm` width; Cancel during a build returns to the options and no download happens; close with Esc returns focus to the button; no horizontal overflow at 390 px. Worker failure (route-block `/fonts/*`) -> error display with Try again.
- Manual cases `docs/test-cases/ui/289-export-dialog.md`: TC-UI-289-01 A4 download and open; -02 SVG opens in a browser; -03 file name with an Arabic title; -04 cancel; -05 font blocked/offline message; -06 phone 360 px; -07 keyboard only; -08 English. Print accuracy is #295.

### Docs

`docs/frontend/README.md` (Export section: worker protocol, flow, bundle rule), `docs/errors.md`, `docs/CONTEXT_MAP.md`, `docs/ARCHITECTURE.md`, `docs/test-cases/index.md`, analytics event list. JSDoc on every function, component and type.

### Decisions (build writes `docs/decisions/289-export-worker.md`)

1. The export worker is separate from the preview worker and re-drafts the pattern from the version's stored inputs; the page's preview is not reused.
2. Fonts are fetched by the worker from `/fonts/` when export starts (not bundled); a fetch failure is a clear error with retry.
3. Protocol: `ExportRequest`/`ExportMessage` above, bytes transferred, progress as separate messages, latest request wins, cancel recreates the worker. #290 only adds `"a0"`.
4. The dialog starts the download itself when the build finishes and keeps the bytes for "Download again" until close; nothing is stored anywhere (ADR-281 item 3).
5. File names: `<title>-v<N>-A4.pdf`, `-A0.pdf`, `<title>-v<N>.svg`, Arabic kept, unsafe characters dropped, 60-character cap.
6. `pattern_exported` carries only kind and page count.
7. The bundle guard checks marker groups (engine, pdf), both must be in a worker and in no page.

### Risks

- Next.js may inline `pdf-lib` into a shared chunk used by both workers: fine for the guard (workers are not in page manifests); if a page ever loads it the guard fails, which is the point.
- Object URL downloads on iOS Safari open the PDF in a tab instead: acceptable, the dialog's "Download again" works; record in the manual case.
- A cancelled build leaves a recreated worker that must refetch fonts: acceptable, browser-cached.
- Screens (#281) not merged yet: the build starts only after them; spacing, icons and states follow `docs/design/screens/`.
- Playwright download of a worker-made Blob: if flaky twice, assert on the `download` event's suggested file name and a size, and note it in the PR (unattended rule).

**Size:** M (unchanged). **Build:** `build:sonnet` (unchanged). `needs-interactive`: no.

## Deviations

- The "Export" button is mounted in `UseVersionBar` through a new `actions` slot (the bar lives in `features/pattern-versions` and may not import another feature); `ReadOnlyVersionBody` passes `VersionExportButton`, a small component in `features/pattern-page` that finds the client name and builds the source. The disabled "save the version first" button exists in `ExportButton` (null source) but is not mounted: the pattern page has no "use this version" bar yet (the projector button is not there either).
- `toWorkerError` moved to `shared/pattern-preview/worker-error.ts` (next to the protocol types both workers share).
- The dialog follows the approved screen: the error is an inline alert with Close / Try again (no toast; the error is still reported through `useApiErrorHandler` for unexpected cases), the finished state keeps the print note and offers "Download again". The A0 row of the screen is added by #290; the A4 hint does not state a page count because it is only known after the build ("12 pages" appears in the done message).
- Extra export code `PATTERN_INVALID`: the worker refuses a version whose pattern does not pass validation instead of building a PDF from it (saved versions are never `fail`, so this is a safety net).
- Dependency-cruiser cannot resolve workspace packages, so the rule matches the module name `@tafsila/export`; it allows `export-handler.ts`, `protocol.ts` (type imports only) and `*.worker.ts`.
- PDF markers: "Failed to parse PDF literal string due to unbalanced parenthesis" (pdf-lib) and "Calling transform done when still transforming" (fontkit's stream code).
