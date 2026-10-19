## Plan: #239 pattern preview in a Web Worker (usePatternPreview)

Plan wave M3, 2026-10-19. No dependencies. ADR-236 item 1: engine in the browser for the preview, on the server for saving.

### Approach

A module worker created with `new Worker(new URL("./pattern-preview.worker.ts", import.meta.url), { type: "module" })`, which Next 16 (Turbopack and webpack) bundles as its own chunk. The worker imports `generatePattern` from `@tafsila/engine` (already in `transpilePackages`), so the engine geometry lands only in the worker chunk. The main bundle already imports `validateMeasurements` from `@tafsila/engine` (#31); that stays, and the bundle check targets the geometry code, not the whole package.

### Files

Create, under `apps/web/src/shared/pattern-preview/` (a shared module: the pattern page #251, the picker #246 and the viewer use it):

- `pattern-preview.worker.ts`: `onmessage = ({ data: { id, spec, measurements, options } })` → `generatePattern` → `postMessage({ id, result, durationMs })`; a thrown error posts `{ id, error: { code, message } }` (`DraftingError` code, else `ENGINE_CRASH`). No DOM, no imports from `features/`.
- `protocol.ts`: request/response types (one source for both sides).
- `preview-client.ts`: `createPreviewClient(workerFactory)` with `run(input): Promise<Response>`, keeps the latest request id and resolves older ones as `stale`; injectable factory so tests pass a fake worker.
- `use-pattern-preview.ts`: `usePatternPreview(input | null)` → `{ result, status: "idle" | "running" | "done" | "error", error?, durationMs?, inputHash? }`. Debounce with the existing `shared/hooks/use-debounced-value.ts`, delay `PATTERN_PREVIEW_DEBOUNCE_MS = 250` (named constant with the reason: under FR-PAT-04's 500 ms with typing pauses). Last input wins; the worker is created once per hook mount and terminated on unmount.
- `preview-error.ts`: maps a worker error to the shared error display route (`route-error.ts` / `ApiErrorView`, ADR-030/072) with Arabic text from the error code catalogue; an engine crash is `unexpected` (Sentry), never a thrown render.
- `index.ts` barrel; tests next to each file.
- `apps/web/e2e/pattern-preview.spec.ts` + a test-only route `apps/web/src/app/[locale]/dev/pattern-preview/page.tsx` guarded by the same dev/e2e flag pattern the app already uses (only if no such flag exists: render it only when `NODE_ENV !== "production"`), which runs the hook on `seedDress` M and prints the piece count and duration.
- `scripts/check-engine-chunk.mjs` (or a test in `apps/web`): after `next build`, scans `.next/static/chunks/**/*.js` and fails if the string `ENGINE_VERSION`-adjacent marker (a unique constant from the drafting code, e.g. the `DraftingError` class name `"DraftingError"` or the version string) appears outside the worker chunk. Wired into the existing web `build` CI step.

Change: `apps/web/package.json` (script for the chunk check), `docs/frontend/README.md` (section "Engine in a worker"), `apps/web/CLAUDE.md` one line (import the engine's geometry only through `shared/pattern-preview`).

### Data / API

None. `inputHash` comes from the engine's `PatternResult` (same function the server uses, #245), exposed as `inputHash` by the hook.

### Tests

- Unit (Vitest, fake worker): two inputs within the debounce window send one request; a slow first response arriving after the second is dropped (`stale`); an error response gives `status: "error"` with the code; unmount terminates the worker.
- Unit: `preview-error` maps `DRAFTING_*` codes to the Arabic message and marks unknown errors unexpected.
- Browser (Playwright, the dev route): `seedDress` M renders `pieces > 0` and a duration; `onePieceDress` and `dartedBlouse` too, durations printed to the test log (PR records them; #233's collar timing measured here too).
- Bundle: the chunk check passes on CI (`next build`), and fails on a branch that imports `generatePattern` in a page (verified once locally, noted in the PR).
- Bundle size of the worker chunk recorded in the PR.

Manual test cases: `docs/test-cases/ui/239-pattern-preview.md` TC-UI-239-01..02 (open the dev route on a low-end phone, note the time; type fast in the test input and see no freeze).

### Decisions (build writes `docs/decisions/239-preview-worker.md`)

1. Module worker via `new URL(..., import.meta.url)`; no `comlink` or other dependency.
2. Debounce 250 ms; last input wins by request id.
3. Lives in `shared/pattern-preview/` (used by several features).
4. Bundle guard is a build-output scan in CI, not a manual check.
5. A dev-only route hosts the browser test until the pattern page (#251) exists; #251 moves the e2e to the real page and deletes the route.

### Risks

- Next 16 worker bundling with `transpilePackages`: if the worker chunk fails to build, fall back to a `public/` worker built by a tiny esbuild step (document; same protocol).
- Engine imports Node-only modules: none today (pure); the worker build fails fast if one appears.
- Main bundle already has `validateMeasurements`: the guard marker must be from geometry code only, chosen in the build.

**Size:** M (unchanged). **Build:** `build:sonnet` (unchanged). `needs-interactive`: no.

## Deviations

- Debounce lives in a framework-free `preview-controller.ts` (with `preview-client.ts` for stale handling), not in `useDebouncedValue`: the web unit tests have no DOM or `renderHook`, and the controller can be tested with a fake worker and fake timers. The hook is a thin wiring of the two.
- The bundle guard is `scripts/check-engine-chunk.mjs`: it finds the chunks holding engine drafting code and fails when any page's client-reference manifest loads one. It runs in the Playwright web server command (right after `next build`), plus a vitest test in `scripts/`.
- The web app imported `validateMeasurements` from the engine barrel, which pulled the whole engine into the measurements and admin-size page bundles. New engine export `@tafsila/engine/measurements` (validation only) is used there instead, so the criterion "main bundle has no engine" holds.
- The dev route is public (404 only when `APP_ENV=production`), because the e2e job runs a production build with `APP_ENV=ci`. `@tafsila/test-fixtures` is added to `transpilePackages` for it.
- Worker error messages carry Arabic/English text for known input errors; `preview-error.ts` does not import the engine.
- Next 16 ignores `type: "module"` and bundles the worker as a classic script chunk (`importScripts`); it works the same. No fallback needed.
