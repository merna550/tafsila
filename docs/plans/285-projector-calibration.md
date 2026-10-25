<!-- Approved plan comment of #285 -->

## Plan: #285 projector calibration stored per device (and the shared projector contract for #286, #287)

Plan wave M4, 2026-10-25. Planned with #286 and #287: this issue owns `features/projector/`, the calibration store and the routes; the other two add files on top and fix their interfaces below. The build must match the calibration screen in `docs/design/screens/` once #281 lands (control placement, copy, black-page look); names below are fixed so the build does not guess. Follows [ADR-281](../decisions/281-m4-scope.md) items 2, 6, 7 and ADR-243 items 1 and 4. Needs no API, table or engine change.

### Approach

Everything is browser-side. Unit of calibration: **CSS px per real mm**, separately for X and Y (`pxPerMmX`, `pxPerMmY`). The nominal square is drawn with CSS `mm` units (1 mm = 96/25.4 CSS px), so `calibrationFrom` returns `CSS_PX_PER_MM * nominalMm / measuredMm` per axis. Device pixel ratio is stored only to detect a changed setup, never used in the maths.

Pure model (`apps/web/src/features/projector/model/`):

```ts
export const CSS_PX_PER_MM = 96 / 25.4;
export const CALIBRATION_KEY = "tafsila.projector.calibration";
export type ScreenInfo = { widthPx: number; heightPx: number; devicePixelRatio: number };  // window.screen.width/height, window.devicePixelRatio
export type ProjectorCalibration = { version: 1; pxPerMmX: number; pxPerMmY: number; screen: ScreenInfo; calibratedAt: string /* ISO */ };
export type CalibrationResult = { ok: true; calibration: ProjectorCalibration } | { ok: false; field: "width" | "height"; reason: "invalid" | "range" };
calibrationFrom(nominalMm: number, measuredWidthMm: number, measuredHeightMm: number, screen: ScreenInfo, now?: Date): CalibrationResult
nominalSquareMm(screen: ScreenInfo): number          // 300, shrunk in 50 mm steps (min 100) so the square fills at most 80 % of the shorter screen side
parseMeasuredCm(text: string): OverrideInput        // wraps parseOverride from shared/format/length-units.ts with 50..5000 mm (5 cm..5 m); Arabic or Latin digits, "," or Arabic decimal mark
CalibrationState = { status: "loading" | "missing" | "stale" | "ok"; calibration: ProjectorCalibration | null }
readCalibration(screen: ScreenInfo): CalibrationState   // zod parse (projector.schema.ts), ignores bad shape; "stale" when screen size or DPR differ (DPR within 0.01)
writeCalibration(c): boolean   // shared/storage writeJson; never throws
```

Storage goes through `shared/storage/safe-storage.ts` (`readJson`, `writeJson`), so a throwing `localStorage` gives `missing`.

Hook `hooks/use-calibration.ts`: `useCalibration(): { state: CalibrationState; screen: ScreenInfo | null; save(c): boolean }`. Starts `loading` (server render and first paint), reads in an effect after mount.

Components (`components/`): `CalibrationScreen.tsx` (fullscreen black page: `position: fixed; inset: 0` over the app shell, the square `style={{ width: `${nominal}mm`, height: ... }}` with a centre cross, a form with two cm inputs, error text per field, Save, Cancel, "Enter fullscreen" button), `FullscreenButton.tsx` and `hooks/use-fullscreen.ts` (`{ isFullscreen, enter, exit }` around the Fullscreen API; `enter` only on a click because browsers require a gesture; where the API is missing the button is hidden and the page still works). Escape leaves fullscreen natively; the form is Tab/Enter operable (NFR-07). Save writes the calibration and `router.replace` to `.../projector`.

### Routes (fixed here, used by #286 and #287)

New route group `apps/web/src/app/[locale]/(projector)/` (outside `(dashboard)`, so no `AppNav`), with `layout.tsx` repeating the dashboard layout's session check (redirect to sign-in) and nothing else:

- `designs/[id]/versions/[versionId]/projector/calibrate/page.tsx` renders `CalibrationScreen` (props `designId`, `versionId`).
- `designs/[id]/versions/[versionId]/projector/page.tsx` is created by #286.
  Pages stay thin (rule in `apps/web/CLAUDE.md`). The AppShell header of `[locale]/layout` is covered by the fixed full-viewport container (`z-50`, `bg-black`); no change to the shell.

### Public API (`features/projector/index.ts`)

`CalibrationScreen`, `ProjectorScreen` (#286), `useCalibration`, types `ProjectorCalibration`, `ScreenInfo`. Other features import only these.

### Entry point

Not here: the "Projector" button on the read-only version view is #286's.

### Files

Create under `apps/web/src/features/projector/`: `index.ts`, `projector.schema.ts` (+ `.test.ts`), `model/calibration.ts`, `model/calibration-store.ts` (+ `.test.ts` each), `hooks/use-calibration.ts`, `hooks/use-fullscreen.ts`, `components/CalibrationScreen.tsx`, `components/FullscreenButton.tsx`, `components/calibration.test.tsx`; the two route files above; `apps/web/e2e/projector-calibration.spec.ts`; `apps/web/e2e/support/projector.ts` (`seedCalibration(page, { pxPerMmX, pxPerMmY })` via `addInitScript`, reading the page's own `screen` and DPR so the stored entry is valid; used by #286/#287 specs); `docs/test-cases/ui/285-projector-calibration.md`; `docs/decisions/285-projector-calibration.md`.
Change: `apps/web/messages/{ar,en}.json` (`projector.calibrate.*`, copy per `docs/design/copy.md`), `docs/frontend/README.md` (section "Projector"), `docs/CONTEXT_MAP.md` (row for projector work), `docs/SRS.md` only if FR-PROJ-02 wording needs "CSS px per mm" (add a short note).

### Tests

- Unit `calibration.test.ts`: nominal 300 with measured 300 x 300 gives `CSS_PX_PER_MM` on both axes; measured 297 x 303 gives different X and Y (exact expected values in the test); 49 mm and 5001 mm give `{ok:false, reason:"range"}` with the right `field`; `""` and `"abc"` give `invalid`; `"٢٩٩٫٥"`-style Arabic input (29.9 cm) equals `"29.9"` and `"29,9"`; `nominalSquareMm` gives 300 on 1920x1080, 250 on 1366x768 and never below 100.
- Unit `calibration-store.test.ts` (stubbed `window.localStorage`): round trip is `ok`; changed screen width, height or DPR gives `stale`; nothing stored gives `missing`; corrupt JSON and wrong shape give `missing`; `getItem` and `setItem` that throw give `missing` and `writeCalibration` returns false.
- Component (server render, `renderWithIntl` `ar` and `en`): square has the CSS mm size, the page is `dir="ltr"` for the square and the form follows the locale, error texts show per field, Arabic copy in `ar`.
- E2E (`projector-calibration.spec.ts`, desktop, `ar` and `en`, saved version via the existing pattern-page e2e support): open `/projector/calibrate`, type `30,0` and `29.7` (and Arabic digits), Save, the stored entry has the expected factors, and `/projector` (when #286 is merged; until then the test asserts the redirect target and storage) uses them; with storage cleared the projector route redirects to calibrate; Tab order reaches both inputs and Save, Enter saves.
- Manual `docs/test-cases/ui/285-projector-calibration.md`: TC-UI-285-01 square looks square on a real projector and a tape reads near 30 cm; -02 unequal X/Y entered; -03 move the window to another screen: asks to calibrate again; -04 keyboard only; -05 Arabic digits; -06 private window (storage blocked). **Physical accuracy (≤ 2 mm over 50 cm) is #294, not tested here.**

### Decisions (build writes `docs/decisions/285-projector-calibration.md`)

1. Factors are CSS px per real mm, per axis; DPR and screen size are stored only to invalidate. Reason: CSS `mm` and SVG user units are both CSS px, so the projector view needs no DPR maths.
2. The nominal square is 300 mm but shrinks in 50 mm steps (min 100) to fit 80 % of the shorter screen side; the measured values are always relative to the nominal that was drawn. A 1366x768 screen cannot show 300 mm (1134 px).
3. Valid measured size: 5 cm to 5 m (the issue's limits); one message for both bounds.
4. Fullscreen is entered by a button (browser gesture rule), not on load; all pages still work without the Fullscreen API.
5. Projector routes live in a `(projector)` route group with their own session-checking layout, outside the dashboard chrome.
6. Calibration is read after mount; the server render shows a loading state, never a stale guess.

### Risks

- Browser zoom changes CSS px per mm without changing `screen` or DPR (DPR changes with zoom in Chromium, which invalidates; Firefox does as well). Covered by the DPR check; the copy tells the user to reset zoom with Ctrl+0.
- `window.screen` on a second monitor reports that monitor only after the window moves there; calibration is read after mount, and `ScreenInfo` is re-read on `resize`, so the stale check triggers.
- Operating-system scaling (125 %, 150 %) is already inside DPR; covered by the stale check and by the tape measurement.

**Size:** M (unchanged). **Build:** `build:sonnet` (unchanged). Label `needs:sew-test` stays: #294. `node scripts/needs-interactive.mjs` on the planned files: `no`.

## Deviations

- The square is drawn in CSS px (60 % of the shorter screen side), not 300 CSS mm: a projector shows about one CSS px per mm, so 1134 px would not fit (ADR-285 item 2). `nominalSquareMm` became `nominalSquarePx`; the factor is `squarePx / measuredMm`.
- Sizes are typed in mm (as the approved screen shows), not cm; `parseMeasuredMm` has its own parser instead of `parseOverride` (ADR-285 item 3).
- The screen shows the result state ("Calibration done", factors, Open the projector, Calibrate again) instead of redirecting after Save, as in the design; the form button is "Calculate".
- `CalibrationScreen` sits at the feature root (like `ClientsScreen`) and draws through `components/CalibrationView.tsx`; form state is in `hooks/use-calibration-form.ts`.
- `calibrationFrom` takes the typed texts and parses them itself; `readCalibration` returns the `CalibrationState` type from `model/calibration-store.ts`.
- New colour token `--color-stage` for the black page; messages `projector.calibrate.*` also hold a stale hint, a zoom hint and a storage error.
- The e2e does not open `/projector` (created by #286); it checks storage and the link target.
