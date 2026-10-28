# ADR-315 · 2026-10-28 · Nesting piece preparation rules

## Context

`packages/nesting` (#315) prepares the pieces of a `PatternResult` for the placement (#316). [ADR-312](312-m5-scope.md) item 4 fixes the fabric model (folded and open layouts, grain and nap, pieces that do not fit) and [ADR-313](313-nesting-algorithm.md) fixes the 2 mm tolerance and the fold crossings. A few details were still open: the form limits, how fold and mirrored pieces count, how outlines are made safe, and the shape ids.

## Decision

1. **Fabric options** (`fabricOptionsSchema`): width presets 900, 1150, 1400, 1500 and 1600 mm, or any custom width inside the existing 500 to 3000 mm limits (ADR-247); shrinkage 0 to 20 % (default 5); pattern repeat 0 to 1000 mm (default 0); layout `folded` by default; no nap by default.
2. **Counting.** `cut.quantity` counts the pieces sewn into the garment, as the engine writes it (a sleeve pair is `quantity: 2, mirror: true`).
   - Folded: a fold piece gives one **half** shape per quantity, with its fold edge on y = 0; a mirrored pair is cut **once** through both layers (⌈q ÷ 2⌉ shapes); a plain piece gives one shape per quantity.
   - Open: one shape per quantity; a fold piece is unfolded into its whole shape; every second piece of a mirrored pair is the mirror image, flipped across a line along the grain so the grain and nap direction are kept.
3. **Too wide.** A shape wider across the fabric than the usable width is reported in `doesNotFit` (with `fitsOpen`) and left out of the lists (ADR-312 item 4). `suggestOpen` is true when a folded layout left out a piece that would fit open.
4. **Safe outlines.** The simplified outline is pushed **out** by the 2 mm tolerance with the engine's mitred offset, so it always contains the real cut line (ADR-313 item 3). Fold pieces are then cut back to the fold line; this also removes the up-to-9 mm fold crossings (ADR-313 item 5). The fold line comes from the piece's `fold` edges; a fold piece without one uses the smallest x of its cut line, where the engine draws centre lines.
5. **Ids and order.** Shape ids are `<pieceId>#<n>` with n from 1; shapes are sorted by piece id (code-unit order), then n, so the output does not depend on the order of the pieces or the locale (NFR-08).
6. **Engine access.** The engine exposes its geometry helpers as `@tafsila/engine/geometry`; nesting imports only that entry and `@tafsila/schemas` (dependency-cruiser rule `nesting-is-pure`).

## Reason

These follow how a tailor cuts: a fold piece on folded fabric is half a pattern, a pair cut through two layers gives left and right at once. Pushing the outline out costs at most 2 mm per edge and removes any risk that two placed pieces overlap once cut. All of it is cheap to change before the beta (no stored layouts yet).

## Alternatives

- Counting a mirrored `quantity` as pairs (one pair per unit): would cut four sleeves for a blouse, against the engine's cut text "Cut 2 (and mirrored)".
- Simplifying without the outward offset: the 2 mm simplified outline can cut inside curves (ADR-313 item 3).
- Squeezing a too-wide piece in by turning it across the grain: no cross-grain turns in v1 (ADR-312 item 4).
