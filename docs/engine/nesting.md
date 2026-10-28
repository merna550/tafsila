# Nesting (`packages/nesting`)

Pure package `@tafsila/nesting`. Today it holds the **piece preparation** (#315): `preparePieces(pattern, options)` turns a `PatternResult` and the fabric options into the exact shapes to lay on each fabric. The placement on the strip and the length to buy follow in #316 ([ADR-313](../decisions/313-nesting-algorithm.md)).

- Requirements: FR-FAB-01 (options), FR-FAB-02 (nesting), FR-FAB-05 (main, lining, interfacing apart), FR-VAL-08 (pieces wider than the fabric), NFR-08 (deterministic).
- Decisions: [ADR-312](../decisions/312-m5-scope.md) item 4 (fabric model), [ADR-313](../decisions/313-nesting-algorithm.md) items 3 and 5 (tolerance, fold crossings), [decision 315](../decisions/315-nesting-preparation.md) (this package's rules).
- Dependencies: `@tafsila/schemas` and the engine's geometry entry `@tafsila/engine/geometry` only (dependency-cruiser rule `nesting-is-pure`). No `Math.random`, no clock.
- Try it: `pnpm --filter @tafsila/nesting print seedDress folded 140 M` lists the shapes of a fixture design.

## Fabric options (`packages/schemas/src/fabric-options.ts`)

`fabricOptionsSchema` is shared by the browser and the API. Missing fields take their defaults (`DEFAULT_FABRIC_OPTIONS`).

| Field              | Values                                                                                  | Default  |
| ------------------ | --------------------------------------------------------------------------------------- | -------- |
| `widthMm`          | presets `FABRIC_WIDTH_PRESETS_MM` (900, 1150, 1400, 1500, 1600) or any value 500 – 3000 | 1400     |
| `layout`           | `folded` or `open`                                                                      | `folded` |
| `directionalNap`   | `true` or `false`                                                                       | `false`  |
| `shrinkagePercent` | 0 – 20                                                                                  | 5        |
| `patternRepeatMm`  | 0 – 1000                                                                                | 0        |

Shrinkage and repeat are used by the length step (#316), not by the preparation.

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
