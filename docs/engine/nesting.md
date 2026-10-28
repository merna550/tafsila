# Nesting (`packages/nesting`)

Pure package `@tafsila/nesting`. It holds the **piece preparation** (#315): `preparePieces(pattern, options)` turns a `PatternResult` and the fabric options into the exact shapes to lay on each fabric; and the **placement** (#316): `nest(prepared)` lays the shapes on the strip ([ADR-313](../decisions/313-nesting-algorithm.md)), `fabricLengthM` gives the length to buy and `buildMarkerScene` turns a layout into drawing data. `fabricResult(pattern, options)` runs all of it.

- Requirements: FR-FAB-01 (options), FR-FAB-02 (nesting), FR-FAB-05 (main, lining, interfacing apart), FR-VAL-08 (pieces wider than the fabric), NFR-08 (deterministic).
- Requirements also: FR-FAB-03 (shrinkage and pattern repeat), NFR-02 (3 s per fabric kind).
- Decisions: [ADR-312](../decisions/312-m5-scope.md) item 4 (fabric model), [ADR-313](../decisions/313-nesting-algorithm.md) (algorithm, tolerance, fold crossings), [decision 315](../decisions/315-nesting-preparation.md) (preparation rules), [decision 316](../decisions/316-nesting-placement.md) (placement, length and version rules).
- Dependencies: `@tafsila/schemas` and the engine's geometry entry `@tafsila/engine/geometry` only (dependency-cruiser rule `nesting-is-pure`). No `Math.random`, no clock.
- Try it: `pnpm --filter @tafsila/nesting print seedDress folded 140 M` lists the shapes of a fixture design; `pnpm --filter @tafsila/nesting print nest seedDress folded 140 M` lists the placements and the length to buy per fabric kind. `pnpm --filter @tafsila/nesting bench` times the slowest cases.

## Fabric options (`packages/schemas/src/fabric-options.ts`)

`fabricOptionsSchema` is shared by the browser and the API. Missing fields take their defaults (`DEFAULT_FABRIC_OPTIONS`).

| Field              | Values                                                                                  | Default  |
| ------------------ | --------------------------------------------------------------------------------------- | -------- |
| `widthMm`          | presets `FABRIC_WIDTH_PRESETS_MM` (900, 1150, 1400, 1500, 1600) or any value 500 – 3000 | 1400     |
| `layout`           | `folded` or `open`                                                                      | `folded` |
| `directionalNap`   | `true` or `false`                                                                       | `false`  |
| `shrinkagePercent` | 0 – 20                                                                                  | 5        |
| `patternRepeatMm`  | 0 – 1000                                                                                | 0        |

Shrinkage and repeat are used by the length step, not by the preparation or the placement.

## Frame

Every shape is in mm. **x runs along the selvedge** (the strip length) and **y across the fabric**. Each shape's box starts at (0, 0). In a folded layout **y = 0 is the fold** and the selvedges are at y = usable width.

## Steps

1. **Outline.** The cut path is flattened (the engine's `samplePath`), simplified with [Douglas-Peucker](../handbook/glossary.md#douglas-peucker) at 2 mm, then pushed **out** by 2 mm with the engine's mitred offset. The outline therefore always contains the real cut line (ADR-313 item 3).
2. **Grain.** The outline is turned so the piece's `grainLine` points along +x (the 0° turn). A belt or waistband whose grain runs across the piece keeps its own grain line (ADR-145). `allowedTurns` is `[0, 180]`, or `[0]` with directional nap.
3. **Fold pieces.** The fold line is read from the piece's `fold` edges (it runs along the grain). The outline is moved so the fold lies on y = 0 with the piece above it, then cut back to the fold (Sutherland-Hodgman). This also removes cut lines that cross the fold by up to 9 mm, such as the V-neck facing at the neck corner (ADR-313 item 5).
4. **Copies, by layout** (see the drawings below). `cut.quantity` counts the pieces sewn into the garment; a `mirror` piece's quantity counts left and right pieces.
5. **Width check.** A shape wider across the fabric than the usable width goes to `doesNotFit: { pieceId, widthMm, usableWidthMm, fitsOpen }` and is left out of the lists. `suggestOpen` is true when the layout is folded and a reported piece would fit the open fabric (the UI then suggests "open").
6. **Result.** `{ layout, usableWidthMm, main, lining, interfacing, doesNotFit, suggestOpen }`. Shapes are sorted by piece id, then copy number; ids are `<pieceId>#<n>`.

| Piece                     | Folded (usable width = fabric ÷ 2)           | Open (usable width = fabric)                       |
| ------------------------- | -------------------------------------------- | -------------------------------------------------- |
| On fold, quantity q       | q half shapes, fold edge on y = 0, `fold`    | q whole shapes (half + its mirror across the fold) |
| Mirrored pair, quantity q | ⌈q ÷ 2⌉ shapes, each cut through both layers | q shapes, every second one the mirror image        |
| Plain, quantity q         | q shapes                                     | q shapes                                           |

## Folded layout

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 260" width="640" role="img" aria-label="Folded layout: the fold at the bottom, the two selvedges together at the top; the bodice front half sits on the fold, the sleeve is cut once through both layers.">
  <rect x="20" y="20" width="600" height="200" fill="#f5efe6" stroke="#6b5b4b"/>
  <line x1="20" y1="220" x2="620" y2="220" stroke="#b03a2e" stroke-width="3" stroke-dasharray="10 6"/>
  <text x="24" y="242" font-size="13" fill="#b03a2e">fold (y = 0)</text>
  <text x="24" y="14" font-size="13" fill="#333">selvedges, both layers (y = usable width = fabric ÷ 2)</text>
  <path d="M40 220 L40 90 Q90 60 160 80 L250 80 L250 220 Z" fill="#d6e4f0" stroke="#1f4e79"/>
  <text x="70" y="160" font-size="13" fill="#1f4e79">bodice-front#1</text>
  <text x="70" y="176" font-size="11" fill="#1f4e79">half, on the fold</text>
  <path d="M290 200 L290 60 Q350 30 410 60 L410 200 Z" fill="#e3f0d6" stroke="#3d6b1f"/>
  <text x="300" y="130" font-size="13" fill="#3d6b1f">sleeve#1</text>
  <text x="300" y="146" font-size="11" fill="#3d6b1f">cut once = left + right</text>
  <line x1="450" y1="140" x2="590" y2="140" stroke="#333" marker-end="url(#a1)"/>
  <text x="450" y="132" font-size="12" fill="#333">grain along the selvedge (+x)</text>
  <defs><marker id="a1" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8 Z" fill="#333"/></marker></defs>
</svg>

## Open layout

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 300" width="640" role="img" aria-label="Open layout: one layer from selvedge to selvedge; the bodice front is unfolded into its whole shape, the sleeve pair is a sleeve and its mirror image.">
  <rect x="20" y="20" width="600" height="240" fill="#f5efe6" stroke="#6b5b4b"/>
  <text x="24" y="14" font-size="13" fill="#333">selvedge (y = usable width = fabric width)</text>
  <text x="24" y="282" font-size="13" fill="#333">selvedge (y = 0)</text>
  <path d="M40 240 L40 160 Q90 140 160 150 L250 150 L250 40 L160 40 Q90 50 40 30 Z" fill="#d6e4f0" stroke="#1f4e79"/>
  <line x1="40" y1="140" x2="250" y2="140" stroke="#1f4e79" stroke-dasharray="4 4"/>
  <text x="80" y="110" font-size="13" fill="#1f4e79">bodice-front#1</text>
  <text x="80" y="126" font-size="11" fill="#1f4e79">unfolded: half + mirror</text>
  <path d="M290 130 L290 40 Q350 20 410 40 L410 130 Z" fill="#e3f0d6" stroke="#3d6b1f"/>
  <text x="305" y="90" font-size="13" fill="#3d6b1f">sleeve#1</text>
  <path d="M290 150 L290 240 Q350 260 410 240 L410 150 Z" fill="#e3f0d6" stroke="#3d6b1f" stroke-dasharray="6 3"/>
  <text x="305" y="200" font-size="13" fill="#3d6b1f">sleeve#2 (mirrored)</text>
  <line x1="450" y1="150" x2="590" y2="150" stroke="#333" marker-end="url(#a2)"/>
  <text x="450" y="142" font-size="12" fill="#333">grain along the selvedge (+x)</text>
  <defs><marker id="a2" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8 Z" fill="#333"/></marker></defs>
</svg>

A mirrored copy is flipped across a line along the grain (y → −y), so its grain still points to +x and directional nap is kept.

## Tests

- Unit tests per rule: `packages/nesting/src/*.test.ts` (outline, grain, fold, copies, the whole preparation).
- Property tests over the fixture designs `seedDress`, `vNeckHalfCircleDress`, `setInSleeveBlouse`, `gatheredKneeSkirt`, `linedSidePocketDress` in sizes M and XXL, both layouts, 115 and 140 cm: shape count, grain parallel within 0.01°, fold shapes on y = 0, no negative y, every shape inside the usable width or reported, deterministic and independent of piece order; plus a snapshot of shape ids and sizes.
- Manual cases: [nesting preparation](../test-cases/engine/nesting-preparation.md).

## Placement (`nest`)

Each fabric kind (main, lining, interfacing) has its own strip: `usableWidthMm` across (y) and open along x.

1. **Column profile.** The strip is cut into columns 3 mm wide (`SLICE_MM`). Each shape, in each allowed turn, becomes a list of covered y-intervals per column (`columnProfile`). A column covers every y the outline reaches **anywhere inside the column** (computed per trapezoid between corners), so a profile always contains its shape and two profiles that do not overlap mean two outlines that do not overlap (decision 316 item 5). The strip keeps the same intervals per column (`Occupancy`).
2. **Turns.** 0°, and 180° unless the fabric has directional nap. An ordinary shape turns about its box centre; a **fold** shape is flipped along x instead, so its fold edge stays on y = 0.
3. **Bottom-left fill.** For each shape, each turn is tried from column 0 until its profile fits without overlapping (touching is allowed). The earliest column wins; then the **lowest** free y in an open layout, or the **highest** in a folded layout so ordinary pieces stay at the selvedge and leave the fold free. Fold shapes may only sit at y = 0. Ties keep the earlier turn (0°).
4. **Piece orders.** The whole kind is filled three times: by area, by width across the fabric, by length along the grain, each largest first with ties by shape id. The shortest strip wins; equal strips keep the earlier order. The input order of the shapes never matters (NFR-08).
5. **Result per kind.** `{ kind, placements, stripLengthMm, rows, doesNotFit, order }`. A placement is `{ shapeId, pieceId, copyIndex, xMm, yMm, rotation, mirrored }`: x is a multiple of 3 mm, (x, y) is the corner of the turned shape's box. `doesNotFit` lists the preparation's too-wide pieces of this fabric, then any shape wider than the strip. `stripLengthMm` is the largest x a placed shape reaches.

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 250" width="640" role="img" aria-label="Bottom-left fill on 3 mm columns: each shape is a set of covered intervals per column; the next shape goes to the first column where its intervals fit between the ones already placed.">
  <rect x="20" y="20" width="600" height="180" fill="#f5efe6" stroke="#6b5b4b"/>
  <g stroke="#c9bba8" stroke-width="0.5">
    <line x1="60" y1="20" x2="60" y2="200"/><line x1="100" y1="20" x2="100" y2="200"/><line x1="140" y1="20" x2="140" y2="200"/><line x1="180" y1="20" x2="180" y2="200"/><line x1="220" y1="20" x2="220" y2="200"/><line x1="260" y1="20" x2="260" y2="200"/><line x1="300" y1="20" x2="300" y2="200"/><line x1="340" y1="20" x2="340" y2="200"/><line x1="380" y1="20" x2="380" y2="200"/>
  </g>
  <path d="M20 200 L20 90 L140 60 L180 90 L180 200 Z" fill="#d6e4f0" stroke="#1f4e79"/>
  <g fill="#1f4e79" opacity="0.25"><rect x="20" y="85" width="40" height="115"/><rect x="60" y="75" width="40" height="125"/><rect x="100" y="60" width="40" height="140"/><rect x="140" y="60" width="40" height="140"/></g>
  <text x="40" y="150" font-size="13" fill="#1f4e79">shape A</text>
  <path d="M20 20 L180 20 L180 50 L20 50 Z" fill="#e3f0d6" stroke="#3d6b1f"/>
  <text x="40" y="40" font-size="12" fill="#3d6b1f">shape B fits above A</text>
  <path d="M180 200 L180 110 L300 110 L300 200 Z" fill="#fbe3d6" stroke="#9c4a1a"/>
  <text x="195" y="160" font-size="12" fill="#9c4a1a">shape C: next column</text>
  <text x="400" y="80" font-size="12" fill="#333">columns 3 mm wide (drawn wider)</text>
  <text x="400" y="100" font-size="12" fill="#333">shaded: A's covered intervals</text>
  <line x1="400" y1="140" x2="600" y2="140" stroke="#333" marker-end="url(#a3)"/>
  <text x="400" y="132" font-size="12" fill="#333">strip length (x), grain</text>
  <text x="24" y="222" font-size="12" fill="#333">y = 0 (fold when folded)</text>
  <defs><marker id="a3" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8 Z" fill="#333"/></marker></defs>
</svg>

## Length to buy (`fabricLengthM`)

Length in mm = **strip** + strip × **shrinkage %** + **pattern repeat** × **rows**, then rounded **up** to 0.1 m. A total within 0.01 mm of a step stays on it (1000 mm with no shrinkage is 1.0 m, not 1.1 m). A kind with no pieces is 0 m. Main, lining and interfacing are computed apart (FR-FAB-05).

**Rows** (decision 316 item 1): the x-bands `[x, x + length]` of the placed shapes are joined where they overlap; each joined band is one row. Bands that only touch are two rows. With repeat 0 (the default) rows change nothing.

<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 170" width="640" role="img" aria-label="Rows of cut pieces: pieces that share part of the strip length form one row; here two rows, so two pattern repeats are added.">
  <rect x="20" y="20" width="600" height="100" fill="#f5efe6" stroke="#6b5b4b"/>
  <rect x="20" y="25" width="200" height="45" fill="#d6e4f0" stroke="#1f4e79"/>
  <rect x="160" y="72" width="180" height="45" fill="#d6e4f0" stroke="#1f4e79"/>
  <rect x="380" y="30" width="220" height="80" fill="#e3f0d6" stroke="#3d6b1f"/>
  <line x1="20" y1="140" x2="340" y2="140" stroke="#1f4e79" stroke-width="3"/>
  <text x="120" y="160" font-size="13" fill="#1f4e79">row 1 (shared length)</text>
  <line x1="380" y1="140" x2="600" y2="140" stroke="#3d6b1f" stroke-width="3"/>
  <text x="450" y="160" font-size="13" fill="#3d6b1f">row 2</text>
</svg>

Example: strip 1230 mm, 5 % shrinkage, no repeat: 1291.5 mm, so **1.3 m**.

## Result and version (`fabricResult`)

`fabricResult(pattern, options)` returns `{ prepared, main, lining, interfacing, suggestOpen, nestingVersion }`; each kind adds `lengthM` to its placement. `nestingVersion` (`NESTING_VERSION`, now `1.0.0`) is stored with a saved calculation (ADR-312 item 5) and is bumped whenever the same input could give another layout or length (decision 316 item 3). The recorded lengths of the five fixture patterns are pinned in `nest.regression.test.ts` and listed in [the yardage regression test cases](../test-cases/engine/yardage-regression.md).

## Marker scene (`buildMarkerScene`)

`buildMarkerScene(pattern, prepared, kindResult)` returns drawing data for one kind: `widthMm` (strip length) × `heightMm` (usable width), and per placement the closed cut outline and grain line as path data in mm (2 decimals, like the engine renderer), the piece name and a label point at the box centre, plus the fold line (y = 0, folded) or a selvedge, and the selvedge at y = usable width. It is data only (decision 316 item 4): the viewer, the A4/A0 PDF and the projector draw it in later issues.

## Speed

ADR-313's slowest case took 1.9 s with a 4× CPU slowdown. `nest.bench.test.ts` times the three slowest cases, all three kinds together, against the 3 s budget of one kind; it is skipped on CI unless `NESTING_BENCH` is set.
