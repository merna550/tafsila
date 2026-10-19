# Plan: #144 garment assembly (dress with or without a waist seam, blouse, skirt)

Copy of the approved plan comment on #144 (comment 6265171106). Deviations at the end.

**Reads:** CONTEXT_MAP row "Engine feature (new garment part)", skill `add-garment-module`, decisions 125, 128, 129, 133, 137, 138, 140, 143.
**Already done by earlier issues:** skirt + waistband (#140), closures across bodice and skirt (#143). This issue adds what joins the blocks into a garment.

### Approach

1. **Spec parts per category, as data** (`pipeline/category-rules.ts`). Replace `CATEGORY_BLOCKS` checks with `CATEGORY_PARTS`:

   | category | required      | ignored (warned, then dropped) |
   | -------- | ------------- | ------------------------------ |
   | dress    | bodice, skirt | waistband (decision 140, 5)    |
   | skirt    | skirt         | bodice, neckline, sleeve       |
   | blouse   | bodice        | skirt, waistband               |

   plus one conflict row: a dress with `waistSeam: false` needs `skirt.type` `straight` or `a-line` (a circle, gathered, pleated or tiered skirt has nothing to join without a seam).
   - A missing required part, or the conflict, becomes an **input error** (`SPEC_PART_MISSING`, `DRESS_ONE_PIECE_SKIRT_UNSUPPORTED`): a bilingual `fail` result with no pieces, using the same path as decision 128, 10. Today the missing part throws `PIPELINE_UNSUPPORTED_COMBINATION`. AI-filled specs reach this path, so it must not crash the API.
   - Ignored parts give one FR-VAL-08 `warn`, `SPEC_PART_IGNORED`, that names the parts. `generatePattern` drafts from a normalised spec without them. The input hash stays on the spec as given.
   - `bodice.waistSeam` only applies to a dress. A blouse ignores it without a warning, and the schema JSDoc says so.

2. **The bodice publishes its waist dart positions.** `blocks/bodice` writes `ctx.resolved["bodice.waistDartFrontFromCentreMm"]` and `["bodice.waistDartBackFromCentreMm"]`. Each value is the distance along the waist with darts closed, from CF or CB to the dart centre. A dropped dart (decision 128, 7) writes no value. Princess seams meet the waist at those dart legs (decision 138, 3), so the same values hold for princess bodices.

3. **Dress, `waistSeam: true`** (no new pieces).
   - _Skirt dart under the bodice dart._ For a dress, `draft-skirt-half.ts` centres the skirt waist dart at the published distance instead of half way along the waist. The intake does not change. The A-line slash follows the dart axis by itself.
   - _Waist notches._ The bodice waist edge gets a notch at each dart centre (or princess seam) and one at the side, paired with the skirt waist edge (`pairsWith` on the notch, decision 131, 3). `notchStep` writes the partners. Notches are added only when the skirt half is a single piece. On split panel skirts only the side notch is kept.
   - _Rule `DRESS_WAIST_SEAM_LENGTH` (FR-VAL-01, `runMany`, one row per half)._ It compares the bodice sewn waist (darts closed) with the skirt sewn waist (`closedWaistMm`: gathers drawn up, pleats folded), within 2 mm. Gathers and pleats go in as declared ease: the gather `lengthMm` is the target, so nothing is forced. Bodice and skirt waists both come from `waist + totalEase.waist`, so they match by construction. If the property test still shows drift over 2 mm (from skirt side-seam truing or bodice side flare), the skirt waist side point is trued to the bodice per half. That is the same fixed-point idea as decision 129, 5, and it is recorded in the decision. The rule always reports a mismatch and never fixes it.

4. **One-piece dress (`waistSeam: false`) and blouse: new `assembly` FeatureModule**, `order 45`. It runs after the shaping (5), skirt (10–30), sleeve (30–31) and waistband (40) modules, and before closure (50), so zip and button logic sees the final pieces. Its rule:
   - **Above the waist** the bodice pieces are kept as drafted: block, dart-free, or both princess panels.
   - **Below the hip line** the skirt rows are kept unchanged for a dress: straight or A-line, hem, slit edges (#135). For a blouse there is nothing below the hip line. The hem sits at `hipDepth + BLOUSE_LENGTH_BELOW_HIP_MM` (0: hip length, worn over or tucked in).
   - **Between waist and hip** the zone is redrawn. Each line joins its bodice waist point to its point on the hip row:
     - the **side seam** goes from the bodice side waist point to the hip side point;
     - a **waist dart becomes a fisheye dart**: the upper legs and apex stay as the bodice drafted them, and the lower legs go from the same waist leg points to a lower apex at the skirt dart apex (for a blouse, the skirt-method dart length, reusing the skirt-block constants);
     - a **princess seam** continues from its waist point to the dart-axis point on the hip row, then straight down to the hem. The skirt half is cut along that axis and each panel takes its own part.
     - With no bodice waist dart (dart-free, or a dart dropped under 6 mm), the whole waist-to-hip shaping goes into the side seam.
   - **The hip row for a blouse** has no skirt to come from. It is built as centre, dart axis and side from `hipQuarterMm`, using the same function as the dress, which reads the skirt's hip row.
   - **Piece ids do not change** (`bodice-front`, `bodice-back`, `bodice-*-centre`, `bodice-*-side`), and the skirt pieces are removed. Sleeve, neckline, collar and closure all pair by these ids, so nothing needs remapping. Labels come from category-aware names in `i18n/pieces.ts`: a dress gets "أمام الفستان / Dress front"…, a blouse gets "أمام البلوزة / Blouse front"…. A waist-seam dress keeps "bodice" and "skirt".
   - **Edges.** `side` runs the full length and pairs front with back. The waist edge of a blouse and the skirt hem become `hem` (kind `hem`). `cf` and `cb` run the full length. Slit edges carry over. A paired waist notch goes on both side seams.
   - **Body lines.** Bust stays as it is. Waist becomes a `polyline` along the old waist row with the fisheye closed, so FR-VAL-03 still measures the waist. Hip is `horizontal` at the hip row.

5. **Seeds** (`@tafsila/test-fixtures/src/designs.ts`): `seedDress` (darted, waist seam, straight knee skirt, CB zip), `onePieceDress` (the same with `waistSeam: false`), `princessOnePieceDress` (princess-shoulder, A-line midi), and `CATEGORY_SEEDS = { dress, skirt: straightBandSkirt, blouse: dartedBlouse }`. **No SQL seed:** `supabase/migrations` has no `designs` table yet, so the fixtures are the seed data. When the table lands, it seeds from `CATEGORY_SEEDS`.

6. **`ENGINE_VERSION` 0.13.0 → 0.14.0.** Every blouse becomes hip length, dress skirts move their darts, and conflicting specs no longer throw.

### Files (create / change)

Create:

- `packages/engine/src/modules/assembly/{index,module,hip-row,lower-zone,fisheye,split-at-axis,merge,waist-seam,rules}.ts` with `*.test.ts`, `*.property.test.ts`, `__snapshots__/`
- `packages/engine/src/constants/assembly.ts` (`ASSEMBLY_ORDER` 45, `BLOUSE_LENGTH_BELOW_HIP_MM` 0, `WAIST_NOTCH_*`; every value carries its reason)
- `docs/decisions/144-garment-assembly.md`, `docs/test-cases/engine/144-garment-assembly.md`

Change:

- `packages/engine/src/pipeline/{category-rules,generate-pattern,input-errors,default-registry,steps,draft-context}.ts` (+ tests)
- `packages/engine/src/blocks/bodice/{draft-bodice,front,back}.ts` (publish the dart positions), `packages/engine/src/blocks/skirt/{draft-skirt-half,skirt-module}.ts` (dart alignment for a dress)
- `packages/engine/src/validation/messages.ts`, `packages/engine/src/i18n/pieces.ts`, `packages/engine/src/version.ts`
- `packages/engine/src/modules/closure/{zip,targets}.ts` and `constants/closure.ts`: check only. The blouse zip (decision 143, 2: "a blouse ends at the waist") now runs to the hip. Change these only if the open-ended zip or the button spacing tests fail.
- `packages/schemas/src/design-spec.ts` (JSDoc only, no shape change), `packages/test-fixtures/src/{designs,index}.ts` (+ `fixtures.test.ts`)
- Refreshed snapshots: every blouse and dress SVG (bodice, neckline, collar, sleeve, closure, bodice-shaping)

**Data / schema / migration:** none. `DesignSpec` and `PatternResult` keep their shape; only new check codes are added. **API contract:** none (engine only; patterns are not stored by the API yet), so there are no OpenAPI or Postman changes.

### Test plan

**Unit** (size M unless noted):

- skirt + `sleeve` → `warn SPEC_PART_IGNORED ["sleeve"]`, no sleeve pieces
- blouse + `skirt` → warn, no `skirt-*` pieces
- dress + `waistband: "straight"` → warn
- dress without `skirt` → `fail SPEC_PART_MISSING`, `pieces: []`, no throw
- dress `waistSeam: false` + `gathered` → `fail DRESS_ONE_PIECE_SKIRT_UNSUPPORTED`
- `seedDress`: the skirt front and back dart centres sit at the published bodice distance (closed waist) within 0.1 mm, and every waist notch pair is within 2 mm (FR-VAL-04)
- `DRESS_WAIST_SEAM_LENGTH` passes for straight, A-line, half-circle and gathered skirts. A fixture with the skirt waist 3 mm short fails and names the half.
- `onePieceDress`: pieces are `bodice-front` and `bodice-back` plus the facings, with no `skirt-*`. The fisheye upper apex equals the bodice dart apex and the lower apex equals the skirt dart apex. Fisheye legs are within 1 mm. The side seams are front = back within 2 mm. The hip row half width is `hipQuarterMm` × 2 within 0.5 mm.
- `dartedBlouse`: hem at `waist + hipDepth` within 0.5 mm. Bust and waist key points are unchanged from 0.13.0. The hip body line is hip + total ease within 5 mm.
- Princess one-piece: the panels' style seams continue to the hem, are paired, and differ by at most 2 mm.

**Property** (fast-check over the size matrix: 5 chart sizes and 20 custom sets × fit × ease profile):

- dress `waistSeam: true` × skirt {straight, a-line, circle-half, gathered, pleated}
- dress `waistSeam: false` × shaping {darts, none, princess-shoulder, princess-armhole} × skirt {straight, a-line}
- blouse × the 4 shapings, with and without set-in sleeves

For each case: no `fail`; FR-VAL-01, -03 (bust, waist, hip within 5 mm), -04, -05, -07 pass; the same input gives byte-identical output.

**Acceptance test:** each `CATEGORY_SEEDS` entry on the 5 chart sizes gives `patternResultSchema.parse` ok and `validation.status !== "fail"`.

**Visual:** `expectSvgSnapshot` × 5 sizes for `seedDress`, `onePieceDress`, `princessOnePieceDress`, `dartedBlouse` and `straightBandSkirt`. Existing snapshots are refreshed for the version stamp and the hip length.

**E2E:** none (no UI).

**Manual test cases** (draft, `docs/test-cases/engine/144-garment-assembly.md`):

- TC-ENG-144-01: print `seedDress` M at 1:1 and check on paper that the bodice and skirt dart notches meet at the waist.
- TC-ENG-144-02: `onePieceDress` M: fisheye shape and a smooth side seam through the waist.
- TC-ENG-144-03: `princessOnePieceDress` M: the style seam continues to the hem.
- TC-ENG-144-04: `dartedBlouse` M: hip length, and the hem sits at the hip line on the body.
- TC-ENG-144-05: a conflicting spec (one-piece + gathered) shows the Arabic message.
- TC-ENG-144-06 to -08: toiles of dress, skirt and blouse in 3 sizes (S, M, XXL), logged in `docs/test-cases/engine/sew-tests.md`.
- TC-ENG-144-09: Merna checks the fisheye / one-piece step against Aldrich (one-piece dress block).

### Docs to update

- `docs/SRS.md` §6.1 comments: `waistSeam` (dress only; one-piece needs a straight or A-line skirt), ignored parts per category, and blouse at hip length
- `docs/engine/drafting-method.md`: new section "Garment assembly", with a check-list item for Merna
- `docs/engine/README.md`: module list
- the decision file (it also refines decision 125, 3: a missing part is now an input error, not a throw)
- the test cases, and the `sew-tests.md` rows

There are no OpenAPI, Postman, SQL seed or tutorial changes. CLAUDE.md status is unchanged.

### Decisions (cheap to reverse; the build writes `docs/decisions/144-garment-assembly.md`)

1. Category parts and the conflict live in one table. Missing parts and the conflict are input errors (bilingual fail); extra parts are a warning and are dropped.
2. A one-piece dress is limited to straight and A-line skirts.
3. For a dress, the skirt dart is centred under the bodice dart, keeping its own intake.
4. The one-piece and the blouse keep the bodice rows above the waist and the skirt rows below the hip, and redraw only the zone between them. The fisheye lower apex is the skirt dart apex.
5. The blouse hem is at the hip line (`BLOUSE_LENGTH_BELOW_HIP_MM` 0). There is no tuck-in/over field until the spec has one.
6. Piece ids stay `bodice-*`, and names depend on the category.
7. No SQL seed until the `designs` table exists.

### Risks

- **The waist-to-hip zone across 4 shapings is the hard part.** Build in this order, each step with its tests: category rules → waist-seam dress → one-piece darts / none → blouse → princess. Under the unattended rule, two failures on the princess extension → stop and block.
- **Bodice and skirt waist drift over 2 mm** → true the skirt waist side point to the bodice (point 3). The rule still reports any mismatch.
- **Snapshot churn:** every blouse and dress SVG changes. Review the 5 new seed snapshots plus a spot check of one older module.
- **Closure assumptions about a waist-length blouse** (zip length, last button): these are covered by existing closure tests that run on the new geometry.
- **More geometry for the 500 ms budget:** benchmarked in #147.
- **Fit:** `needs:sew-test` stays until 9 toiles are logged.

**Size:** L, changed from M. There are 4 assembly paths, 4 shapings and churn in every blouse and dress snapshot. **Build:** `build:opus` (unchanged). `needs-interactive`: **no**.

## Deviations

1. **Blouse stays at waist length; split to #224.** With the blouse at hip length, the existing neckline property test on random bodies (`arbMeasurements`) found self-intersecting outlines on extreme bodies (an acute side-seam/hem corner, a princess seam turning sharply at the waist). Following the build-order risk note and the budget, this PR ships category rules → waist-seam dress → one-piece dress (all four shapings); the hip-length blouse and the waist-to-hip robustness on extreme bodies are #224. `dartedBlouse` stays the blouse seed. Acceptance criterion 1 holds for the blouse as drafted today.
2. **Waist seam rule per side of the body.** `DRESS_WAIST_SEAM_LENGTH` compares the bodice and skirt waists on one side of the body (as every FR-VAL-01 seam compares one edge with its pair), not the whole circumference. The front bodice waist line slopes, so it is about 1 mm longer than the quarter; around the whole garment that doubled to 2.2 mm on petite bodies. No skirt-side truing was needed.
3. **Waist notches only on darted bodice over darted skirt halves** (straight skirt). A-line, circle and panel skirts have no dart to meet; no side notch (the side seam already marks the side).
4. **Princess seam below the waist is its own edge** (`style-lower`, paired like `style`), so the seam may turn at the waist without the seam allowance looping. The bust notch stays on the upper `style` edge.
5. **Fisheye halves** are two darts, `waist-dart` (upper) and `waist-dart-lower`, with `edgeId: "interior"`; the finishing step checks interior darts lie inside the piece. The waist body line is a polyline along the old waist row whose `overlapMm` leaves the closed fisheye out (schema JSDoc only).
6. **A-line hip line:** the side seam is cut at the side end of the skirt's (pivoted) hip line and the skirt's hip body line is reused, so FR-VAL-03 measures what the skirt measured.
7. `waistPieces()` now returns skirt pieces only by default (`"bodice"` for the bodice side). This fixed a latent `FULLNESS_CLOSURE_MISMATCH` for a dress with a gathered, pleated or tiered skirt, which counted the bodice waist too.
8. `shapedContext` (test util) leaves out the assembly modules, so the bodice shaping tests keep seeing a waist-length bodice.
9. Pre-existing, not fixed here: a waist-seam dress with centre-front buttons on the `full-figure` body gives `STRUCT_OPEN_PATH` on `skirt-front` (reproduced without this PR's changes; noted on #224).
