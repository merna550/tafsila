# M2 - Engine core

## Goal

`generatePattern(spec, measurements, options)` drafts a complete, validated, ready-to-cut pattern for every dress, skirt and blouse in the v1 catalogue. All FR-VAL checks pass across the size matrix, and toiles fit in 3 sizes per garment.

## Scope

In: `PatternResult` and engine options schemas, geometry kit, pipeline and module registry, ease tables, bodice / skirt / sleeve blocks, every catalogue module in SRS §6.1 (shaping, necklines with facings, collars, sleeves and cuffs, skirts, waistbands, closures, pockets, belt, lining), seam allowance, notches, grain, labels, scale square, label layout, validation report (FR-VAL-01..08 as data), sewing order, deterministic SVG renderer with a 1:1 toile print script, size matrix, property suite and the 500 ms budget.
Out: pattern viewer, design picker and validation report UI (M3, including FR-VAL-09 display), ease preference UI (M3), projector, direct-cut and PDF (M4), nesting and yardage (M5), stretch fabrics and 3D (post-launch), storing patterns in the database (M3).

## SRS IDs

FR-PAT-01..07, FR-VAL-01..08 (FR-VAL-09 data only), NFR-01, NFR-02 (regeneration), NFR-08, NFR-10, SRS §6.1–6.3, §11 (testing), §13 item 2.

## Deliverables

- `packages/schemas`: `PatternResult`, `Piece`, `Path`, `EngineOptions` and a JSON Schema export for the v2 sim service.
- `packages/engine`: pipeline, geometry, blocks, modules, finishing, validation, sewing order, SVG renderer, `pnpm engine:print`.
- `docs/engine/drafting-method.md` with reference drafts (S, M, XXL) in `@tafsila/test-fixtures`.
- Size matrix (5 chart sizes + 20 custom sets) and a property suite over catalogue × matrix.
- Seed designs for dress, skirt and blouse; SVG snapshots per design and size.
- `docs/test-cases/engine/sew-tests.md` with 9 logged toiles.

## Exit criteria

All FR-VAL checks pass across the size matrix; toiles sewn in 3 sizes per garment (SRS §12). Measured by #147 (automated) and #148 (toiles, no open fit bugs).

## Dependencies

- From M1: #28 (measurement validation, closed); #32 (real Egyptian size chart) before the exit check #148. Engine work does not wait for the rest of M1.
- Inside M2 every issue lists "Depends on #N". Critical path: #122 (method, decision) → #126 ease → #128 bodice → #134 sleeve → #144 assembly → #146 sewing order → #147 suite → #148 exit.
- #121 (schemas) unblocks #124 geometry and #125 pipeline, which unblock everything else.

## Decisions

[ADR-122](../decisions/122-m2-engine-scope.md): full catalogue in M2, own geometry (FreeSewing as a reference only), toiles printed at 1:1 from SVG before PDF exists, synthetic custom sets until real ones are supplied, one block drafting system (Merna chooses in #122).

## Merna's tasks

- **#122: choose the block drafting system** (proposal: Aldrich metric). Blocks wait for this.
- Approve the ease values (#126) and measurement-dependent constants in PRs.
- Supply the real size chart (#32) and, when possible, anonymised real measurement sets for #123.
- Sew 9 toiles (dress, skirt, blouse × 3 sizes) from `pnpm engine:print` at a plotter print shop and log the fit notes (#148). Earlier block toiles (#128, #129, #134) catch problems sooner.
- Review the Arabic piece names, validation messages and sewing steps.

## Risks

- Fit errors only show in fabric: sew blocks early (wave 2), before the style modules build on them.
- Geometry edge cases (self-intersections on extreme bodies): the property suite uses the size matrix and generated measurements; failures print the shrunk input.
- Scope is large (28 issues, many `build:opus`): waves 3 and 4 can run in parallel; if time runs short, cut the lowest-use options (tiered, bishop, contour waistband) to M3 by decision, not silently.
- Performance (< 500 ms in the browser): bench in #147; curves are sampled with named constants that can be tuned.
- CI minutes (ADR-86): property run counts are constants; larger runs nightly if needed.

## Issues

| Issue | Title                                                        | Wave |
| ----- | ------------------------------------------------------------ | ---- |
| #121  | Schemas: PatternResult, Piece, Path and engine options       | 1    |
| #122  | Spike: block drafting method and reference drafts (decision) | 1    |
| #123  | Size matrix: S-XXL plus 20 custom sets                       | 1    |
| #124  | Geometry kit: paths, offset, intersections, transforms       | 1    |
| #125  | Pipeline, DraftContext and module registry                   | 1    |
| #126  | Ease tables and the resolve step                             | 1    |
| #127  | Deterministic SVG renderer and 1:1 toile print               | 2    |
| #128  | Bodice block with bust and waist darts                       | 2    |
| #129  | Straight skirt block with waist darts                        | 2    |
| #130  | Seam allowance per edge and cutting line                     | 2    |
| #131  | Notches, grain, labels, cut info, scale square, layout       | 2    |
| #132  | Validation report and structural checks (VAL-05, -06, -08)   | 2    |
| #133  | Fit checks (VAL-01..04, -07)                                 | 2    |
| #134  | Set-in sleeve block, all lengths                             | 3    |
| #135  | Skirts: straight, A-line, lengths, slit                      | 3    |
| #136  | Skirts: half and full circle                                 | 3    |
| #137  | Skirts: gathered, pleated, tiered                            | 3    |
| #138  | Bodice shaping: princess seams and dart-free                 | 3    |
| #139  | Necklines with facings                                       | 3    |
| #140  | Waistbands: straight, contour, elastic                       | 3    |
| #141  | Collars: peter pan, shirt, mandarin                          | 4    |
| #142  | Sleeve styles and cuffs                                      | 4    |
| #143  | Closures: zip, buttons, none                                 | 4    |
| #144  | Garment assembly: dress, blouse, skirt                       | 4    |
| #145  | Pockets, self-tie belt, lining                               | 4    |
| #146  | Sewing order                                                 | 5    |
| #147  | Catalogue × size-matrix suite, snapshots, 500 ms budget      | 5    |
| #148  | Exit check: FR-VAL across the matrix, 9 toiles               | 5    |

Waves are the order dependencies allow; `/plan-wave M2` plans every issue whose dependencies are closed.
