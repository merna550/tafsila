# Plan #341: Upload photos and start the analysis

plan:sonnet · build:sonnet · size M (unchanged) · M6 wave 2 · FR-DES-01, FR-DES-02, NFR-02, NFR-05, NFR-06 · ADR-335 item 6 · Screens: `PhotoUpload.dc.html`, `Analysing.dc.html` (+ images) · API merged: `POST/GET/DELETE /api/designs/:id/photos` (#339); `POST /api/designs/:id/analyze` and `GET /api/designs/:id/analysis` come with #340 (build the UI against the Zod schemas of #339/#340 and the memory/fake setup; this issue is built after #340 merges, see Risks)

### Approach

Use the `add-page` skill. A new feature `apps/web/src/features/upload-design/` (the architecture doc already names it) with the photo step and the analysing state.

- **Flow:** the new-design screen gets a "From photos" entry beside the manual picker. Route `/designs/new/photos`: choose the category (dress, skirt, blouse or "let the AI decide"; unsupported categories show "coming soon" and the manual picker link), add photos, start. "Start" creates the design (`POST /api/designs` with the category when chosen), gets signed URLs (`POST /api/designs/:id/photos`), uploads, calls `POST /api/designs/:id/analyze`, then goes to `/designs/[id]/analysing`, which polls `GET /api/designs/:id/analysis` (2 s interval, stops on `done|failed`; a 45 s "this is taking longer" note; retry on failed; "use the manual picker instead" link). On `done` it navigates to `/designs/[id]/confirm` (#342 builds that page; until then the page shows the done state with a link to the design).
- **Photo slots:** front (required), back, side; JPG/PNG/WebP/HEIC, ≤ 10 MB **before** resize; drag-and-drop and the camera/gallery picker (`accept` with `capture` off so the gallery is available on phones); a thumbnail, replace and remove per slot; the privacy note from the screen.
- **Resize, strip, convert (`shared/image-prepare/`, a Web Worker):** `prepareImage(file)` decodes with `createImageBitmap` (EXIF orientation applied by `imageOrientation: "from-image"`), scales to ≤ 1600 px on the long edge, re-encodes to JPEG (quality 0.85) with `OffscreenCanvas.convertToBlob`; the re-encode drops all metadata including GPS (NFR-05). **HEIC:** browsers that can decode it (Safari) go through the same path; others get the message "this browser cannot read HEIC photos: share the photo as JPEG" (no HEIC library: licence and size). A main-thread canvas fallback runs when `OffscreenCanvas` is missing. The output size is checked ≤ 10 MB (the signed upload also enforces it).
- **Upload:** `PUT` of each blob to its signed URL with progress (`XMLHttpRequest` upload progress in `shared/api` upload helper; the only place a non-JSON request is made), retry per slot (2 retries, backoff), cancel. Failed upload shows the slot error and keeps the others.
- **State:** `hooks/use-photo-slots.ts` (slots, status per slot), `use-start-analysis.ts` (create → upload → analyze with TanStack Query mutations), `use-analysis-status.ts` (polling query). Models in `model/` (pure: slot rules, file validation, status mapping), all with tests.
- **Messages:** `uploadDesign.*` ar/en (labels, slot names, privacy note, errors per API code, analysing copy, HEIC message). Merna reviews the Arabic.

### Files

Create: `apps/web/src/features/upload-design/{index.ts, PhotoStepScreen.tsx, AnalysingScreen.tsx, components/*, hooks/*, model/*}`, `apps/web/src/shared/image-prepare/{prepare-image.ts, image-prepare.worker.ts, client.ts}` (+ tests), pages `app/[locale]/(dashboard)/designs/new/photos/page.tsx` and `designs/[id]/analysing/page.tsx`, `apps/web/e2e/upload-design.spec.ts`, `docs/test-cases/ui/341-upload-design.md`, `docs/decisions/341-upload-design.md`, screenshots under `docs/test-cases/ui/screenshots/341/`.
Change: the new-design entry (`features/design-picker` category step gets the "From photos" link through its `index.ts`), `shared/api` (upload helper with progress), `messages/{ar,en}.json`, `docs/frontend/README.md`, `docs/CONTEXT_MAP.md`, glossary, learning log.

### Test plan

- **`prepareImage` (jsdom cannot decode images: run the pure parts in Vitest and the real decode in the e2e):** the scaling maths (3000×2000 → 1600×1067; a 1200 px image is not enlarged), the quality/size check, the HEIC capability branch with a stubbed decoder, and a pure `hasExif(bytes)` helper used by the e2e's fixture check. **Browser test in e2e:** a fixture JPEG with a GPS EXIF block is prepared and the uploaded object has no `Exif` marker and is ≤ 1600 px (acceptance criterion).
- **Model unit:** front required, max 3, size and type rules, status mapping from API codes to messages, the polling stop conditions and the 45 s note.
- **Component:** slots show thumbnail, replace, remove; start disabled without a front photo; unsupported category shows "coming soon"; upload progress and per-slot retry; analysing screen shows progress, timeout note, failed state with retry and the manual picker link.
- **E2E (ar-desktop full; en smoke; one mobile) with the fake provider and the inline queue:** sign up, "From photos", choose dress, add a fixture photo, start, see analysing, land on the done state; a second case with a 12 MB file shows the size error; the front photo missing disables start.
- **Screenshots:** photo step (empty, filled, error) and analysing (running, failed), ar/en, mobile and desktop.

Manual test cases (draft): TC-UI-341-01 front photo only; 02 three photos; 03 HEIC on Safari and the message on Chrome; 04 a phone photo with GPS has none after upload; 05 oversize file; 06 network drop during upload then retry; 07 analysing timeout note; 08 mobile RTL; 09 English LTR; 10 (after #347) real analysis on staging.

### Decisions to log (`docs/decisions/341-upload-design.md`)

1. Photos are resized, metadata-stripped and re-encoded to JPEG in a worker; HEIC only where the browser decodes it.
2. The design is created when the user presses Start, not when the first photo is added (no empty designs).
3. Polling every 2 s with a 45 s "taking longer" note; no websockets.
4. Routes `/designs/new/photos` and `/designs/[id]/analysing`.
5. One upload helper in `shared/api` handles progress (the only non-JSON request).

None is costly to reverse.

### Risks

- **Order:** needs #340's routes; the builder starts only after #340 is merged (`/deliver` order), and uses the `@tafsila/schemas` types from #340.
- **iOS Safari quirks** (`OffscreenCanvas` support): fallback to a main-thread canvas, covered by a unit test of the selector.
- **Large photos on low-end phones:** decoding happens in a worker; sizes are bounded by the resize.

### Labels and needs

Size M, `plan:sonnet`, `build:sonnet` stay. `needs-interactive` on the planned files: run below.

## Deviations

- The photo area shows one flat list with an "Add photo" tile, as the screen does; photos take the slots front, back, side in order (the first is always the front). Removing a photo that already uploaded is not offered.
- "Let the AI decide" stores the placeholder category dress on the new design (the API requires a category) and sends no hint; the analysis result carries the real category (decision 341).
- The "analyses left today" line of the screen is not shown: no endpoint returns the count (#340). A reached limit shows the API message in the standard toast.
- The mobile-only "Take a photo" button is not built: the file input has no `capture`, so phones offer camera and gallery from one picker.
- Per-slot retry is "Start analysis" again: it reuses the design, uploads only the photos that did not upload, and skips the photo request when none is left.
- On `done` the screen shows the done state with a link to the design; the redirect to `/designs/[id]/confirm` comes with #342.
- `hasExif` lives in `shared/image-prepare/exif.ts` (no imports) so the e2e test can use it.
