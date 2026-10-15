# Plan #126: ease tables and the resolve step

> Build note: the ankle length for size M is 935.5 (570 + 0.85 x 430); the first draft of this plan said 936.5 by an arithmetic slip.

Approved by Merna's explicit instruction in this session (no PR, no commit for the plan). Label moved from `status:plan-review` to `status:ready`. The builder works from this comment alone and saves it as `docs/plans/126-ease-resolve.md` in the build PR.

Depends on #121 (schemas), #122 (drafting method, merged), #124 (geometry kit, merged; not used here).

## Approach

Ease is data in one table; one pure function turns spec + measurements + ease profile into the named inputs the block drafters (#128, #129, #131-#134) read. No block ever reads `measurements.bust` directly for a width.

**Key finding from #122 (do not add ease twice).** The Aldrich blocks in `docs/engine/drafting-method.md` ("Ease already inside the blocks") already contain: bodice bust 80 mm in total, bodice waist 40, skirt hip 40, skirt waist 20, sleeve upper arm 50, sleeve wrist 30. The SRS §6.2 numbers (regular: bust +80, waist +40, hip +50) are the **total** ease the finished garment should have. So:

- The table stores the **total** ease per body line, so every value can be read against the SRS and checked by FR-VAL-03 (pieces = measurement + ease).
- `resolve` subtracts the block's built-in ease and returns the **remainder** (style ease) next to the finished quarter widths. Blocks draft from the quarter widths.
- For regular: bust remainder 0, bodice waist 0, skirt hip +10, skirt waist +20. So regular bodice size M equals the `referenceDrafts` points exactly; the regular skirt is 2.5 mm (hip quarter) and 5 mm (waist quarter) wider than the reference skirt, which was drafted with built-in ease only. See Risks.

## Ease numbers (Merna approves these in the PR)

Total ease over the whole circumference, mm, woven. Each value has a one-line `why` in the code.

| Body line                                 | fitted | regular | loose | Why                                                                                                          |
| ----------------------------------------- | ------ | ------- | ----- | ------------------------------------------------------------------------------------------------------------ |
| bust                                      | 60     | 80      | 120   | regular is SRS §6.2; fitted keeps room to breathe and raise arms; loose adds a hand's width                  |
| waist                                     | 20     | 40      | 70    | regular is SRS §6.2; fitted is the least that sits without pulling                                           |
| hip                                       | 30     | 50      | 80    | regular is SRS §6.2; hip ease is needed to sit and walk                                                      |
| upperArm (sleeve bicep)                   | 40     | 50      | 80    | regular equals the block's built-in 50, so the regular sleeve is unchanged                                   |
| acrossBack (whole back width, style only) | 0      | 0       | 20    | back width is a ratio of the bust (no body measure), so its built-in is 0 and this is the remainder directly |

Modifier per `bodice.fit`, added to the bust, waist and hip totals (mm). `semi-fitted` is neutral because regular is the SRS default. After the sum the total is floored at 0, so ease is never negative for woven (FR-VAL-08 input).

| bodice.fit    | fitted | semi-fitted | loose |
| ------------- | ------ | ----------- | ----- |
| modifier (mm) | -10    | 0           | +30   |

When the spec has no `bodice` (a plain skirt), the modifier is 0.

Built-in ease of the blocks (constants, with a comment pointing at `drafting-method.md`): bust 80, bodiceWaist 40, skirtHip 40, skirtWaist 20, sleeveBicep 50, sleeveWrist 30 (not in the table: wrist ease is fixed by the block), acrossBack 0.

Worked values, size M of `egyptianSizeChart` (bust 960, waist 780, hip 1040), regular + semi-fitted: bust quarter (960 + 80) / 4 = 260; bodice waist quarter (780 + 40) / 4 = 205; hip quarter (1040 + 50) / 4 = 272.5; skirt waist quarter (780 + 40) / 4 = 205.

## Skirt length table

`skirt.lengthMm`, when present, wins. Otherwise by `skirt.length`, from `waistToKnee` (K) and `waistToFloor` (F):

| length | mm                 | named constant                                          |
| ------ | ------------------ | ------------------------------------------------------- |
| mini   | K - 180            | `SKIRT_MINI_ABOVE_KNEE_MM` = 180                        |
| knee   | K                  | n/a                                                     |
| midi   | K + 0.40 x (F - K) | `SKIRT_MIDI_KNEE_TO_FLOOR_SHARE` = 0.40                 |
| ankle  | K + 0.85 x (F - K) | `SKIRT_ANKLE_KNEE_TO_FLOOR_SHARE` = 0.85                |
| floor  | F - 20             | `SKIRT_FLOOR_CLEARANCE_MM` = 20 (hem clears the ground) |

Shares keep the order mini < knee < midi < ankle < floor for every valid body. Errors (`DraftingError`):

- `SKIRT_LENGTH_INVALID_BODY` if F - K < `MIN_KNEE_TO_FLOOR_GAP_MM` = 150 (the order could not hold).
- `SKIRT_LENGTH_OUT_OF_BODY` if `lengthMm` < `MIN_SKIRT_LENGTH_MM` = 100 or > F.

Size M check: K = 570, F = 1000: mini 390, knee 570, midi 742, ankle 935.5, floor 980.

## Files

Create (all under `packages/engine/src/`, each with a `*.test.ts` beside it except constants):

- `constants/ease.ts`: `EASE_TOTAL_MM` (profile x line), `BODICE_FIT_MODIFIER_MM`, `BLOCK_BUILT_IN_EASE_MM`, with the `why` strings. Types `EaseLine` and `EaseTable`.
- `constants/skirt-length.ts`: the five named constants above.
- `resolve/types.ts`: `ResolvedDraftInputs`.
- `resolve/skirt-length.ts`: `resolveSkirtLength(skirt, measurements)`.
- `resolve/ease.ts`: `totalEaseMm(profile, fit, line)` and `styleEaseMm(profile, fit, line)` (total minus built-in).
- `resolve/resolve-draft-inputs.ts`: `resolveDraftInputs(spec, measurements, options)`.
- `resolve/index.ts`: exports.

Change:

- `index.ts`: `export * from "./resolve";` and `export * from "./constants/ease";`.
- `docs/engine/README.md`: "Ease tables and resolve" section (below).
- `docs/SRS.md` §6.2: replace "live in `packages/engine/src/ease.ts`" with `src/constants/ease.ts` and add the table; note the regular row equals the SRS example.
- `docs/decisions/126-ease-tables.md`: the decisions below.
- `docs/plans/126-ease-resolve.md`: this plan.
- Learning-log row (`docs/learning-log.md` if present, as in the other issues).

Not changed: `packages/test-fixtures` (no regeneration), schemas, API.

## The function

```ts
resolveDraftInputs(spec: DesignSpec, measurements: Measurements, options: Pick<EngineOptions, "easeProfile">): ResolvedDraftInputs
```

`ResolvedDraftInputs` (all mm, JSDoc on every field):

- `easeProfile`, `bodiceFit`.
- `bustQuarterMm` = (bust + total bust ease) / 4; `bodiceWaistQuarterMm`; `hipQuarterMm`; `skirtWaistQuarterMm` (waist + total waist ease) / 4 (skirt block uses the waist total too).
- `sleeveBicepHalfMm` = (upperArm + total upperArm ease) / 2; `sleeveWristHalfMm` = (wrist + built-in wrist ease) / 2.
- `acrossBackStyleEaseMm` (whole width).
- `styleEaseMm`: `{ bust, bodiceWaist, skirtHip, skirtWaist, sleeveBicep, acrossBack }`, the remainder over the built-in (may be negative; the total is not).
- `totalEaseMm`: `{ bust, waist, hip, upperArm }`, for FR-VAL-03 later.
- Lengths passed through by name: `backLengthMm`, `frontLengthMm`, `hipDepthMm`, `armLengthMm`, `shoulderWidthMm`, `skirtLengthMm` (undefined when the spec has no `skirt`).

Rules: pure, no mutation (inputs are deep-frozen in tests), no randomness. If `spec.fabricType !== "woven"` (only reachable by bypassing the schema) throw `DraftingError("FABRIC_NOT_SUPPORTED", ...)`. Validating measurement ranges is not its job (`validateMeasurements` does that).

## Tests

Vitest in `packages/engine`, using `egyptianSizeChart` size M from `@tafsila/test-fixtures` (`fromStandardSize` or the fixture measurements), numbers to +/- 0.01.

Unit:

1. Regular + semi-fitted, size M gives exactly: `bustQuarterMm` 260, `bodiceWaistQuarterMm` 205, `hipQuarterMm` 272.5, `skirtWaistQuarterMm` 205; `styleEaseMm` = bust 0, bodiceWaist 0, skirtHip 10, skirtWaist 20, sleeveBicep 0, acrossBack 0. (AC: SRS example values.)
2. Fitted + fitted size M: bust total 50, waist 10, hip 20; loose + loose: bust 150, waist 100, hip 110.
3. Skirt lengths for size M (K 570, F 1000): mini 390, knee 570, midi 742, ankle 935.5, floor 980. `lengthMm: 650` wins over `length: "floor"`. No `skirt` gives `skirtLengthMm` undefined.
4. Errors: `lengthMm: 90` and `lengthMm: 1100` throw `SKIRT_LENGTH_OUT_OF_BODY`; K 700 / F 800 throws `SKIRT_LENGTH_INVALID_BODY`; `fabricType: "knit"` (cast) throws `FABRIC_NOT_SUPPORTED`.
5. Table rules: every cell is finite and >= 0; profile order fitted <= regular <= loose in every line.
6. Sync test: for size M, `referenceDrafts.M.bodiceBack["bodice.back.underarm"].x` x 4 minus bust, and `referenceDrafts.M.skirtBack["skirt.back.hipSide"].x` x 4 minus hip, equal the `BLOCK_BUILT_IN_EASE_MM` bust (80) and skirtHip (40). This fails if #122 constants and the engine's copy ever drift (`DRAFT_CONSTANTS` is not exported from the fixtures package, so the test reads the reference points).

Property (fast-check, `arbMeasurements()` and `fc.constantFrom` for fit and profile): 7. Widening: for the same measurements and fit, every width (`bustQuarterMm`, `bodiceWaistQuarterMm`, `hipQuarterMm`, `skirtWaistQuarterMm`, `sleeveBicepHalfMm`) is non-decreasing fitted -> regular -> loose. (AC.) 8. Never negative: for any measurements, profile and fit, every `totalEaseMm` value is >= 0 and every width >= the body measurement / 4 (or / 2). (AC, FR-VAL-08.) 9. Every length option resolves inside the body: for any measurements with F - K >= 150, mini < knee < midi < ankle < floor <= F, and mini > 0. (AC.) 10. Purity: results equal on a second call; deep-frozen inputs do not throw.

e2e / visual: none (no UI, no geometry). API/OpenAPI/Postman/seed: none.

Manual test cases: none (no UI). Merna approves the numbers from the tables above in the PR (acceptance criterion).

## Decisions (the build writes `docs/decisions/126-ease-tables.md`)

1. Table stores total ease (matches SRS and FR-VAL-03); `resolve` subtracts the blocks' built-in ease. No ease is applied twice.
2. Numbers in the tables above; the regular column is SRS §6.2 and the 40/20/30 modifiers are proposals for Merna's review (cheap to change: one constant file).
3. `bodice.fit` is an additive modifier in mm on bust, waist and hip; `semi-fitted` is neutral.
4. Skirt lengths use named offsets and shares (table above); an explicit `lengthMm` wins.
5. Ease file is `src/constants/ease.ts` (the SRS said `src/ease.ts`; CLAUDE.md and the engine README put constants in `src/constants/`).

## Docs to update

- `docs/engine/README.md`: section "Ease tables and resolve" with the ease table, the modifier table, the built-in ease table, the skirt length table and a short "ease is never added twice" note; update the pipeline row for `resolve`.
- `docs/SRS.md` §6.2 as above.
- Decision file, plan file, learning-log row. Handbook glossary entry "ease" (Arabic "راحة") if missing.

## Risks

- **Regular skirt is wider than the #122 reference skirt.** The reference skirt has only built-in ease (hip quarter 270, waist quarter 200 for size M); regular resolve gives 272.5 and 205. The skirt block issue (#131) must compare against the reference after setting the style ease to 0 (the resolved `styleEaseMm` makes this explicit), or Merna may prefer to regenerate the reference with the SRS values. Not done here to keep this PR to the resolve step; noted in the decision file.
- **Fit modifier double counts with the profile if both say "loose".** Intended (loose profile + loose fit is the loosest garment); the totals stay finite and are tested.
- **Numbers are proposals.** Only the regular column comes from the SRS; Merna approves the rest in the PR. A change touches one file and the README table.

## Size and labels

S (unchanged). `build:sonnet` (unchanged; plain data, one pure function, table-driven tests). `node scripts/needs-interactive.mjs` on the files to create/change returned `no`, so no `needs:interactive`.
