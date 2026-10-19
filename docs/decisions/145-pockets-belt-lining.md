# ADR-145 · 2026-10-19 · Pockets, self-tie belt and lining

**Context:** Issue #145 (FR-PAT-07, FR-VAL-01, FR-VAL-04, FR-VAL-08). Plan: [`docs/plans/145-pockets-belt-lining.md`](../plans/145-pockets-belt-lining.md). Cheap to reverse: every number is a named constant in `packages/engine/src/constants/{pocket,belt,lining}.ts`, the pocket matrix is one table, each feature is one registry entry. Status: accepted, pending sew-test (#225).
**Decision:**

1. **Orders.** `pocket` 45 and `belt` 46 (after the waistband 40, before the closure 50); `lining` 60 (after the closure, so it copies the final openings).
2. **`POCKET_MATRIX` is declarative** (`modules/pocket/compatibility.ts`). Side-seam is refused on tiered skirts, blouses and with a side zip; patch is refused on pleated, gathered, tiered and circle skirts and where a princess seam splits the front. A refusal is the input error `POCKET_UNSUPPORTED`; an allowed pocket with no room (below the hem, a side slit, a blouse front) is `POCKET_NO_ROOM`.
3. **Pocket bags are main fabric**, two pieces cut 2 mirrored, attached by notches (`pocket-top`, `pocket-bottom`) on an unpaired `along-side` edge; the rounded `outer` edges pair with each other. The opening is 160 mm starting 40 mm below the waist; rule `POCKET_OPENING_MATCH` (FR-VAL-04).
4. **A belt crosses the grain** and splits at the fabric width into the fewest equal parts; the joins pair; no belt loops. Rule `BELT_LENGTH` (FR-VAL-01).
5. **Lining as built:** a copy of every main bodice, skirt and tier piece (`lining-<id>`, `cut.fabric: "lining"`). Sleeves, collars, cuffs, bands, facings, pockets and the belt are not lined. An edge that pairs with an unlined piece pairs with its own shell twin (basted). Trimming the lining at the facings moves to #226.
6. **Lining hem** rises 25 mm (`LINING_HEM_RISE_MM`, the shell allowance less 5) with a 20 mm lining hem; rule `LINING_HEM_CLEARANCE` (FR-VAL-08 warn).
7. **Zip opening in the lining** (`cb-open`) moves to #226; today the lining is closed along the zip seam.
8. **`openingChain` moves** to `src/pieces/seam-chain.ts` (modules must not import each other); the closure imports it from there.
9. `ENGINE_VERSION` 0.15.0.
