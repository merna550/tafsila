# Decision 341 · 2026-11-02 · Upload photos and start the analysis

**Context:** Issue #341 (M6, ADR-335 item 6) is the first screen of the photo flow: the person adds 1 to 3 photos, picks a category or lets the AI decide, and starts the analysis (FR-DES-01, FR-DES-02).

**Decision:**

1. Photos are resized to at most 1600 px on the long edge, stripped of metadata and re-encoded to JPEG (quality 0.85) in a Web Worker (`shared/image-prepare`). The canvas re-encode drops EXIF including GPS (NFR-05). HEIC goes through the same path only where the browser can decode it (Safari); other browsers show a clear message. No HEIC library (licence and size). A main-thread canvas runs when `OffscreenCanvas` is missing.
2. The design is created when the person presses Start, not when the first photo is added, so no empty designs are left behind. A retry reuses the design created by the first try.
3. "Let the AI decide" creates the design with the placeholder category dress (the API requires one) and sends no category hint.
4. The analysing screen polls `GET /api/designs/:id/analysis` every 2 seconds until `done` or `failed`, and says "taking longer than usual" after 45 seconds. No websockets.
5. Routes: `/designs/new/photos` and `/designs/[id]/analysing`.
6. One upload helper in `shared/api` (`uploadToSignedUrl`, XMLHttpRequest for upload progress) is the only non-JSON request of the web app. Each photo is retried twice (0.5 s then 1.5 s).

**Reason:** None is costly to reverse. Doing the image work in a worker keeps the page responsive on low-end phones; creating the design on Start avoids orphan designs.

**Alternatives:** a HEIC decoding library (rejected: licence and bundle size); `fetch` for uploads (no upload progress); creating the design on the first photo (leaves empty designs); websockets or server-sent events for the status (more infrastructure for a 30-second wait).
