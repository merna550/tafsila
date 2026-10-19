# Plan — #142 Sleeve styles (cap, puff, bishop, flutter) and cuffs (band, elastic)

Copy of the approved plan comment on issue #142.

Method source: Aldrich 6th ed., ch. 2 "Sleeve block" and the sleeve-variation chapter; every style starts from the #134 set-in block (`draftSleeve`), so cap height, cap ease share and balance notches stay as decision 134 sets them.

## Approach

**1. Allowed combinations as data (refused as input errors, like decision 141, 1).**
`SLEEVE_COMBINATIONS` in `constants/sleeve-style.ts`: type → length → allowed cuffs. Anything else: `sleeveCombinationIssue(spec)` (pure, exported for the AI/chat layers) returns `SLEEVE_LENGTH_UNSUPPORTED` or `SLEEVE_CUFF_UNSUPPORTED`. Both modules throw `DraftingError(code)`. The codes go in `INPUT_ERROR_MESSAGES`, so `generatePattern` returns a bilingual `fail` with no pieces.

| type    | lengths             | cuffs                                                                       |
| ------- | ------------------- | --------------------------------------------------------------------------- |
| set-in  | all 5               | none: all · band: short, elbow, three-quarter, long · elastic: short, elbow |
| cap     | cap, short          | none                                                                        |
| puff    | cap, short, elbow   | none, band, elastic                                                         |
| bishop  | three-quarter, long | band, elastic (none refused: a bishop is gathered into a cuff)              |
| flutter | cap, short          | none                                                                        |

Set-in + elastic at three-quarter/long is refused because a straight wrist casing (wrist + 30 mm) cannot pass the hand. Set-in + band was silently ignored until now and is now drafted.

**2. `sleeve/style` module** (`modules/sleeve/`, order 30, applies to cap/puff/bishop/flutter). The existing `sleeve/set-in` stays as it is. The bodice-notching step of `blocks/sleeve/module.ts` is exported as `withSleeveArmholeNotches(ctx)` and reused, so both modules notch the bodice the same way.

- **puff, cap fullness** (`puff-cap.ts`): the cap below the balance notches stays as in the block (front 75 mm, back 90/96 mm from the underarm), so the notches and FR-VAL-04 do not change. The cap between the back and front notch is redrawn with `curveThroughPoints`. It runs back notch → (−W/2, −R) → (+W/2, −R) → front notch, keeping the block's tangents at the notches. W = `PUFF_CAP_TOP_WIDTH_SHARE` × bicep width, and R is solved by bisection (same pattern as `solveSleeveCapHeight`) so the new middle is `PUFF_CAP_GATHER_RATIO` (1.5) × the block's middle. This gives the same shape as slash-and-spread at the cap (a higher, wider head) with an exact gather amount and no hinge drift; it is logged as a decision. Gathers sit between the notches only. Each cap edge gets a `gather` mark (`lengthMm` = its armhole share + its ease share) and declares `intendedEaseMm` = ease share + gather share to its bodice armhole (FR-VAL-01).
- **puff / bishop, hem fullness** (`hem-spread.ts`): the hem half-width becomes target / 2, with straight underarm seams from the underarm points to the new hem corners, and the hem drops by a blouson allowance (`PUFF_HEM_DROP_MM` 20, `BISHOP_HEM_DROP_MM` 40). Target hem = cuff seam length × ratio: puff 1.5; bishop uses the skirt's `GATHER_RATIO_BY_WEIGHT[DEFAULT_FABRIC_WEIGHT]` (1.8), imported rather than copied. A puff with `cuff: none` gets cap fullness only and a plain hem. A bishop keeps the set-in cap (normal FR-VAL-02 10–40 mm).
- **cap sleeve** (`cap-sleeve.ts`): the block cap from the back notch (90 mm) to the front notch (75 mm), plus a hem curve from notch to notch through (0, hemY), where hemY comes from the block's `HEM_Y_MM` (cap / short). There is no underarm seam. The piece is self-lined (cut 4, mirrored); the hem is kind `other` (10 mm), turned through. The cap edges are still split at the shoulder point (`cap-back`, `cap-front`) and carry the shoulder notch. The bodice keeps the front/back balance notches, which mark where the sleeve ends. The armhole below them keeps its allowance for binding, as for `type: none` (decision 134, 6); #146 prints that step.
- **flutter** (`flutter.ts`): a circular ruffle sewn into the same notch-to-notch span. Inner arc length = armhole span + `SLEEVE_CAP_TARGET_EASE_MM`, sweep `FLUTTER_SWEEP_RAD` (π, half circle), depth `FLUTTER_DEPTH_MM` {cap 100, short 150}. Built with `geometry/arc.ts`. The inner arc is split at the back-span share into `cap-back`/`cap-front`, with the shoulder notch at the split. Grain on the bisector; cut 2 mirrored; hem kind `other` (narrow hem).

**3. FR-VAL-02 with declared ease** (schema, the only contract change). `Piece.sleeveCap` gains two optional fields:

- `gatheredMm` (≥ 0): cap length gathered on purpose (puff);
- `armholeExcludedMm` (≥ 0): armhole length not sewn to this cap (cap/flutter: 90 + 75 = 165 mm).

`sleeveCapRule` measures `cap − (armhole − armholeExcludedMm) − gatheredMm` against 10–40 mm, with the same codes and messages, `measuredMm` = net ease. Without the fields it behaves exactly as today, so set-in and bishop caps keep 10–40 mm. Cap/flutter edges do not pair with the armhole edge (they cover only part of it, like the split princess armhole, decision 138, 5), so FR-VAL-02 is the check for them.

**4. `sleeve/cuff` module** (`cuff-module.ts`, order 31, applies when `sleeve.cuff !== "none"` and type ≠ none). It finds the `sleeve` piece's `hem` edge.

- Limb circumference at the hem, `limbCircumferenceAtMm(y)`: upper arm at the underarm line, wrist at arm length, linear in between (the measurements have no elbow girth).
- **band**: finished length = limb + `CUFF_BAND_EASE_MM` (20). Finished width `CUFF_BAND_WIDTH_MM` {wrist (three-quarter, long) 50, arm (cap/short/elbow) 30}; cut height 2 × width (folded); cut 2 + an interfacing strip cut 2.
  - At three-quarter/long the band is open: an `overlap` edge of `CUFF_OVERLAP_MM` (20) that pairs with nothing, plus a slit. The slit is a new mark kind `slit`: a line mark on the sleeve hem at x = −hemHalf/2 (back half), `CUFF_SLIT_LENGTH_MM` 75. A `cuff-placket` binding strip (2 × slit length by `CUFF_PLACKET_WIDTH_MM` 30, cut 2) is added. Button and buttonhole marks are left to #143, as decision 141, 5 did for the collar extension (the build comments this on #143).
  - At short/elbow the band is a loop (the ends pair).
- **elastic**: casing strip as long as the relaxed sleeve hem; loop; height 2 × (`CUFF_ELASTIC_WIDTH_MM` 10 + 5); cut 2. Notion `{ id: "sleeve-elastic", kind: "elastic", lengthMm: limb × ELASTIC_LENGTH_RATIO, widthMm: 10, quantity: 2 }`. `ELASTIC_LENGTH_RATIO` (0.9) and the casing clearance move from `constants/waistband.ts` to a shared `constants/elastic.ts`.
- **Matching (acceptance 2):** the cuff seam edge pairs with `sleeve/hem` and declares `intendedEaseMm` = hem − cuff seam. The hem gets a `gather` mark with `lengthMm` = cuff seam. A whole-cuff rule `CUFF_LENGTH_OK / CUFF_LENGTH_MISMATCH` (FR-VAL-01, ±2 mm, message names the overlap) mirrors `WAISTBAND_LENGTH_*`. If the block hem is already ≤ the cuff seam (set-in long + band: about 190 vs 180 mm at M), no spread is added; the small difference is declared ease.
- **No duplication:** `modules/waistband/strip.ts` moves to `pieces/strip.ts` (generic: runs, overlap, loop, fabric, a pair builder passed in). Waistband and cuff both use it; waistband geometry is unchanged, so its snapshots differ only by the version stamp.

**5. `ENGINE_VERSION` 0.11.0 → 0.12.0:** set-in + band/elastic designs now get cuffs, and cap/puff/bishop/flutter designs, which drew no sleeve before, now get one. All snapshots get the new stamp.

## Files

Create

- `packages/engine/src/constants/sleeve-style.ts`, `constants/cuff.ts`, `constants/elastic.ts`
- `packages/engine/src/modules/sleeve/{index,module,combinations,puff-cap,hem-spread,cap-sleeve,flutter,cuff-module,cuff,limb,rules}.ts`
- tests: `modules/sleeve/{combinations,sleeve-styles,cuff,sleeve-styles.property,sleeve-styles.snapshot}.test.ts` + `__snapshots__/`
- `packages/engine/src/pieces/strip.ts` (moved from `modules/waistband/strip.ts`)
- `docs/test-cases/engine/142-sleeve-styles-cuffs.md`, `docs/decisions/142-sleeve-styles-cuffs.md`

Change

- `packages/schemas/src/pattern.ts` (`sleeveCap.gatheredMm?`, `sleeveCap.armholeExcludedMm?`, mark kind `slit`) + its test; `packages/schemas/json/pattern-result.schema.json` (`pnpm schemas:json`)
- `packages/engine/src/validation/rules/sleeve-cap.ts` (+ `fit-rules.test.ts` cases), `validation/messages.ts` (CUFF_LENGTH__), `pipeline/input-errors.ts` (SLEEVE___UNSUPPORTED)
- `packages/engine/src/blocks/sleeve/module.ts` (export `withSleeveArmholeNotches`), `blocks/sleeve/draft-sleeve.ts` (export `wholeCap`/`HEM_Y_MM` access, no geometry change), `blocks/sleeve/notches.ts` (shoulder-only variant for the notch-to-notch span)
- `packages/engine/src/modules/waistband/{finishes,module}.ts` (import the moved strip; `strip.ts` deleted), `constants/waistband.ts` (elastic constants moved)
- `packages/engine/src/render/layers.ts` (style for the `slit` mark: solid line with end ticks)
- `packages/engine/src/i18n/pieces.ts` (cap sleeve, flutter, cuff, cuff interfacing, cuff placket, sleeve casing; ar + en)
- `packages/engine/src/pipeline/default-registry.ts`, `src/index.ts` (export `sleeveCombinationIssue`), `src/version.ts`
- `packages/test-fixtures/src/designs.ts` (+ `fixtures.test.ts`): `puffSleeveBlouse` (puff short band), `bishopSleeveBlouse` (bishop long band), `capSleeveBlouse`, `flutterSleeveBlouse`; tests switch cuffs on these (elastic, set-in long band)
- `packages/engine/scripts/print.ts` (new designs printable)
- existing snapshots (version stamp only)

No database, API, OpenAPI or Postman change: patterns are not stored by the API yet (decision 140, 3). No UI change: the `DesignSpec` enums already list every value.

## Test plan

Unit (size M, `SIZE_MATRIX`):

- `combinations.test.ts`:
  - bishop/long/none → `SLEEVE_CUFF_UNSUPPORTED`
  - flutter/long → `SLEEVE_LENGTH_UNSUPPORTED`
  - set-in/long/elastic → `SLEEVE_CUFF_UNSUPPORTED`
  - cap/cap/band → `SLEEVE_CUFF_UNSUPPORTED`
  - set-in/short/none, puff/elbow/elastic → `undefined`
  - every table row is accepted
  - `generatePattern` on a refused spec → `fail` with the Arabic message and no pieces
- puff short none:
  - the cap parts below the notches are identical to the block (lengths ±0.01 mm), and the notch `atMm` values are unchanged
  - the redrawn middle = 1.5 × the block middle (±0.5 mm)
  - `sleeveCap.gatheredMm` = middle growth
  - FR-VAL-02 net ease ≈ 25 mm (pass), FR-VAL-01 cap halves pass
- puff short band: hem = cuff seam × 1.5 (±0.5); the band is a loop, with no overlap and no slit
- bishop long band:
  - cuff seam = wrist + 20; overlap edge 20 mm with no pair
  - hem = (wrist + 20) × 1.8; hem drop 40 mm
  - slit mark 75 mm at x = −hemHalf/2; `cuff-placket` 150 × 30 mm, cut 2
  - FR-VAL-02 within 10–40 with no `gatheredMm`
- bishop three-quarter elastic: notion length = limb(0.78 × arm length) × 0.9; quantity 2; casing = hem; loop
- cap sleeve: cap edges sum = block cap from 90 mm back to 75 mm front; `armholeExcludedMm` 165; no `underarm-*` edges; cut 4 mirrored
- flutter: inner arc = span + 25 (±0.5); hem arc = inner + π × depth (±1); the shoulder notch at the back-span share
- `sleeveCapRule` synthetic:
  - cap 100 mm over the armhole with `gatheredMm` 75 → pass, 25
  - the same without the field → fail
  - `armholeExcludedMm` subtracted
  - existing set-in rows unchanged
- strip move: waistband tests unchanged and green

Property (fast-check, every body in the size matrix × every allowed row of `SLEEVE_COMBINATIONS` × fabric width 1100/1500):

- FR-VAL-01/-02/-04/-05 all pass
- `CUFF_LENGTH_OK`
- the cuff seam + declared ease = hem (±0.01)
- outlines closed and not self-intersecting
- deterministic (two runs equal)
- every refused row fails with its code

Visual: SVG snapshot per chart size for puff (short band), bishop (long band), cap, flutter (short), plus set-in long band and puff elbow elastic at size M.

Manual (draft, `docs/test-cases/engine/142-sleeve-styles-cuffs.md`):

- TC-ENG-142-01 Puff short, size M print: gathers only between the notches; notches meet the bodice within 2 mm
- TC-ENG-142-02 Bishop long band, size S: cuff = wrist + 20 + 20 overlap; slit 75 mm on the back half
- TC-ENG-142-03 Cap sleeve, XXL: ends land on the bodice balance notches; underarm left for binding
- TC-ENG-142-04 Flutter short, M: half-circle ruffle, hem depth 150 mm
- TC-ENG-142-05 Elastic cuff, puff elbow: elastic cut length printed (2 ×)
- TC-ENG-142-06 Refused combination (bishop without cuff): Arabic message, no pattern
- TC-ENG-142-07 Toiles: puff and bishop in S, M, XXL (manual only, `needs:sew-test`; rows in `sew-tests.md`)

## Docs to update

- SRS §6.1: the `sleeve` comment gets the allowed combinations and "#142".
- SRS §6.2 `sleeveCap` line: `edgeIds`, `gatheredMm?`, `armholeExcludedMm?`.
- FR-VAL-02 note: declared gathers and the unsewn armhole are taken out of the measured ease.
- `docs/engine/drafting-method.md`: new section "Sleeve styles and cuffs".
- `docs/engine/README.md` module catalogue.
- Decision file `docs/decisions/142-sleeve-styles-cuffs.md`.
- Test-case file + `scripts/test-case-index.sh`; `sew-tests.md` rows.
- PR body: `Sew-test follow-up: #M` (new issue `test(engine): sew-test toiles for #142`).

## Decisions (written by the build in `docs/decisions/142-sleeve-styles-cuffs.md`; all cheap to reverse, all constants)

1. Combination table above; refused rows are input errors.
2. The puff cap is redrawn between the notches with a solved rise for an exact 1.5 gather (a geometric equivalent of slash-and-spread); hem fullness comes from widened hem corners plus a blouson drop.
3. The cap sleeve and flutter are sewn notch to notch; the cap sleeve is self-lined; the flutter is a half-circle ruffle; the rest of the armhole is bound (#146).
4. `sleeveCap.gatheredMm` / `armholeExcludedMm` declare intended differences to FR-VAL-02 (never a silent fix).
5. Band: +20 mm ease, 20 mm overlap and a 75 mm bound slit at three-quarter/long; a loop above the elbow. Buttons come with #143.
6. Elastic: casing = relaxed hem, elastic = limb × 0.9 (shared with the waist), refused on straight set-in sleeves below the elbow.
7. `ENGINE_VERSION` 0.12.0.

## Risks

- **Puff rise solver has no solution for a very small span.** Bisection is bounded like `SLEEVE_CAP_UNSOLVABLE` and throws a new `SLEEVE_PUFF_UNSOLVABLE` input error. The property test covers the matrix extremes.
- **Partial-armhole notches and FR-VAL-04.** The cap/flutter carry only the shoulder notch with a pair; the bodice balance notches stay as end marks. A unit test asserts that FR-VAL-04 passes and that no unpaired notch is reported.
- **The strip move breaks the waistband.** It is a move-only commit first, with waistband snapshots byte-equal apart from the version stamp.
- **Fit numbers are starting values.** Toiles decide them; `needs:sew-test` stays until puff and bishop are logged in 3 sizes.
- **Scope.** The milestone allows moving bishop to M3 by decision if time runs short (M2 brief); not planned.

## Size and labels

Estimated size **L** (4 styles, 2 cuffs, a schema field, a shared-strip move), so I changed `size:M` → `size:L`. `build:opus` stays. `node scripts/needs-interactive.mjs …` → `no`. Status labels are not changed (already approved).

## Deviations

- **Bodice sleeve-end marks instead of balance notches (cap and flutter).** A notch with no partner fails FR-VAL-04 (`NOTCH_BROKEN_REF`), and the sleeve cannot carry a matching notch: its ends are at the notch positions while its cap carries ease, so no `alignFrom` makes the two agree. The bodice therefore keeps only the shoulder notch (paired with the sleeve's) and gets a point mark of the new kind `sleeve-end` at 90 mm (back) and 75 mm (front) from the underarm. This adds one mark kind to the schema beside `slit` (decision 142, 3).
- **Piece ids.** The cap sleeve and the flutter are `cap-sleeve` and `flutter-sleeve` (their names come from the piece catalogue, which is keyed by id); puff and bishop keep `sleeve`, so the cuff module finds the hem by one id.
- **Combination check placement.** `sleeve/style` refuses its own types; the cuff module (which runs for every cuffed sleeve) refuses the set-in rows, so `blocks/sleeve/module.ts` is not changed for it.
- **Puff head starts at the upper back notch (96 mm).** Both marks of the back double notch stay on the block cap.
- **Cap sleeve hem allowance.** The hem edge is kind `other`, which is 15 mm in the defaults (the plan said 10 mm); no new edge kind was added.
- **Slit drawing.** The `slit` mark is a solid line with its words; no end ticks (the renderer draws lines and arrows only).
- **Extra files.** `modules/sleeve/outline.ts` (rebuilds the sleeve piece from reshaped parts), `partial.ts` (shared by the cap sleeve and the flutter), `cuff-seam.ts`, `test-support.ts`; `pieces/gather-mark.ts` (the gather line mark shared with the skirts). `HEM_Y_MM` and `wholeCap` were not exported: the styles read the drafted block piece instead.
- **Arm girth at the hem.** The cuff module drafts the set-in block again from the context (pure) to read the cap height and block hem line, rather than passing them through `resolved`.
- **Property test sampling.** The size-matrix cases step two table rows per body (every row met, both fabric widths) instead of the full product, and random bodies check only the sleeve rows (random bodies can fail bodice checks the sleeve does not touch), to keep each test under 10 s on CI.
- **Sew-test** (toile of puff and bishop in 3 sizes) moved to a follow-up issue per #184.
