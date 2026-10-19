## Plan: #146 sewing order (FR-PAT-06, NFR-06)

**Build gate:** depends on #144 (assembly / waist seam) and #145 (pockets, belt, lining), both still open. The build starts only after both are merged: the coverage property runs across the whole catalogue, and their modules contribute steps here. The build reads `docs/decisions/144-*.md` and `145-*.md` for their piece and edge ids.

### Approach

`PatternResult.sewingOrder` and `sewingStepSchema` (`order`, `action: sew|press|finish|attach`, `edges: string[]`, `text: {ar,en}`) already exist in `packages/schemas/src/pattern.ts`. Today step 7 (`sewingOrder` in `pipeline/steps.ts`) does nothing and `toResult` hard-codes `[]`. **No schema or API contract change.**

1. **Contributors.** Add an optional hook `sewingSteps?(ctx: DraftContext): readonly SewingStepDraft[]` to `FeatureModule`. The bodice block is not a module, so it gets a block contributor (`BLOCK_SEWING_STEPS: Record<BlockName, contributor>`, next to `BLOCK_DRAFTERS`). Contributors run on the **final** context (after finishing, layout and validate). They read the real pieces and edges, so they only emit refs that exist (a princess, closure or slit may have reshaped the block). A contributor never edits another module's steps.
2. **Draft shape** (`src/sewing/types.ts`): `{ phase: SewingPhase, key: SewingTextKey, action, edges: readonly string[], takesOver?: true }`. Text comes only from the catalogue key, never a free string.
3. **Phases** (`SEWING_PHASES`, in order): `prepare, darts, shoulders, neckline, sleeves, side-seams, waist-seam, closure, waistband, hem, finish`. `waist-seam` is added to the issue's list: a waist-seam dress with a centre-back zip must join bodice and skirt **before** the zip runs across the waist (decision 1 below).
4. **Assembler** (`src/sewing/assemble.ts`, pure):
   - Collect the drafts: bodice block first (rank -1), then the applying modules in registry order (`order`, then `id`), keeping each contributor's emission order.
   - Apply takeovers: a draft with `takesOver` (closure on its opening line, slit on its seam, in-seam pocket) removes its joined pairs from every other draft. A draft left with no edges is dropped. Two takeovers of the same pair throw `DraftingError("SEWING_STEP_CONFLICT", refs)`.
   - Stable-sort by (phase index, contributor rank, emission index), then number from 1 with no gaps.
   - Check coverage. If a paired edge is not covered exactly once, throw `DraftingError("SEWING_PAIR_UNCOVERED" | "SEWING_PAIR_DUPLICATED", refs)`. This is a programming error, the same policy as `PIPELINE_UNSUPPORTED_COMBINATION`.
   - The pipeline step becomes `sewingOrderStep(registry)` (like `modulesStep`). It stores the result with a new `withSewingOrder` on the context (`sewingOrder?: readonly SewingStep[]`), and `toResult` copies it. `refusedResult` keeps `[]`.
5. **Refs** (`src/sewing/refs.ts`): edges are `piece/edge`, the same format as FR-VAL-01. Darts are `piece/dart:<dartId>`. A whole piece (fuse interfacing, make the belt) is a bare `piece`. Extract `edgeRef` and the unique-pair collection out of `validation/rules/seam-match.ts` into `src/pieces/edge-pairs.ts` (`uniqueEdgePairs(pieces)`, `pairKey`). seam-match and the sewing coverage both use it, so the code is not duplicated.
6. **Coverage rule** (`src/sewing/coverage.ts`, exported from the package index for #147's suite): for each unique pair (a self pair counts once), count the steps with action `sew` or `attach` whose `edges` contain both refs. The count must be exactly 1. `sewingCoverage(result) → { ok, uncovered[], duplicated[] }`.
7. **Catalogue** (`src/sewing/catalogue.ts`): `SEWING_TEXT: Record<SewingTextKey, LocalizedText>`. The Arabic is plain, in the feminine imperative already used in the engine ("خيّطي", "علّقي"), and uses the piece names in `src/i18n/pieces.ts`. Seam pressing goes into the sew text ("... واكوي الخياطة مفتوحة"). A separate `press` step is used only where it is a real stage (darts, levelling the circle hem). `CIRCLE_SKIRT_HEM_LEVELLING_NOTE` becomes the circle skirt's hem-phase `press` step text, through a catalogue entry that points to the constant.

### Contributions (phase → step)

| Contributor                                           | Steps                                                                                                                                                                                                                                                                                                                                            |
| ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| bodice block (`blocks/bodice/sewing.ts`)              | darts: sew darts (dart refs) + press darts · shoulders: shoulder seams · side-seams: bodice side seams · sleeves: bind armholes when the armhole edge has no `pairsWith` (sleeve none, decision 134) · hem: blouse hem when the hem edge is unpaired                                                                                             |
| princess / dart-free (`modules/bodice/sewing.ts`)     | darts: sew princess seams (panel pairs); dart-free emits nothing                                                                                                                                                                                                                                                                                 |
| neckline                                              | prepare: fuse facing interfacing · neckline: facing shoulder seams, attach facing to neck · finish: understitch and tack the facing                                                                                                                                                                                                              |
| collar                                                | prepare: fuse · neckline: sew collar outer edges (shirt: fall to stand), attach collar to neck                                                                                                                                                                                                                                                   |
| set-in sleeve (`blocks/sleeve`)                       | prepare: ease-stitch the cap · sleeves: attach the sleeve to the armhole · side-seams: underarm seam · hem: sleeve hem unless a cuff applies                                                                                                                                                                                                     |
| sleeve styles                                         | prepare: gather the puff cap / bishop hem; sew the cap or flutter self-lining · sleeves: attach; bind the rest of the armhole (decision 142, 3)                                                                                                                                                                                                  |
| cuff                                                  | hem: cuff ends, attach the cuff, or sew the casing and thread the elastic                                                                                                                                                                                                                                                                        |
| skirt block, shape, gathered, pleated, tiered, circle | prepare: gather the top / fold and baste the pleats · darts: skirt darts · side-seams: side, panel, CB/CF seams; tier rings, then gather and join the tiers · hem: hang and level (circle), then hem                                                                                                                                             |
| slit                                                  | side-seams (takeover): sew the seam to the slit notch · hem: finish the slit facing                                                                                                                                                                                                                                                              |
| assembly #144                                         | waist-seam: attach the bodice to the skirt                                                                                                                                                                                                                                                                                                       |
| closure                                               | zip (takeover of every pair on the opening line, shell and facings): closure: sew the seam below the zip notch and insert the zip. A side zip takes the side pair: "sew both side seams, leave the left side open above the notch". Buttons: prepare: fuse · closure: attach the front facing (extension pair) · finish: buttonholes and buttons |
| waistband                                             | prepare: fuse · waistband: band ends, attach the band or waist facing, elastic casing                                                                                                                                                                                                                                                            |
| pockets / belt / lining #145                          | per decision 145. Patch pocket: prepare (hem the top, press the edges), attached in darts (flat). In-seam pocket: side-seams takeover. Belt: prepare (whole piece). Lining: assembled in side-seams, attached in the phase of the edge it joins                                                                                                  |

### Files to create / change

- Create: `packages/engine/src/sewing/{types,catalogue,assemble,coverage,refs,index}.ts`, `packages/engine/src/pieces/edge-pairs.ts`, `packages/engine/src/blocks/bodice/sewing.ts`, and a `sewing.ts` beside each module listed above (wired into its `module.ts`).
- Change: `src/pipeline/{feature-module,steps,draft-context,generate-pattern}.ts`, `src/blocks/index.ts`, `src/validation/rules/seam-match.ts`, `src/errors/drafting-error.ts` (`SEWING_ERROR_CODES`), `src/index.ts`, `src/version.ts` (minor bump: output changes for every input), each module's `module.ts`.
- Tests: `src/sewing/*.test.ts`, `src/sewing/sewing-order.property.test.ts`, `src/sewing/sewing-order.snapshot.test.ts` with `src/sewing/__snapshots__/<design>.txt`, and an update to `src/pipeline/generate-pattern.test.ts`.
- No data, migration, OpenAPI or Postman change. The engine is not served by the API yet (no `sewingOrder` use in `packages/api` or `apps/web`).

### Test plan

- **Unit (assemble):** three fake contributors over phases [hem, darts, prepare] come out sorted prepare → darts → hem, with `order` = 1..3. A phase tie keeps rank and then emission order. A takeover removes the pair from the side-seams draft and drops it when empty. Two takeovers of one pair throw `SEWING_STEP_CONFLICT`. An unclaimed pair throws `SEWING_PAIR_UNCOVERED`. A pair in two sew steps throws `SEWING_PAIR_DUPLICATED`. The same input gives a deep-equal output (determinism).
- **Unit (coverage/refs):** a self pair (`skirt-back/cb ↔ skirt-back/cb`) is covered by one step. Dart refs never count as a pair. `parseRef` handles all three ref forms.
- **Unit (catalogue):** every key has non-empty `ar` and `en`. `ar` has no Latin letters. Every key is used by at least one contributor.
- **Unit (contributors):** `dartedBlouse` size M gives exactly [fuse facing, sew darts, press darts, shoulders, facing shoulders, attach facing, bind armholes, side seams, CB seam + zip, hem, understitch facing] (keys and actions asserted). `vNeckHalfCircleDress` has the waist-seam step before the closure step and the levelling `press` step before the hem.
- **Property (fast-check):** `constantFrom(every DesignSpec exported from @tafsila/test-fixtures designs) × constantFrom(SIZE_MATRIX)`, plus an enumerated cross of closure type × position × skirt type × `waistSeam` × sleeve type × cuff (refused inputs skipped). For each: `sewingCoverage(result).ok`; `order` is 1..n with no gaps; every ref resolves to an existing piece, edge or dart; `patternResultSchema` parses. This is AC 1 and AC 2. #147 adds `sewingCoverage` to its `arbDesignSpec` suite.
- **Snapshot (reviewed text):** one `.txt` per seed design at size M listing the numbered steps, Arabic then English. Merna reviews the Arabic in the PR (AC 3).
- **E2E / visual:** none. Geometry is unchanged, so the SVG snapshots stay as they are.
- **Manual test cases** (`docs/test-cases/engine/146-sewing-order.md`):
  - TC-ENG-146-01: read the step list of each seed design; the Arabic is plain and uses the glossary words.
  - TC-ENG-146-02: follow the steps for `vNeckHalfCircleDress`; no step needs a seam that is not sewn yet.
  - TC-ENG-146-03: same check for `buttonFrontBlouse` and `elasticGatheredSkirt`.
  - TC-ENG-146-04: during the next sew-test, sew a toile in the printed order and note any step that had to move.

### Docs to update

- `docs/engine/README.md`: a "Sewing order" section with the phases table, the ref grammar, takeover and the coverage rule (AC 4).
- `docs/design/copy.md`: glossary rows for the sewing words (seam, dart, hem, facing, interfacing, press, gather, bind, zip, buttonhole).
- `docs/decisions/146-sewing-order.md`.
- `docs/test-cases/engine/146-sewing-order.md`.
- SRS FR-PAT-06: one line pointing to the phases. No requirement change.

### Decisions (the build logs them in `docs/decisions/146-sewing-order.md`)

1. Add a `waist-seam` phase between `side-seams` and `closure`, so a centre-back zip crosses an already joined waist.
2. Use a per-module `sewingSteps` hook plus a bodice block contributor, run on the final context.
3. Ref grammar: `piece/edge`, `piece/dart:<id>`, bare `piece`.
4. Takeover resolves zip, slit and in-seam pocket seams. Conflicts, gaps and duplicates throw `DraftingError` (programming errors, caught by the property tests).
5. The neckline phase stays before the closure phase (the facing ends are turned over the zip tape in `finish`). The sew-test may move this.
6. Bump `ENGINE_VERSION` by one minor version.

### Risks

- **Catalogue gaps on rare combinations crash `generatePattern`.** Handled by the enumerated property cross, by the seed designs × the size matrix, and by #147's full suite.
- **Ordering that does not match real sewing** (collar vs zip, flat sleeve vs set-in-round). Handled by the phase table in the README plus TC-ENG-146-04, and by keeping `needs:sew-test` thinking in the decision. No geometry depends on the order.
- **#144 or #145 ids differ from this plan.** Handled because contributors match on edge ids from those decisions; the build adapts the table and does not re-plan.
- **Arabic wording.** Handled by Merna approving the snapshot text in the PR; the strings live in one catalogue file.

**Size:** M (about 20 small contributors and one assembler; no geometry). **Build:** `build:sonnet` kept. The plan fixes every design choice; the work is wide but shallow.
`needs-interactive.mjs` → `no`.

## Deviations

- **Classifier instead of about 20 contributor files.** The edge ids of the finished pieces already say what a seam is, so one rule table (`src/sewing/rules.ts`) maps each seam to a catalogue key, and a second function finds the piece-level jobs (fuse, gather, darts, hem). There is no `sewingSteps` hook on `FeatureModule` and no `BLOCK_SEWING_STEPS`. Each catalogue entry holds its own phase and action, and the catalogue key order is the order inside a phase.
- **No takeover mechanism.** The first matching rule claims a seam, so a zip, slit or pocket cannot double-cover one; `SEWING_PAIR_DUPLICATED` still guards it. A seam no rule knows falls to the generic `other-seams` step, so `generatePattern` never crashes on a new module; the coverage property still checks every catalogue design.
- **Zip notch text** is in the catalogue text only; the closing of the left side above the notch is not modelled per edge.
- **Property cross:** the property runs over every design in `@tafsila/test-fixtures` times `SIZE_MATRIX`, not over an extra enumerated cross of closure x skirt x sleeve (that belongs to #147's `arbDesignSpec`).
- **Not asserted:** `patternResultSchema.parse` of the whole result (one existing princess-armhole `cutPath` fails the schema, unrelated); each step is parsed with `sewingStepSchema`.
- **Lining/pocket/facing finer steps** (pocket attach to the side seam, lining attach at its joined edge) are folded into `lining-seams` and `pocket-bag`.
