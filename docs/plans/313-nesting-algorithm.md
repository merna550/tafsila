# Plan #313 · Spike to choose the nesting algorithm

Copy of the approved plan comment on #313. Result: [ADR-313](../decisions/313-nesting-algorithm.md).

plan:opus · build:opus · size S (unchanged) · M5 wave 2 · FR-FAB-02, NFR-02, NFR-08 · ADR-312 item 2 already fixes the rules (no GPL/AGPL, deterministic, no `Math.random`); this spike supplies the numbers for the choice.

## Approach

Throwaway comparison, one decision file as the result. Nothing from the spike code ships; only the decision file and (if it stays useful) one benchmark script.

1. **Pieces input.** Run the engine on the fixture designs, take every cut piece's polygon (cut line, seam allowance included), its cut count, `onFold`, `mirror` and grain line (`packages/schemas/src/pattern.ts`). The spike does its own minimal preparation (flatten curves to polygons, apply cut count, fold half-width) because the real preparation is #315.
2. **Fixture set** (the 5 patterns the issue names, sizes M and XXL, widths 140 and 115 cm, folded and open = 40 runs per option):

   | Issue name           | Fixture in `@tafsila/test-fixtures`                                                   |
   | -------------------- | ------------------------------------------------------------------------------------- |
   | straight-skirt dress | `seedDress` (check the skirt is straight; else `onePieceDress` with a straight skirt) |
   | circle-skirt dress   | `vNeckHalfCircleDress`                                                                |
   | blouse with sleeves  | `setInSleeveBlouse`                                                                   |
   | gathered skirt       | `gatheredKneeSkirt`                                                                   |
   | lined dress          | `linedSidePocketDress`                                                                |

3. **Option (a), own placement.** Bottom-left fill on a strip of the usable width. Only 0° and 180° turns (0° only with nap). Candidate piece orders: by area descending, by height descending, by width descending; keep the shortest. Collision test on the simplified polygons with a coarse bounding-box pre-check.
4. **Option (b), an MIT/BSD nester.** SVGnest (MIT) ported or called inside a worker. Before measuring, record the licence of every piece it pulls in (its Clipper geometry code is Boost-licensed, which is fine; anything GPL/AGPL ends the option). Deepnest is not tried.
5. **Measure per option and run:**
   - strip length (m) and waste % against the lower bound `total piece area / usable width`;
   - time in a Web Worker in headless Chromium (Playwright, which is already installed), with a 4x CPU slowdown through CDP as the "mid laptop" stand-in; target under 3 s per fabric kind;
   - bundle size of the worker chunk (gzip);
   - determinism: run each case 3 times and compare the placements byte for byte.
6. **Polygon simplification tolerance.** Repeat option (a) with tolerances 1, 2 and 5 mm on the curved pieces (circle skirt, sleeve caps). Report length change and time. Pick the largest tolerance that changes the length by at most 1 cm. This tolerance feeds #315.
7. **Decision rule (written before measuring so the result is not tuned):** choose (a) unless (b) is deterministic, licence-clean, within the time and size budget, AND shortens the strip by more than 5 % on at least 3 of the 5 patterns. The ±10 cm exit bar is checked against Merna's hand layouts later (#322); the spike records the waste % so we know how far we are from the area bound.
8. **Write** `docs/decisions/313-nesting-algorithm.md` (heading `# ADR-313 · <date> · Nesting algorithm`): the choice, a results table per option, licences, the simplification tolerance, the piece orders kept, and "revisit when" (for example #322 shows more than 10 cm over a hand layout, or a pattern takes more than 3 s).

## Files

- Create: `docs/decisions/313-nesting-algorithm.md` (required).
- Create (optional, only if it stays runnable and tested for its pure parts): `scripts/nesting-bench.mjs` + `scripts/nesting-bench.test.mjs`.
- Throwaway spike code lives in the scratchpad or an unpushed branch and is not committed.
- Update: `docs/milestones/M5-fabric.md` only if the spike changes the wave plan; `docs/DECISIONS.md` index if it lists per-issue files.
- No schema, API or migration changes.

## Test plan

A spike has no feature tests. Checks:

- If `scripts/nesting-bench.mjs` is committed: unit tests for its pure helpers (polygon flatten, lower bound, byte-identical comparison) with 2 hand-made polygons.
- `pnpm docs:check` and Prettier on the decision file.
- Manual test cases: none (no user-facing behaviour). Merna's physical comparison is #322.

## Decisions to log

The single ADR-313 above: algorithm, simplification tolerance, piece orders. Nothing else is undecided; ADR-312 already covers licence and determinism.

## Docs to update

Decision file only; `docs/engine/README.md` gets a link when #315 lands the package.

## Risks

- **Spike over-runs:** SVGnest port is the long part. Time-box option (b) to what fits in the build run; if the port is not running, record that and the licence finding and decide on (a) by the rule above.
- **Mid-laptop numbers from a cloud container are only indicative:** report the throttle used; #316 adds a timed benchmark on CI, and Merna's laptop check comes with #322.
- **Fixture patterns may not exercise real width pressure:** the 115 cm runs cover it.

## Labels and needs

Size S, `plan:opus`, `build:opus` stay (algorithm work with measured trade-offs). `node scripts/needs-interactive.mjs` on the planned files: `no`. Status stays `status:plan-review` until Merna approves.

**Needs from Merna:** nothing but approval. The only call she may care about is the decision rule in step 7 (own code unless a ported nester is clearly better).

## Deviations

- **Option (b) was ported but not measured.** The session's permission policy refused to execute the downloaded SVGnest code, so ADR-313 has its licences, determinism and bundle size but no strip lengths or times. The plan's risk section foresaw this ("if the port is not running, record that and the licence finding and decide on (a)"). Acceptance criterion 1 stays open for option (b).
- **Placement works on column slices**, not on polygon-to-polygon collision tests. Each piece and the strip are stored as covered y-intervals per 3 mm column along the strip. This keeps y exact and needs no polygon clipping library. The slice width became a second parameter, measured next to the tolerance.
- **In a folded layout, ordinary pieces fill from the selvedge side** and fold pieces sit on the fold. Plain bottom-left fill let ordinary pieces take the fold first, and the strip came out about 45 % longer.
- **CPU throttling does not reach a Web Worker** in Chromium. The 4× "mid laptop" time was therefore measured on the page's main thread for the slowest cases, and the worker times are reported unthrottled.
- **No benchmark script is committed.** It needs the throwaway spike code and the engine fixtures together, so it would not run on its own. #316 adds the CI benchmark.
- **Same fabric width for interfacing.** Interfacing was laid on the same width as the main fabric; its real width is #314's catalogue data.
