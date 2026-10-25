## Plan: #241 placeholder line drawings for every catalogue option

Plan wave M3, 2026-10-19, planned together with #240 (the card takes a drawing through its `illustration` slot). Depends on #236: when it lands, match the drawing size and framing used in the picker option card in `docs/design/screens/`; the drawings are placeholders and only need to be recognisable.

### Approach

No 60 separate files. Drawings are **data**: each is a list of SVG path strings in one shared viewBox `0 0 64 64`, rendered by one component that sets `fill="none"`, `stroke="currentColor"`, `strokeWidth=2`, round caps and joins. That makes "currentColor only" true by construction and a later swap a one-entry edit (or one file when final art arrives). Files are grouped per feature so each stays small. The keys come from the Zod enums in `@tafsila/schemas` (the same enums #238 reads), so a new enum value breaks the type check and the test.

Covered (60 values), as listed in the issue: `category` (3), `bodice.shaping` (4), `neckline.front` (6), `neckline.back` (4), `neckline.collar` (4), `sleeve.type` (6), `sleeve.length` (5), `sleeve.cuff` (3), `skirt.type` (7), `skirt.length` (5), `waistband` (4), `closure.type` (3), `pockets` (2), `belt` (2), `lining` (2: keys `"true"` and `"false"`). Not covered (text-only in the picker, not in the issue list): `bodice.fit`, `bodice.waistSeam`, `closure.position`, `skirt.slit.position`. Every `none` value uses one shared "none" drawing (an empty circle with a diagonal) so the picker shows it clearly.

### Files (exact)

Create in `apps/web/src/features/design-picker/illustrations/` (each under about 80 lines):

- `types.ts`: `IllustratedPath` (union of the 15 path names above, same strings as #238's `FeaturePath`; import that type instead if #238 has merged), `IllustrationValue<P>` (the enum union of that path, `"true"|"false"` for lining), `Drawing = readonly string[]`.
- `category.ts`, `bodice.ts`, `neckline.ts` (front, back, collar), `sleeve.ts` (type, length, cuff), `skirt.ts` (type, length), `details.ts` (waistband, closure, pockets, belt, lining), `shared.ts` (the `NONE` drawing): each exports a typed record, e.g. `export const SLEEVE_TYPE: Record<IllustrationValue<"sleeve.type">, Drawing>`.
- `catalogue.ts`: `ILLUSTRATIONS: { [P in IllustratedPath]: Record<IllustrationValue<P>, Drawing> }` and `listIllustrations(): { path; value }[]` (used by the gallery and the test).
- `OptionIllustration.tsx`: `OptionIllustration({ path, value, className? })`: `<svg viewBox="0 0 64 64" aria-hidden focusable="false" className={cx("size-full", className)}>`; unknown value returns `null`.
- `index.ts`: barrel.
- `illustrations.test.tsx`.
- Gallery: `apps/web/src/app/[locale]/dev/option-illustrations/page.tsx` (grid of every drawing with its path and value as caption), rendered only when `NODE_ENV !== "production"` (same guard as #239's dev route; reuse its helper if it landed) and `apps/web/e2e/option-illustrations.spec.ts` (one full-page screenshot, desktop, RTL).

Change: `docs/frontend/README.md` (one line: where drawings live and how to replace one), `docs/test-cases/ui/241-option-illustrations.md` (TC-UI-241-01).

### Data / API

None. No dependency. Used by #246 as `<OptionCard illustration={<OptionIllustration path="neckline.front" value="round" />} />`.

### Tests

- Completeness (the AC): for each `IllustratedPath`, read the options from the schema (`designSpecSchema.shape.neckline.unwrap().shape.front.options`, `garmentCategorySchema.options`, ...; booleans for lining) and assert `ILLUSTRATIONS[path][value]` exists and is a non-empty list. A temporary extra enum value in the test (a mocked option list) proves it fails when a drawing is missing.
- Colours: render every drawing; the markup has `stroke="currentColor"`, `fill="none"` and no `#`, `rgb(`, `hsl(` or `style=`; every path string matches `^[MmLlHhVvCcSsQqTtAaZz0-9 .,\-]+$` (no scripts or refs).
- Path validity: no `NaN`, all coordinates inside 0 to 64.
- Uniqueness smoke: within one path, no two values share an identical drawing (catches a copy-paste placeholder).
- Gallery e2e: page lists `listIllustrations().length` (60) figures; screenshot.
- Light and dark: the app has no dark theme yet; `currentColor` plus the colour test covers it, the screenshot is light only.

Manual test case: `docs/test-cases/ui/241-option-illustrations.md` TC-UI-241-01 (open the gallery, check each drawing is recognisable at 64 px).

### Decisions (build writes `docs/decisions/241-option-illustrations.md`)

1. Drawings are path data in grouped files plus one renderer, not 60 files; a swap is one entry.
2. Keys come from the schema enums, typed so a new value fails type check and test.
3. One shared "none" drawing for every `none` option.
4. Fit, waist seam, closure position and slit position get no drawing (not in the issue list; text choices).
5. **The review page is a dev-only gallery route, not Storybook**: Storybook exists only in `packages/ui`, which cannot import from `apps/web`, and adding a second Storybook is not worth it for placeholders. The AC line "a Storybook page" is met by this page; say so in the PR.

### Risks

- Quality of 60 hand-written paths: kept simple (garment silhouette lines); Merna reviews in the gallery, final art replaces them before the beta.
- Gallery route reaching production: guarded by `NODE_ENV` and excluded in the build check of #239 if it exists; add a unit test that the page returns `notFound()` in production.

**Size:** M (unchanged; many small files, simple content). **Build:** `build:sonnet` (unchanged). `needs-interactive`: no (script: `no`). Ready for approval.

## Deviations

- The gallery e2e has no screenshot: DOM assertions only (60 figures, `currentColor` strokes). The visual baseline is moved to #265 (no Docker here).
- Gallery guard uses `loadPublicConfig().appEnv === "production"` like the pattern-preview dev route, not `NODE_ENV`.
- Added `findIllustration` (untyped lookup) so the renderer and tests can ask for unknown values safely.
