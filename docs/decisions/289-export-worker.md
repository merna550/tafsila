# ADR-289 · 2026-10-26 · The export runs in its own worker, from the saved version's inputs

**Context:** #289 adds the export dialog (A4 PDF and SVG) to the saved-version view. #288 made the PDF builder; the page already has a preview worker (ADR-239). #290 adds A0 on top of this.
**Decision:**

1. The export worker (`apps/web/src/shared/pattern-export/`) is separate from the preview worker. It drafts the pattern again from the version's stored inputs, so an export never depends on page state. The cost is one more draft of a few tens of ms.
2. The worker fetches the two fonts from `/fonts/` when a PDF starts (not bundled, cached in the worker); a failed fetch is the error `FONT_LOAD_FAILED` with a retry. `PDF_BUILD_FAILED`, `WORKER_FAILED` and `PATTERN_INVALID` are the other browser-only codes (listed in `docs/errors.md`).
3. Protocol: `ExportRequest { id, kind, input, meta }`, progress messages `{ id, progress }` and a final `ExportResult`; the bytes are transferred, SVG is UTF-8 text in the same field. The latest request wins, `cancel()` terminates and recreates the worker because a PDF build cannot be interrupted. `BUILDERS` is a table by kind, so #290 adds one entry.
4. The dialog starts the download itself when the build ends and keeps the bytes for "Download again" until it closes. Nothing is stored (ADR-281 item 3).
5. File names: `<title>-v<N>-A4.pdf`, `<title>-v<N>.svg` (`-A0.pdf` in #290). Arabic letters stay; `\ / : * ? " < > |` and control characters go; spaces become dashes; the title is cut at 60 characters (by code point); an empty title is `pattern`.
6. The analytics event `pattern_exported` carries only `kind` and `pages` (no title, client or measurements).
7. The bundle guard has marker groups, `engine` and `pdf`: each must be in at least one chunk (the worker bundled it) and in no chunk a page loads. Dependency-cruiser allows `@tafsila/export` only in the worker, the handler and the protocol types, and forbids `pdf-lib` in `apps/web/src`.

**Reason:** A separate worker keeps `pdf-lib` and the fonts out of every page and out of the preview path; regenerating from stored inputs is what ADR-281 already chose and keeps the export identical to the saved version. Cancel by restart is the only way to stop a synchronous build.
**Alternatives:** Reuse the preview worker (pdf-lib would load for every preview); bundle the fonts into the worker (1+ MB more in the chunk, fetched even when unused); build the PDF on the server (rejected in ADR-281).
