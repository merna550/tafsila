# Plan #315: packages/nesting, fabric options and piece preparation

Copy of the approved plan comment (https://github.com/merna550/tafsila/issues/315#issuecomment-6464233719).

plan:opus · build:opus · size M (unchanged) · M5 wave 3 · FR-FAB-01, FR-FAB-02, FR-FAB-05, FR-VAL-08 · ADR-312 item 4 (fabric model), ADR-313 (own placement, 2 mm tolerance, items 3 and 5)

### Approach

A pure package `@tafsila/nesting` plus one schema file. `preparePieces` produces, per fabric kind, the list of shapes the placement (#316) will lay on a strip. No placement here.

**Schema (`packages/schemas/src/fabric-options.ts`):**

- `fabricOptionsSchema`: `widthMm` (presets 900, 1150, 1400, 1500, 1600 or any value inside `FABRIC_WIDTH_LIMITS_MM` from ADR-247), `layout: "folded" | "open"`, `directionalNap: boolean`, `shrinkagePercent` (0 to 20, default 5), `patternRepeatMm` (0 to 1000, default 0).
- `DEFAULT_FABRIC_OPTIONS`, `FABRIC_WIDTH_PRESETS_MM` exported for the browser and the API. Reuses `DEFAULT_FABRIC_WIDTH_MM`.

**`preparePieces(pattern: PatternResult, options: FabricOptions): PreparedFabrics`:**

1. For each piece, flatten `cutPath` with the engine's `samplePath`, then Douglas-Peucker at 2 mm (ADR-313 item 3). Push the simplified outline **out** by the tolerance (never inside the real cut line, ADR-313 item 3).
2. Rotate so `grainLine` runs along the selvedge (x is along the strip, y across the fabric). The grain line's direction may point either way; the allowed turns are 0° and 180° (a 180° turn is allowed only without nap).
3. Expand `cut.quantity`, then by layout:
   - **Folded**, usable width = `widthMm / 2`: an `onFold` piece is a **half** shape with its fold edge on y = 0 (the fold); its quantity counts one half per cut. A `mirror` piece is cut once through both layers (one shape for the pair). Ordinary pieces: one shape per quantity.
   - **Open**, usable width = `widthMm`: an `onFold` piece is unfolded (the half plus its mirror about the fold edge, joined into one outline); a `mirror` piece becomes a shape and its mirror image.
4. Fold pieces whose cut line crosses the fold by up to 9 mm (the V-neck facing and bodice front at the neck corner, ADR-313 item 5) are clipped back to the fold line.
5. A shape wider across the fabric than the usable width goes to `doesNotFit: { pieceId, widthMm, usableWidthMm }` and is **left out of the lists** (as ADR-312 item 4 says); the result carries `suggestOpen: true` when the folded layout caused it and the open layout would fit.
6. Result type: `{ main: Shape[], lining: Shape[], interfacing: Shape[], doesNotFit: [...], usableWidthMm, layout }`. A `Shape` has `id` (`pieceId#n`, stable), `pieceId`, polygon (mm, y across the fabric), `allowedTurns: [0] | [0, 180]`, `fold: boolean` (touches the fold) and bbox. Everything is sorted by piece id then index so the output is deterministic (NFR-08, no `Math.random`, no clock).

Engine use: `@tafsila/nesting` depends on `@tafsila/schemas` and **`@tafsila/engine/geometry` helpers only** (`samplePath`, `signedArea`, `bbox`); if the engine does not export these on a sub-path, export them through a new `@tafsila/engine/geometry` entry (one line in `package.json` exports) rather than importing from `src`. The dependency-cruiser rule: nesting imports `schemas` and the engine geometry entry only, never `apps/` or `packages/api` (ADR-312 item 1).

### Files

Create:

- `packages/schemas/src/fabric-options.ts` + `.test.ts`; export from `index.ts`.
- `packages/nesting/` (`package.json`, `tsconfig.json`, `vitest.config.ts`), `src/`: `index.ts`, `flatten.ts` (sample, simplify, outward offset), `grain.ts` (rotation to the selvedge), `fold.ts` (half and unfold, clip at the fold), `quantity.ts`, `prepare-pieces.ts`, `types.ts`, with `*.test.ts` next to each and `prepare-pieces.property.test.ts`.
- `docs/engine/nesting.md` (drawings of both layouts as inline SVG or Mermaid, the rules, ADR links).
- `docs/test-cases/engine/nesting-preparation.md`, `docs/decisions/315-nesting-preparation.md`.

Change:

- `packages/engine/package.json` (a `./geometry` export if missing), `.dependency-cruiser.cjs` (nesting rule), `docs/ARCHITECTURE.md` (one line), `docs/CONTEXT_MAP.md` (row for fabric nesting), `docs/engine/README.md` (link), glossary entries (selvedge, fold, grain line, usable width) and a learning-log row.

No API, table or UI change.

### Test plan

Concrete unit cases (hand-made `PatternResult` pieces from `rectanglePattern` variants in `@tafsila/test-fixtures`):

- Plain 200 × 300 piece, quantity 2: folded gives 2 shapes, open gives 2; usable width 700 vs 1400.
- On-fold front, quantity 1: folded gives 1 half shape touching y = 0 (`fold: true`); open gives 1 full shape of twice the width, no fold flag.
- Mirror sleeve, quantity 1: folded gives 1 shape (cut through both layers); open gives 2 (a shape and its mirror image, mirrored about its own vertical axis).
- Quantity 3 plain piece gives 3 ids `p#1..3`.
- Grain: a piece whose `grainLine` points up, down, left and right ends with the grain along x; with `directionalNap: true` `allowedTurns` is `[0]`, otherwise `[0, 180]`; the belt (ADR-145) keeps its own grain line.
- Lining and interfacing pieces land in their own lists.
- A shape 800 mm wide on 115 cm folded (usable 575): in `doesNotFit` with `suggestOpen: true`; on 115 cm open it fits.
- Outward offset: every simplified outline contains the real cut polygon (sample points tested with `pointInPolygon`).
- Fold clip: a piece crossing the fold by 9 mm ends with min y exactly 0.
- Schema: width 400 mm rejected, 1450 accepted, shrinkage 25 rejected, defaults filled.

Property tests (fast-check plus the fixture designs `seedDress`, `vNeckHalfCircleDress`, `setInSleeveBlouse`, `gatheredKneeSkirt`, `linedSidePocketDress`, sizes M and XXL, both layouts):

- Shape count equals the layout's expected sum of quantities (open counts mirrors twice and folded counts them once).
- Every shape's grain is parallel to the selvedge (within 0.01°).
- Fold shapes touch y = 0 in the folded layout and no shape has a negative y.
- Deterministic: two calls give deeply equal results; shuffling the pieces' order gives the same result.
- Every shape fits inside `usableWidthMm` or is reported.
- Snapshot of shape ids and bbox sizes per fixture and layout.

Manual test cases (draft, `docs/test-cases/engine/nesting-preparation.md`): TC-FAB-315-01 Merna reads the two layout drawings and confirms the fold/mirror rules match how she cuts; 02 `pnpm --filter @tafsila/nesting print seedDress folded` lists shapes she recognises; 03 a circle skirt on 115 cm folded reports the wide pieces and suggests open.

### Decisions to log (`docs/decisions/315-nesting-preparation.md`)

1. Width presets 900/1150/1400/1500/1600 mm and shrinkage 0 to 20 %, repeat 0 to 1000 mm (limits of the form).
2. A folded `onFold` piece is a half shape; a folded mirror pair is one shape.
3. Over-wide shapes are reported and left out (ADR-312 item 4), with `suggestOpen`.
4. Outward offset by the tolerance (ADR-313 item 3); fold clip up to 9 mm (ADR-313 item 5).
5. Shape ids `pieceId#n`.

None is costly to reverse, so no `needs:decision`.

### Docs to update

`docs/engine/nesting.md`, ARCHITECTURE, CONTEXT_MAP, engine README, glossary, learning log, decision file, test-case file. SRS unchanged (FR-FAB-01 already lists presets and layouts).

### Risks

- **Folded geometry is subtle:** one test per rule plus drawings; Merna reviews TC-01.
- **Engine helper access:** use the `./geometry` entry, never deep imports (CI scans for engine leaks into page bundles; nesting ships only inside the worker chunk).
- **Curved fold pieces** (circle skirt halves): clipped and offset at the fold edge; covered by the circle fixtures in the property tests.

### Labels and needs

Size M, `plan:opus`, `build:opus` stay. `node scripts/needs-interactive.mjs` on the files above: `no`.

## Deviations

1. **Mirrored quantity.** The plan's test "mirror sleeve, quantity 1: folded 1, open 2" and "open counts mirrors twice" read `quantity` as pairs. The engine writes a sleeve pair as `quantity: 2, mirror: true` (cut text "Cut 2 (and mirrored)"), so `quantity` counts pieces: folded gives ⌈q ÷ 2⌉ shapes, open gives q shapes with every second one mirrored. The tests use quantity 2 (decision 315 item 2).
2. **Result fields.** `doesNotFit` entries also carry `fitsOpen`, from which `suggestOpen` is derived. A `Shape` also carries its turned `grainLine` (used by the grain property test and by #316 to draw the grain) and `mirrored`; its box is `{ lengthMm, widthMm }` (along and across the fabric).
3. **Fold clip.** Every fold piece is cut back to the fold, not only crossings up to 9 mm: the 2 mm outward offset always crosses the fold, so the clip must run anyway.
4. **Belt grain.** No separate belt unit case: grain lines pointing up, down, left and right are covered on a hand-made piece, and every fixture shape's grain is checked by the property test.
5. **Print script** takes the width and size as extra arguments: `print <fixture> [folded|open] [widthCm] [size]`.
