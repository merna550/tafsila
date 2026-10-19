# ADR-239 · 2026-10-19 · Pattern preview runs in a module worker

## Context

FR-PAT-04 wants the pattern to update in under 500 ms while the user edits, without an AI call and without freezing the page. ADR-236 item 1 puts the engine in the browser for the preview and on the server for saving.

## Decision

1. A worker created with `new Worker(new URL("./pattern-preview.worker.ts", import.meta.url), { type: "module" })`, bundled by Next as its own chunk. No `comlink` or other dependency.
2. Debounce 250 ms (`PATTERN_PREVIEW_DEBOUNCE_MS`); the last request wins by request id, older answers resolve as stale.
3. The code lives in `apps/web/src/shared/pattern-preview/` because the pattern page, the picker and the viewer all use it.
4. The engine geometry must stay out of page bundles. This is checked in the build output by `scripts/check-engine-chunk.mjs`, not by hand. Pages that only validate measurements import `@tafsila/engine/measurements`.
5. A dev-only route `/dev/pattern-preview` hosts the browser test until the pattern page (#251) exists; #251 moves the e2e to the real page and deletes the route.

## Reason

A worker keeps drafting (130 to 260 ms on a CI laptop) off the main thread. A build-output scan catches a stray `generatePattern` import the moment it lands.

## Alternatives

Comlink (extra dependency for one message type); a `public/` worker built with esbuild (a second build step; kept as the fallback, not needed); drafting on the server (network round trip breaks the 500 ms budget).
