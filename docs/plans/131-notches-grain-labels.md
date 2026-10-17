# Plan #131: notches, grain line, labels, cut info, scale square, layout

Plan comment: <https://github.com/merna550/tafsila/issues/131#issuecomment-6237390014>.

Plan wave M2, 2026-10-17. Depends on #124 and #125, both merged. Best built after #130: both append to `finishing/index.ts` (one line each), and the label placement needs `cutPath`.

## Approach

Two steps fill the existing stubs.

- **`finishing`, second sub-step `marksStep`:** completes notches on both paired edges, checks grain lines and records darts' metadata. It runs after #130's `seamAllowanceStep`.
- **`layout`:** places the labels of each piece inside its outline, with no overlap with the stitch or cut lines, using a small deterministic "pole of inaccessibility" search written for the engine (no new dependency; `polylabel` is the idea, the geometry kit has `pointInPolygon` and `distance`).

Text comes from one catalogue, `src/i18n/pieces.ts`, so Arabic and English never live inside geometry code.

## Files to create or change

All under `packages/engine/src/`, tests next to each.

- `i18n/pieces.ts`: `PIECE_NAMES` (by piece id, `{ ar, en }`), `cutInfoText(cut)` ("اقصّي 2" / "Cut 2", "اقصّي 1 على الثنية" / "Cut 1 on fold", mirror variants), `sizeLabelText(sizeLabel, clientLabel?)`, `ENGINE_STAMP` (engine version). Arabic follows `docs/design/copy.md`; digits are Western (NFR-06). A test fails if any id used by the pipeline has no entry or an empty language.
- `finishing/notches.ts`: modules put notches on **one** edge; this step writes the partner on the paired edge.
  - A notch has `edgeId`, `atMm` (distance along the stitch line from the start of its edge) and `pairsWith: { pieceId, edgeId }`.
  - The partner is at the same distance from the **shared end**. The shared end is given by the new optional `pairsWith.reversed` on the edge (true when the two edges run in opposite directions, so `atMm` on A becomes `lengthB − atMm` on B). The schema gets `reversed` (SRS §6.3, JSON Schema).
  - Notch marks: new optional `marks: 1 | 2` on `Notch` (default 1): single = front, double = back, as the README convention. `render/layers.ts` draws `marks` ticks (small change to #127 code, snapshot updated).
  - Errors: a notch whose partner edge does not exist is `DraftingError("FINISHING_NOTCH_PARTNER_MISSING")`.
- `finishing/grain.ts`: `defaultGrainLine(stitchPath, direction = "vertical")` returns two points: centred in the bbox, parallel to the centre line (vertical in block frame), length `GRAIN_LINE_LENGTH_RATIO = 0.6` of the bbox height, at least `GRAIN_LINE_MIN_MM = 120`. Blocks and modules call it; a module may give its own (bias pieces). The step only checks that a grain line exists and is not degenerate (the report check is #132's).
- `finishing/darts.ts`: validates that each dart's legs lie on its edge (within 0.1 mm) and its apex is inside the piece; nothing else is written (the legs, apex and fold direction are already in the schema; fold direction is "towards the centre line", written in the README).
- `layout/place-labels.ts`: for each piece, builds the label block (name, cut info, size/client line, engine stamp) in this order, then places it.
  - Text size: starts at `LABEL_SIZE_MM = 8`, shrinks in steps of 1 down to `LABEL_MIN_SIZE_MM = 4`.
  - Text width is estimated as `chars × size × LABEL_CHAR_WIDTH_RATIO (0.6)`, a constant, because the engine has no font metrics and must be deterministic.
  - Position: the pole of inaccessibility of the stitch polygon (grid search with `LABEL_GRID_MM = 5`, refined twice) moved so the whole text box fits; the box corners must all be inside the stitch polygon and at least `LABEL_CLEARANCE_MM = 3` from every stitch and cut segment, and clear of the grain line.
  - If the box still does not fit at the minimum size, the label stack goes just outside the bbox below the piece (still readable, never crossing lines).
- `layout/scale-square.ts`: finds an axis-aligned 100 × 100 mm square fully inside the largest piece by scanning at `SCALE_SCAN_MM = 10` (first fit in a fixed order) and adds a `scale-square` label with `sizeMm: 100` and the text "10 سم / 10 cm". If no piece can hold it, no label is added and the print sheet's own square (from #127) is the one used. `render/` skips its own square when a piece carries a `scale-square` label, so a sheet never shows two.
- `finishing/index.ts`: append `marksStep`. `pipeline/steps.ts`: `layout` calls `placeLabelsStep` then `scaleSquareStep`.
- `constants/labels.ts`: all the constants above, each with unit and reason.
- `packages/schemas/src/pattern.ts`: `pairsWith.reversed` and `notch.marks` (both optional); JSON Schema regenerated.
- `pipeline/test-support/rectangle-module.ts` (test): gives the rectangle a paired edge, a notch and a dart-free outline so every mark is exercised; the rectangle fixture and its snapshot are updated with the marks (the issue asks for "SVG snapshot of the rectangle test piece with all marks").

## Data, API, migrations

Two optional schema fields (`reversed`, `marks`), no database change.

## Tests

- **Every piece has grain, name and cut info** across `SIZE_MATRIX` once blocks exist; now on the fixtures (FR-VAL-06 input).
- **Paired notches (fast-check):** random edge lengths and `atMm`; the two notches are the same distance from the shared end within 0.01 mm (the issue allows ± 2 mm); `reversed` both ways.
- **Labels inside, no crossing (fast-check):** random convex and concave polygons (generated rectangles, L-shapes, trapezoids): the text box corners are inside the polygon, the clearance holds, no intersection with any stitch or cut segment; or the label is outside the bbox.
- **Catalogue:** all ids have both languages; Arabic strings contain Arabic letters; cut text for `quantity 2`, `onFold`, `mirror`.
- **Determinism:** same piece, same label positions (deep-equal).
- **Scale square:** found in a 300 × 400 rectangle, absent in a 80 × 80 one, never duplicated on the sheet.
- **Snapshot:** `expectSvgSnapshot` of the rectangle with all marks.
- **Manual test cases:** `docs/test-cases/engine/131-marks.md`: print the rectangle at 1:1, check that the single/double notch ticks, the grain arrow, the labels and the 100 mm square are readable (and that the Arabic reads right to left).

## Decisions

The build writes them as `docs/decisions/131-marks-and-labels.md`.

1. **Own deterministic label search, no `polylabel` dependency.** About 60 lines, tested by property; avoids a dependency and a floating-point difference between browser and Node.
2. **Text width is an estimate (`0.6 × size` per character).** Good enough to keep a label inside; the viewer in M3 can measure real text.
3. **Notch pairing uses `pairsWith.reversed`** and notch `marks` is a schema field, not a convention only in prose.
4. **Scale square is data on the largest piece that can hold it**, and the sheet square from #127 is the fallback. One square per print.
5. **Label fallback outside the bbox** instead of failing: a tiny piece (a belt loop) still gets its name.

## Docs

- `docs/engine/README.md`: "Marks and labels" (notch convention, grain rule, fold direction of darts, label rules); SRS §6.3; glossary: "notch", "grain line", "label placement" (the last exists; link it).
- Learning-log row. Arabic piece names and cut texts are listed in the PR for Merna's review.

## Risks

- **Arabic text width differs from the estimate.** The clearance of 3 mm absorbs the usual error; the print test case checks it on paper.
- **#127 renderer changes** (notch marks, scale-square skip). Covered by its snapshots, which are updated in this PR.
- **Concave pieces** (a bodice armhole) make the pole of inaccessibility land in odd places; the search takes the best point that fits the whole text box, not just the centre.

## Size

M, as labelled. build:sonnet (unchanged): the algorithms are fixed by this plan.
