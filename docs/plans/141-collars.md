# Plan — #141 collars: peter pan, shirt (collar + stand) and mandarin

Copy of the approved plan comment on issue #141.

Plan model: opus. Build: `build:opus` (kept). Size: M (kept, same shape as #139/#140). `needs:interactive`: no (`scripts/needs-interactive.mjs` said `no`). `needs:sew-test` stays.

## Approach

One new `collar` FeatureModule (`modules/collar/`), order **20**: after `neckline` (10), which owns the sewn neck edge (ADR-139 §3), before the sleeve (30). It reads the drafted necks from the bodice pieces and never redraws them.

1. **Neck seam lookup, shared.** Modules do not import each other, so the lookup moves to `src/pieces/neck-seam.ts`, the same pattern as `pieces/waist-seam.ts`. It holds `NECK_EDGE_ID`, `SHOULDER_EDGE_ID`, the neck-holder piece ids per half, and `neckHolders(pieces)`, which returns `{ front, back }` with each holder piece, its `neck` segments (centre line to neck point) and their length. `modules/neckline/splice.ts` and `draft-neck.ts` import from it. This is a pure move, so the neckline output does not change.
2. **Allowed combinations.** A pure `collarCombinationIssue(spec)` returns a code or `undefined`. The module's `draft` calls it first and throws `DraftingError(code)`. The codes are added to `INPUT_ERROR_MESSAGES`, so `generatePattern` returns a `fail` result with a bilingual message and no pieces. This is the same mechanism as decision 128; there is no throw and no pipeline contract change. The function is exported so the AI and chat layers can check a spec later without drafting it.
   | Code                                                                                      | When                                                                                                                                                                                                 |
   | ----------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
   | `COLLAR_NECKLINE_UNSUPPORTED`                                                             | any collar with `front` not in {round, high-round} or `back` not in {round, high-round}                                                                                                              |
   | `COLLAR_DEPTH_UNSUPPORTED`                                                                | `shirt` or `mandarin` with `depthFrontMm` set (a stand must sit on the natural neck)                                                                                                                 |
   | `COLLAR_CLOSURE_UNSUPPORTED`                                                              | `shirt` without a centre-front opening (`closure.type` none, or position not `center-front`); `mandarin` with no CF or CB opening (type none, or position side): a closed stand cannot pass the head |
   | Peter pan takes any closure. The neckline head-opening rule (ADR-139 §5) still covers it. |
3. **Collar opening follows the closure.** For CF (and every peter pan without a CB opening), each collar piece is cut on the **CB fold** and open at CF. For CB (mandarin only), it is cut on the **CF fold** and open at CB. For peter pan with a CB opening, it is a mirrored pair, open (rounded) at CF and at CB.
4. **Neck edge split, paired and notched** (same idea as ADR-140 §2). A collar's neck edge is two edges: `neck-back` (CB to shoulder) pairs with the back holder's `neck`, and `neck-front` (shoulder to CF) pairs with the front holder's `neck` with `reversed: true`, because the front neck runs CF to neck point. The core seam rule then checks each half within 2 mm (FR-VAL-01). Notches go on the collar at CB (`neck-back` 0), at the shoulder (`neck-back` end) and at CF (`neck-front` end). The matching notches are added to the bodice holders' `neck` edges: the module returns new holder pieces with the notches appended, and the outline is untouched. The core notch rule checks them within 2 mm (FR-VAL-04).
5. **Peter pan** (Aldrich, collars chapter, "Flat collars"; page numbers go in the drafting-method checklist).
   - Trace the front neck. Rotate the back neck about the shared neck point so the shoulder lines overlap by `PETER_PAN_SHOULDER_OVERLAP_MM` (13) at the shoulder tip. The overlap gives the roll and changes no neck length, so the neck edge is the bodice neck.
   - The outer edge is the neck offset by `PETER_PAN_WIDTH_MM` (70), reusing `geometry/offset` the way the facing does. It is rounded into the CF end with `PETER_PAN_FRONT_RADIUS_MM` (30), and also into the CB end when split at CB.
   - Pieces: `collar-upper` (main), `collar-under` (main, outer edge trimmed `COLLAR_TURN_OF_CLOTH_MM` = 3 so the seam rolls under), and `collar-interfacing` (upper outline). The outer edges are kind `seam` and pair with each other (upper outer to under outer, declared `intendedEaseMm` = the turn-of-cloth difference).
6. **Stand helper** (`stand.ts`, shared by shirt and mandarin; Aldrich, "Shirt collar with stand", "Mandarin collar").
   - The neck edge runs straight from CB, then curves up to a CF rise `riseMm`.
   - Its straight part is solved by bisection (fixed iteration count, deterministic) so the curve's length equals the half neck seam (back + front neck) within 0.1 mm.
   - The top edge is offset by the height, and the CF end is square to the neck curve.
   - When `closure` is CF `buttons`, the stand runs on past CF by `BUTTON_EXTENSION_MM` (15) with a rounded end (`STAND_EXTENSION_RADIUS_MM` 10). That part is its own edge `extension`; it pairs with the bodice extension #143 adds, so it pairs with nothing here. A CF zip gets no extension.
7. **Shirt collar.**
   - `collar-stand` (main, cut 2: outer + inner) and `collar-stand-interfacing`, with `SHIRT_STAND_HEIGHT_MM` 30 and `SHIRT_STAND_CF_RISE_MM` 10.
   - The collar fall's neck edge is a copy of the stand's top curve between CB and CF, so the lengths are equal by construction. Its edge `stand` pairs with the stand's `top` (notches at CB, shoulder and CF repeat on that pair).
   - Back width is `SHIRT_COLLAR_WIDTH_MM` 45. The point runs out `SHIRT_COLLAR_POINT_OUT_MM` 15 past CF, and the point length is `SHIRT_COLLAR_POINT_LENGTH_MM` 70.
   - Pieces: `collar-upper`, `collar-under` (turn of cloth as for peter pan) and `collar-interfacing`.
8. **Mandarin.** `collar-stand` (cut 2) plus `collar-stand-interfacing`, with `MANDARIN_HEIGHT_MM` 35 and `MANDARIN_CF_RISE_MM` 15. The open end is rounded with `MANDARIN_END_RADIUS_MM` 15. It gets the button extension under the same rule as the shirt stand.
9. **Neck facings with stand collars.** The inner stand encloses the neck seam, so the neckline module skips its four facing pieces when `collar` is `shirt` or `mandarin`. This is one condition in `neckline/module.ts`, which reads its own spec. Peter pan keeps the facings: the facing sandwiches the collar. The CF opening facing or button band is #143's.
10. **Rules** (`collar/rules.ts`). The resolved keys are `collar.neckMm` and `collar.bodiceNeckMm`. `COLLAR_NECK_LENGTH` (FR-VAL-01) reports pass when the total collar neck edge equals the bodice neck (front + back) within 2 mm, and fail otherwise. It never fixes the geometry. Seams and notches go through the core rules; closed, non-crossing outlines go through the structural rule (FR-VAL-05).
11. **`ENGINE_VERSION` 0.10.0 → 0.11.0.** Designs with a collar now get collar pieces, and stand-collar designs lose their facings. Every snapshot gets the new stamp.

## Files to create / change

Create:

- `packages/engine/src/modules/collar/{index,module,combinations,peter-pan,stand,shirt,mandarin,pieces,rules}.ts`
- `packages/engine/src/modules/collar/{collar.test,collar.property.test,collar.snapshot.test,combinations.test,stand.test}.ts`
- `packages/engine/src/constants/collar.ts` (every number above, in mm, with source)
- `packages/engine/src/constants/closure.ts` (`BUTTON_EXTENSION_MM`, shared with #143)
- `packages/engine/src/pieces/neck-seam.ts` (+ `neck-seam.test.ts`)
- `docs/test-cases/engine/141-collars.md`
- `docs/decisions/141-collars.md`

Change:

- `packages/engine/src/modules/neckline/{splice,draft-neck,module}.ts` (import from `pieces/neck-seam`; skip facings for stand collars)
- `packages/engine/src/modules/neckline/neckline.test.ts` (facings absent for shirt and mandarin, present for peter pan)
- `packages/engine/src/pipeline/input-errors.ts` (3 codes, ar + en)
- `packages/engine/src/pipeline/default-registry.ts` (one line)
- `packages/engine/src/i18n/pieces.ts` (piece names, below)
- `packages/engine/src/version.ts`
- `packages/engine/scripts/print.ts` (the 3 seed designs)
- `packages/test-fixtures/src/designs.ts` (seed designs: `peterPanBlouse` round/round CB zip, `shirtCollarBlouse` round/round CF buttons, `mandarinBlouse` high-round/high-round CF zip)
- every existing `__snapshots__` (stamp only)
- `docs/SRS.md` §6.1 (comment on `collar`: allowed combinations, #141)
- `docs/engine/drafting-method.md` (new "Collars" section and checklist rows)
- `docs/engine/README.md` (catalogue)
- `docs/test-cases/engine/sew-tests.md` (9 empty rows: 3 collars × size-s/m/xxl)
- `docs/handbook/glossary.md` (stand, turn of cloth)

Piece names (Merna reviews the Arabic):

- `collar-upper`: ياقة علوية / Upper collar
- `collar-under`: ياقة سفلية / Under collar
- `collar-interfacing`: حشوة الياقة / Collar interfacing
- `collar-stand`: رجل الياقة / Collar stand
- `collar-stand-interfacing`: حشوة رجل الياقة / Collar stand interfacing

Data, schema, migration: none. `neckline.collar` already has the four values. API contract: none, because the API does not take a DesignSpec yet, so there is no `ERROR_CATALOGUE`, OpenAPI or Postman change.

## Test plan

**Unit** (size-m fixture unless noted):

- Peter pan round/round with CB zip gives a mirrored pair. With a CF zip it is on the CB fold. The width at CB is 70 ± 0.5. The shoulder lines on the trace are 13 ± 0.5 apart at the tip. Under-collar outer edge = upper outer − 3 ± 0.5.
- Stand bisection on necks of 150, 200 and 260 mm: the neck curve is within 0.1 mm of the target. CF rise is 10 (shirt) or 15 (mandarin). The extension is 15 ± 0.1 with CF buttons, and absent with a CF zip.
- The shirt collar's `stand` edge equals the stand's `top` within 0.1.
- Neck facings are present for peter pan and absent for shirt and mandarin.
- Each notch sits on the collar and the bodice at CB, shoulder and CF.
- `neckHolders` finds `bodice-front` / `bodice-back` and the princess centre panels.

**Combinations** (table test). Each case gives `fail`, no pieces, the code, and non-empty `ar` and `en`:

- peter-pan + v front
- shirt + square front
- mandarin + boat front
- peter-pan + v back
- shirt + `depthFrontMm` 120
- shirt + CB zip
- shirt + closure none
- mandarin + side zip
- mandarin + closure none

Each allowed pairing drafts. `collar: none` never refuses.

**Property** (fast-check, the size matrix from `@tafsila/test-fixtures` plus random bodies within the measurement ranges; collar × front/back in {round, high-round} × allowed closures × bodice shaping in {darts, princess-shoulder, princess-armhole, none}):

- The collar neck edge equals the bodice neck within 2 mm.
- Every `COLLAR_*` and `SEAM_*` pair on collar pieces is `pass`.
- Every notch on collar edges is `pass` (± 2 mm).
- Every collar outline is closed and non-crossing (FR-VAL-05 pass).
- `generatePattern` never throws.
- Over random specs, invalid combinations always refuse.

**Visual:** an SVG snapshot of each seed design in size-s, size-m and size-xxl (9 snapshots), plus the stamp-only updates to the existing snapshots.

**E2E:** none, because there is no UI for it in M2.

**Manual test cases** (`docs/test-cases/engine/141-collars.md`), draft:

- TC-COLLAR-141-01: print `peterPanBlouse` size-m. Collar CB, shoulder and CF notches meet the bodice notches when pinned.
- TC-COLLAR-141-02: peter pan rolls about 10 mm at the CB neck when sewn (toile).
- TC-COLLAR-141-03: print `shirtCollarBlouse`. The stand extension reaches the button line. Collar fall to stand top notches align.
- TC-COLLAR-141-04: print `mandarinBlouse`. The stand stands without gaping at CF in 3 sizes.
- TC-COLLAR-141-05: the under-collar is smaller than the upper collar and the seam rolls under after turning.
- TC-COLLAR-141-06: spec with shirt + v neck. The pattern is refused with the Arabic message.
- TC-COLLAR-141-07: shirt and mandarin patterns have no neck facings, and peter pan has both.

Then run `scripts/test-case-index.sh`.

## Docs to update

The SRS §6.1 comment, `docs/engine/drafting-method.md` (Collars, sources, checklist), `docs/engine/README.md` catalogue, the glossary, `sew-tests.md` rows, the test cases and decision `docs/decisions/141-collars.md`. CLAUDE.md status is unchanged.

## Decisions (cheap to reverse; the build writes `docs/decisions/141-collars.md`)

1. The allowed-combination table above, and its refusal through `INPUT_ERROR_MESSAGES` (no new pipeline hook).
2. The opening follows `closure.position`: CB fold, CF fold or mirrored pair.
3. The neck edge is split into `neck-back` / `neck-front` and paired with the holders. The collar module adds the matching neck notches to the holders.
4. Stand collars replace the neck facings, and peter pan keeps them.
5. The button extension on both stand collars when the closure is CF buttons; the constant is shared with #143.
6. Every number is a named constant (`constants/collar.ts`), pending sew-test.

## Risks and how they are handled

- **The bodice front is still cut on the CF fold until #143**, so a shirt or mandarin with a CF opening has a stand extension and nothing on the bodice to sew it to yet. The `extension` edge is unpaired and documented in the decision. #143 pairs it and adds buttonhole marks.
- **Stand curve length:** a curve's length is not closed-form, so the bisection uses fixed iterations and a 0.1 mm tolerance, and a property test asserts it.
- **Peter pan outer offset loops on tight necks** (the high-round on size-s): rounding with a radius at least the width plus the allowance, as ADR-139 §4 does, plus the structural rule in the property suite. A failing size goes to a named constant, not a silent fix.
- **The neckline refactor changes neckline output:** it is a pure move, and the existing neckline snapshots must stay byte-identical apart from the stamp.
- **Constants are book values:** `needs:sew-test` stays. In the PR, open `test(engine): sew-test toiles for #141` (3 collars × 3 sizes) and name it as `Sew-test follow-up: #M`.

## Deviations

- **Stand length without bisection.** The CF curve takes the front neck's horizontal run and the rise, and the straight part from CB is the half neck minus the curve's length, so the neck edge equals the half neck exactly; no bisection and no iteration constants (decision 141, 6). The 0.1 mm stand test still holds.
- **Bodice notches written by the finishing step.** The collar's CB, shoulder and CF notches declare `pairsWith`; the existing finishing notch step writes the partner notches on the bodice necks, so the module does not return new holder pieces. Notches have one tick (a two-tick notch at an edge end would fall outside the edge).
- **Peter pan outer edge.** The back and front halves are offset separately and joined above the shoulder, trimmed at their crossing and blended over `PETER_PAN_SHOULDER_BLEND_MM` (30 mm), because a single offset across the corner at the neck point made the seam allowance cross itself. The outer edge includes the rounded CF end (and the CB end of a pair): it is the whole edge where the upper and under collar are sewn together.
- **Extra files.** `modules/collar/corner.ts` (one cubic corner rounding, used by every collar end and the button extension); the `STAND_COLLARS` set lives in `constants/collar.ts` so the neckline and collar modules share it without importing each other. `collarCombinationIssue` is exported from the engine entry.
- **Peter pan overlap length.** The overlap angle is measured on the whole front shoulder (centre plus side panel on a princess-shoulder bodice), so the tips overlap 13 mm whatever piece holds the neck.
- **Sew-test** (toile of each collar in 3 sizes) moved to a follow-up issue per #184.
