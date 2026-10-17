# Plan #129: straight skirt block, front and back

Plan comment: <https://github.com/merna550/tafsila/issues/129#issuecomment-6237389491>.

Plan wave M2, 2026-10-17. Depends on #122, #124, #125 and #126, all merged. Physical QA: `needs:sew-test` stays until a toile is sewn in 3 sizes.

## Approach

One pure drafting function per half, built only from the reference construction in `docs/engine/drafting-method.md` ("Straight skirt, front and back"). A `FeatureModule` wraps it and adds both pieces to the context.

The block is drafted at the **built-in ease** of the method (hip `H/4 + 10`, waist `W/4 + 5`). The **style ease** from `resolveDraftInputs` is then applied as an explicit widening of the side seam, so the key points of the reference drafts stay checkable to ± 1 mm and the ease is never added twice (the rule in the method, "Ease already inside the blocks"):

- the side seam moves out by `styleEaseMm.skirtHip / 4` at the hip line and the hem;
- the waist side point moves out by `styleEaseMm.skirtWaist / 4`;
- style ease can be negative; the total never is (checked in #126).

## Files to create or change

All under `packages/engine/src/`, each with a `*.test.ts` file next to it.

- `blocks/skirt/draft-skirt-half.ts`: `draftSkirtHalf({ half: "front" | "back", measurements, inputs })` returns `{ stitchPath, keyPoints, darts, edges }`.
  - Points follow the method: waist centre `(0,0)`, hip centre `(0, hipDepth)`, hem centre `(0, skirtLength)`; `hipX = H/4 + 10 + styleHip/4`; waist side `x = hipX − (shaping − dart)` with `shaping = hipX − waistQ`.
  - Dart share: front 50 %, back 60 %; dart length front 90 mm, back 140 mm. The constants are in `constants/skirt-block.ts` (named, with unit and reason, as `drafting.md` requires).
  - The hem is the resolved `skirtLengthMm` (the reference uses waist-to-knee 570 mm for the block).
  - The side seam is one cubic from the waist side point through the hip side point (tangent vertical at the hip), then a line to the hem. It uses `curveThroughPoints`, not a new formula.
  - The waist is a line (the method has no waist curve; a curve is #140's concern).
- `blocks/skirt/skirt-module.ts`: `skirtBlockModule` (`id: "block-skirt"`, `order: 10`, `appliesTo: spec.skirt !== undefined`), which calls `resolveDraftInputs(ctx.spec, ctx.measurements, ctx.options)` itself. The `resolve` pipeline step is still an identity stub, so the module must not depend on it. Adds pieces `skirt-front` and `skirt-back`.
- `blocks/skirt/edges.ts`: the named edges `cf`, `cb`, `side`, `waist`, `hem`, with `pairsWith` (`skirt-front/side` ↔ `skirt-back/side`) and `intendedEaseMm: 0`. Each edge carries `kind`: `cf`/`cb` → `"fold"` (centre front on fold) or `"other"` (centre back seam), `side` → `"side"`, `waist` → `"other"`, `hem` → `"hem"`. The `kind` field is added to the schema by #130, see its plan; if #129 is built first, it adds the field (see Decisions).
- `constants/skirt-block.ts`: the dart shares and lengths above.
- `pipeline/default-registry.ts`: one line to register `skirtBlockModule`.
- `index.ts` of the engine: export `draftSkirtHalf`.

Centre back option: `spec.closure.position === "center-back"` makes the back piece `cut: { quantity: 2, onFold: false, mirror: true }` with a `cb` edge of kind `other` (a seam for the zip, SA applied by #130). Otherwise the back is cut on the fold. The front is always on the fold.

## Data, API, migrations

None.

## Tests

- **Reference points:** for S, M, XXL from `referenceDrafts` (`skirtFront`, `skirtBack`), every key point within ± 1 mm. Style ease is set to 0 in the test by drafting with inputs whose style ease is 0 (`draftSkirtHalf` takes plain inputs, so the test builds them).
- **Property tests (fast-check, `SIZE_MATRIX` including the 20 custom sets, including pear and apple bodies):**
  - waist and hip circumference of the two pieces = measurement + ease ± 5 mm (the FR-VAL-03 sum, computed here from the piece geometry);
  - side seams of front and back equal within 2 mm (FR-VAL-01);
  - dart legs equal within 1 mm;
  - the stitch path is closed and has no self-intersection (`selfIntersections` is empty).
- **Style ease:** with `loose` the hip is wider by exactly the style ease; with `fitted` it can be narrower, never below measurement.
- **Centre back option:** two mirrored back pieces and a `cb` edge.
- **SVG snapshot** of each chart size (`expectSvgSnapshot` from #127). Snapshots are reviewed by eye once.
- **Manual test cases:** `docs/test-cases/engine/129-skirt-block.md`, TC-ENG-129-01…06: check the SVG of S, M, XXL; print at 1:1 with `pnpm engine:print`; sew the 3 toiles and log the fit notes in `docs/test-cases/engine/sew-tests.md`.

## Decisions

The build writes them as `docs/decisions/129-skirt-block.md`.

1. **Built-in ease first, style ease as a widening.** Key points match the reference; the ease is added once.
2. **The module calls `resolveDraftInputs` itself** until a plan wires the `resolve` step. If #128 has wired it by then, use `ctx.resolved`.
3. **Edge `kind` on the schema.** The seam-allowance defaults in `EngineOptions` are keyed by edge kind, but edges carry no kind today. `Edge` gets an optional `kind: "side" | "neckline" | "armhole" | "hem" | "other" | "fold"`; the `fold` value means "no seam allowance". Whichever of #129 and #130 is built first adds this field (schema, JSON Schema export, SRS §6.3); the other reuses it.
4. **Piece and edge ids.** Pieces are `skirt-front` and `skirt-back`; edges are `cf`, `cb`, `side`, `waist`, `hem`. They are in the glossary of the engine README so #135 to #140 and #143 use the same names.

## Docs

- `docs/engine/README.md`: module catalogue row (`block-skirt`, not yet sew-tested) and the edge naming table.
- Handbook: glossary entries for "built-in ease vs style ease" if missing; learning-log row.
- Test cases file above; SRS FR-PAT-05 status unchanged.

## Risks

- **#128 builds the bodice in parallel and may choose different piece or edge naming.** Names here follow the key-point names of the drafting method. If #128 is merged first, align the edge `kind` usage with what it did; do not import from it.
- **Both blocks edit `default-registry.ts` and `index.ts`.** The conflict is one line each; keep both lines.
- **XXL front waist** (known limit in the method, derived chart): the front waist at the centre is lower than at the side. The draft must not self-intersect; the property test covers it. If it fails for XXL only, report it as a chart question, do not patch the geometry.
- **Waist darts with hip − waist very small (apple body):** the dart can become 0 or negative; clamp to 0 and omit the dart (a test case), never a negative dart.

## Size

M, as labelled. build:opus (unchanged).

## Build notes

- Built as planned, plus one addition: the front and back side seams are trued to equal length (decision 129-skirt-block, 5), because the method's dart shares leave the front side seam up to about 3 mm longer on pear bodies (FR-VAL-01 is 2 mm).
- `Edge.kind` came from #130; the plan's fallback (adding it here) was not needed.
- Design fixture `straightKneeSkirt` added to `@tafsila/test-fixtures` and to `pnpm engine:print`.
