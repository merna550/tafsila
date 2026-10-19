## Implementation plan

**Build after #144 is merged** (it owns the dress/blouse/skirt assembly, the one-piece dress piece ids, the waist level on a one-piece dress and the 3 seed designs the acceptance criteria name). Where this plan names a piece id that #144 may rename, the build uses #144's ids.

### Approach

Three late feature modules, each pure, each owning its constants, rules and tests (method: Aldrich 6th ed., ch. on pockets, belts and linings; cited in JSDoc and in `docs/engine/drafting-method.md`):

| Module   | Order                                              | What it does                                                                 |
| -------- | -------------------------------------------------- | ---------------------------------------------------------------------------- |
| `pocket` | 45 (after waistband 40, before closure 50)         | Side-seam bags or patch pockets, with notches / placement marks              |
| `belt`   | 46                                                 | Self-tie strip pieces, split at fabric width                                 |
| `lining` | 60 (after closure, so it copies the final opening) | Lining copies of the shell pieces, trimmed at the facings, raised at the hem |

**Pockets (`pockets: ["side-seam"]`).**

- The side seam is found by stable ids through the existing side `openingChain` (bodice, princess side panel, skirt, skirt panel, tiers). It moves from `modules/closure/targets.ts` to a shared `src/pieces/seam-chain.ts` because modules must not import each other. The closure module imports it from there with no behaviour change, and its tests stay green.
- The opening runs from `POCKET_OPENING_TOP_BELOW_WAIST_MM` (40) to that + `POCKET_OPENING_MM` (160), measured down the side from the waist. On a waist-seam dress or a skirt, the waist is the top of the skirt link. On a one-piece dress it is the waist level from #144.
- A notch at each end goes on `{skirt|dress}-front/side`. `notchStep` writes the back partners, and FR-VAL-04 checks them within 2 mm.
- Bag pieces: `pocket-bag-front` and `pocket-bag-back`, each cut 2 as a mirrored pair, main fabric. Each has:
  - a straight `along-side` edge (opening + 2 × `POCKET_BAG_EXTENSION_MM` 20), carrying notches at the opening ends;
  - a rounded `outer` edge, `POCKET_BAG_DEPTH_MM` (180) wide, with corner radius `POCKET_BAG_CORNER_RADIUS_MM` (40). The two `outer` edges pair with each other (FR-VAL-01).
- `along-side` pairs with nothing, the same way the closure facings' `along-*` edges work (decision 143, 4).
- Rule `POCKET_OPENING_MATCH` (FR-VAL-04): the distance between the bag notches equals the distance between the shell notches within 2 mm.

**Pockets (`pockets: ["patch"]`).**

- Piece `patch-pocket`, cut 2, main fabric: `PATCH_POCKET_WIDTH_MM` (150) × `PATCH_POCKET_HEIGHT_MM` (170).
- The top edge is kind `hem` with a fold of `PATCH_POCKET_HEM_MM` (30), using the per-edge allowance table. The other edges are kind `other` and get the 10 mm turn-under.
- On the front shell piece below the waist go four `pocket-placement` line marks (dashed corners). Placement:
  - top: `PATCH_TOP_BELOW_WAIST_MM` (80) below the waist;
  - centre: at `PATCH_CENTRE_SHARE` (0.5) of the front hip half-width from the centre line, plus the button extension when there is one.
- A fold piece shows one placement, which mirrors when it is cut. The words on the mark say "both sides".

**Allowed combinations (data, `modules/pocket/compatibility.ts`, `POCKET_MATRIX`).**

- Side-seam is allowed on straight, A-line, half/full circle, gathered and pleated skirts, including a dress skirt and a one-piece dress.
- Side-seam is refused on: tiered (a tier seam crosses the bag), blouse (no hand room below the waist), and any side zip (the zip owns the left side seam).
- Patch is allowed on straight and A-line skirts, a dress skirt, a one-piece dress and a blouse.
- Patch is refused on pleated, gathered, tiered and circle skirts (the fabric folds under it).
- A refusal is the input error `POCKET_UNSUPPORTED`: a bilingual `fail` with no pieces (decision 128 pattern, same as `CLOSURE_UNSUPPORTED`).
- A combination that is allowed but does not fit is the input error `POCKET_NO_ROOM`. Cases:
  - the opening or the patch plus `POCKET_HEM_CLEARANCE_MM` (50) reaches below the hem;
  - a blouse front is too short;
  - a side slit's top is above the pocket bottom + clearance.

**Belt (`belt: "self-tie"`).**

- Finished length = waist + `BELT_WAIST_EASE_MM` (20) + 2 × `BELT_TIE_LENGTH_MM` (450). Finished width `BELT_WIDTH_MM` (40), cut double (folded strip) through the existing `src/pieces/strip.ts` (`loop: false`, unpaired sewn edge, ends turned in).
- It runs across the grain. When the cut length plus 2 end allowances exceeds `fabricWidthMm`, it splits into the fewest equal pieces `belt-1..n` that fit. The joining ends pair with each other, so FR-VAL-01 checks every join.
- Rule `BELT_LENGTH` (FR-VAL-01): the sum of the run lengths equals the finished length within 2 mm.
- Allowed for every category. No belt loops in v1.

**Lining (`lining: true`).**

- What gets lined: every main-fabric shell piece (`bodice-*`, princess panels, `skirt-*`, skirt panels, `tier-*`, circle pieces, #144's one-piece dress pieces). Each is copied as `lining-<pieceId>` with `cut.fabric: "lining"`, the same quantity, fold and mirror, and its darts and marks.
- Edge ids stay. Pairs and notches are remapped to the lining twins, so lining side ↔ lining side and lining shoulder ↔ lining shoulder are checked by the core rules.
- What is not lined: sleeves, collars, cuffs, bands, facings, interfacings, pockets and belt.
- Trimmed at the facings: where a neck facing, a closure facing (decision 143, 4) or a traced waist facing (decision 140, 1) covers a shell edge, that part of the lining outline is replaced by the facing's outer edge. These are the same shell-space segments the facing is traced from, cut with `src/geometry/intersect`.
  - The lining edge is `facing-<facing id>`. It pairs with the facing's outer edge, which becomes a sewn seam paired back to the lining. This is the "pairs with facings ≤ 2 mm" check, done by the core seam rule.
  - Where there is no facing, the lining keeps the shell edge:
    - waist seam: lining bodice ↔ lining skirt;
    - skirt waist under a waistband: basted to the shell waist, and paired with it;
    - sleeveless armhole: bagged to the shell armhole, and paired with it;
    - set-in sleeve armhole: basted to the shell armhole.
- Hem: the lining hem line is offset `LINING_HEM_RISE_MM` (25, the shell hem allowance less 5) towards the waist, using `offsetPath` (exact on circle arcs). It gets its own hem allowance `LINING_HEM_ALLOWANCE_MM` (20).
- Openings:
  - A centre zip seam on the lining is split into `cb-open` / `cf-open` (top to the zip stop, kind `other`, hand-sewn to the tape, paired with its mirror) and `cb` / `cf` below it.
  - A side zip splits the front lining side the same way.
  - Buttons: the lining stops at the button facing's outer edge (rule above).
- Panel skirts (gathered, pleated, tiered) are lined with copies of their panels, marks included (a uniform rule). The sew-test decides whether a straight lining under fullness is needed later.
- Rule `LINING_HEM_CLEARANCE` (FR-VAL-08 warn): the lining hem sits at least `LINING_HEM_RISE_MM − 2` above the shell hem everywhere.
- A missing facing or shell target throws `DraftingError` `LINING_TARGET_MISSING` with refs.

### Files to create/change

- `packages/schemas/src/pattern.ts`: mark kind `pocket-placement` (additive); regenerate the JSON Schema.
- `packages/engine/src/constants/{pocket,belt,lining}.ts`: every number above, with unit and source.
- `packages/engine/src/pieces/seam-chain.ts` (moved from `modules/closure/targets.ts`, `openingChain` + levels). Update `modules/closure/targets.ts` and its imports.
- `packages/engine/src/modules/pocket/{compatibility,side-seam,patch,rules,module,index}.ts` + `pocket.test.ts`, `pocket.property.test.ts`, `pocket.snapshot.test.ts`.
- `packages/engine/src/modules/belt/{belt,rules,module,index}.ts` + unit/property/snapshot tests.
- `packages/engine/src/modules/lining/{targets,trim,hem,opening,rules,module,index}.ts` + unit/property/snapshot tests.
- `packages/engine/src/pipeline/default-registry.ts` (3 modules), `pipeline/input-errors.ts` (`POCKET_UNSUPPORTED`, `POCKET_NO_ROOM`), `i18n/pieces.ts` (piece names ar/en: جيب، كيس الجيب، حزام، بطانة …), the bilingual messages for the new rule codes, and `render/` only if the `pocket-placement` style needs a case (dashed, like `pleat-placement`).
- `packages/engine/src/version.ts`: next minor after #144 (pockets, belt and lining options were ignored before, so their outputs change).
- `packages/test-fixtures/src/designs.ts`: `linedSidePocketDress` (lined, waist-seam, side-seam pockets, CB zip), `patchPocketSkirt` (straight + patch + self-tie belt), `linedCircleSkirt` (half circle + lining + side pockets). Mirror them in the seed data the same way #144 adds its seeds.

No database migration, no HTTP route and no OpenAPI/Postman change: the API does not draft or store patterns yet. `PatternResult` changes only through the additive mark kind.

### Test plan

**Unit.**

- Notch positions at 40 / 200 mm from the waist on skirt, dress-skirt and one-piece dress.
- Bag outline closed, and the `outer` pair equal.
- Patch size and hem fold allowance (30). Placement corners inside the front piece and clear of the CF extension.
- Every `POCKET_MATRIX` cell gives allowed or a stable bilingual `POCKET_UNSUPPORTED`.
- `POCKET_NO_ROOM` cases:
  - mini straight skirt + patch, size XS;
  - side slit 500 mm + side pocket;
  - tuck-in blouse + patch.
- Belt:
  - waist 700 → finished 1620 mm, one piece at fabricWidth 1500;
  - two pieces at 900, with paired join ends;
  - three pieces at 600.
- Lining:
  - `cut.fabric === "lining"` on every `lining-*` piece; none on facings/sleeves.
  - Neck edge replaced by the facing outer edge.
  - Hem raised 25 mm on straight and circle hems.
  - CB zip split into `cb-open` + `cb` at the zip stop.
  - Button front stops at the facing.

**Property (fast-check, size matrix × random design options).**

- Pocket notches align front/back within 2 mm (FR-VAL-04).
- The bag opening matches the shell notch distance within 2 mm.
- Every lining ↔ facing and lining ↔ lining pair is within 2 mm (FR-VAL-01).
- The lining hem is above the shell hem.
- Belt joined length within 2 mm. Every belt piece fits the fabric width.
- No dangling pairs or notch partners.
- All FR-VAL checks pass on the 3 #144 seed designs with each of: side-seam, patch, self-tie and lining, alone and combined, wherever the matrix allows.

**Snapshots (SVG per size, XS/M/XL).** The three new fixture designs, plus #144's dress seed with `lining: true`.

**Manual test cases (draft, `docs/test-cases/engine/145-pockets-belt-lining.md`).**

| ID               | Check                                                                                     |
| ---------------- | ----------------------------------------------------------------------------------------- |
| TC-POCKET-145-01 | Side-seam pockets on a straight skirt: notches match front/back on the print              |
| TC-POCKET-145-02 | Patch pocket on an A-line skirt: placement marks and hem fold                             |
| TC-POCKET-145-03 | Refusals: tiered + side-seam, pleated + patch, side zip + side-seam (bilingual message)   |
| TC-BELT-145-01   | Self-tie belt at 1500 mm fabric                                                           |
| TC-BELT-145-02   | Self-tie belt split at 900 mm                                                             |
| TC-LINING-145-01 | Lined waist-seam dress with CB zip: lining meets the neck facing, open above the zip stop |
| TC-LINING-145-02 | Lined half-circle skirt: hem rise                                                         |
| TC-LINING-145-03 | Lined CF-button blouse: lining stops at the button facing                                 |

**Sew-test.** Keep `needs:sew-test`: a lined waist-seam dress with side pockets in 3 sizes, logged in `docs/test-cases/engine/sew-tests.md`. Open the follow-up issue `test(engine): sew-test toiles for #145`.

### Docs to update

- `docs/decisions/145-pockets-belt-lining.md`.
- `docs/engine/README.md`: catalogue rows for pocket, belt and lining.
- `docs/engine/drafting-method.md`: a "Pockets, belt and lining" section.
- `docs/SRS.md`: §6.1 notes for the pocket matrix and unlined sleeves; FR-PAT-07 is now covered.
- Test-case file and index (`scripts/test-case-index.sh`).
- `docs/plans/145-pockets-belt-lining.md`, copied from this comment by the build.
- Learning log.

### Risks and handling

- **Clipping the lining at the facing can produce bad outlines** (V and sweetheart necks, and button facings that run into the neck facing, decision 143, 4).
  - Clip with the facing's own shell-space segments, not a new offset.
  - When there is no clean intersection, throw `LINING_TARGET_MISSING` with refs (never a silent fix).
  - Property tests run every neckline × closure.
- **Piece ids from #144 are not known yet.** Build after #144 merges. All lookups go through `seam-chain.ts` and the stable id lists, so an id change is one table.
- **Moving `openingChain` could break the closure module.** It is a pure move. The closure tests and snapshots must be unchanged in the same commit.
- **Lining every panel of gathered or tiered skirts uses a lot of fabric.** This is accepted for v1 and listed for the sew-test. Swapping in a straight lining later is a contained change in `lining/targets.ts`.
- **Snapshot churn when #144 also bumps `ENGINE_VERSION`.** Rebase on #144 and bump once more.

### Estimate, labels, and decisions

- **Size: L.** It is three modules, a shared-helper move and the lining clip geometry. The label is changed from M to L.
- **`build:opus` is kept.** The geometry is not trivial.
- **`needs-interactive`: no.**
- **Decisions (cheap to reverse; the build writes them as `docs/decisions/145-pockets-belt-lining.md`):**
  1. The pocket, belt and lining modules run at orders 45 / 46 / 60. The lining runs after the closure.
  2. `POCKET_MATRIX` is declarative. It refuses tiered/blouse/side-zip side pockets and patch pockets on fullness skirts.
  3. Pocket bags are main fabric, attached by notches on an unpaired `along-side` edge.
  4. A belt crosses the grain and splits at fabric width. There are no belt loops.
  5. Sleeves, collars, cuffs and bands are not lined. The lining is trimmed at every facing and pairs with the facing's outer edge.
  6. The lining hem rise is 25 mm, with a 20 mm lining hem.
  7. A zip opening in the lining is left open to the zip stop.
  8. `openingChain` moves to `src/pieces/seam-chain.ts`.
- No question for Merna.

## Deviations

- **Lining facing trim and zip opening moved to #226** (acceptance criterion 2, second half). The lining is a full copy of the bodice, skirt and tier pieces with the hem raised; where a facing covers a shell edge the lining is basted to the shell (its edge pairs with its own shell twin). Decision 145, 5 and 7 are as built, not as planned.
- Toile moved to #225 (needs:sew-test, #184).
- The lining drops notches and body lines (a copy would double the shell's circumference sums).
- `ENGINE_VERSION` 0.15.0 (the stamp is in every snapshot).
- `seam-chain.ts` also holds `atFromEdgeStart` (moved from the zip); `pieces/edge-allowance.ts` is the shared per-edge allowance setter.
- A patch pocket is refused (`POCKET_UNSUPPORTED`) on a princess-seamed one-piece dress or blouse: the front is split across panels.
- The belt example "waist 700, one piece at 1500 mm" in the plan is arithmetic-wrong (1620 mm finished); the tests use 3000 / 900 / 600 mm.
