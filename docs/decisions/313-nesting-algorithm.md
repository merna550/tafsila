# ADR-313 · 2026-10-27 · Nesting algorithm

**Context:** `packages/nesting` (#315, #316) needs an algorithm before it is built (FR-FAB-02, NFR-02, NFR-08). [ADR-312](312-m5-scope.md) item 2 fixes the rules: no GPL or AGPL code, the same input gives the same layout, `Math.random` and the clock are not allowed. The spike #313 compared (a) our own deterministic placement with (b) a port of SVGnest (MIT), using the decision rule written in the plan before measuring: **choose (a) unless (b) is deterministic, licence-clean, within the time and size budget, and shortens the strip by more than 5 % on at least 3 of the 5 patterns.**

**Decision:**

1. **Option (a), own code: bottom-left fill on column slices.**
   - Each cut polygon is turned so its grain line runs along the selvedge (x = strip length, y = fabric width).
   - The strip is cut into columns 3 mm wide. Each piece becomes a list of covered y-intervals per column, and each strip column keeps its occupied intervals.
   - A piece goes to the first column where it fits, then to the lowest free y (or, in a folded layout, the highest y, so that ordinary pieces stay at the selvedge and leave the fold free).
   - Fold pieces in a folded layout must sit with their fold edge on the fold (y = 0).
   - Allowed turns: 0° and 180°. A fold piece's 180° is a flip along x, because the fold must stay on the fold. With directional nap only 0°.
   - **Piece orders kept:** by area, by height across the fabric, and by length along the grain (largest first, ties by piece id). The shortest of the three strips wins.
2. **Slice width 3 mm.** 2 mm is about 2× slower for almost no gain: 85 of 88 runs differ by at most 1 cm, and the other three differ by +2.3, −5.5 and −19 cm, so neither width is better in general. 3 mm keeps the slowest case under 3 s with a 4× CPU slowdown.
3. **Polygon simplification tolerance: 2 mm** (Douglas-Peucker on the flattened cut line). Measured with 2 mm slices: tolerances 0.5 and 1 mm change no strip by more than 2 mm. 5 mm changes 6 of 88 runs by more than 1 cm. It also cuts inside curves, so a 5 mm simplified piece can overlap its neighbour once cut. #315 should push the simplified outline out by the tolerance, so it never lies inside the real cut line.
4. **Option (b) is not chosen.**
   - Its numbers could not be measured in this run: the session's permission policy refused to execute the downloaded SVGnest code.
   - By the rule above, (a) stands unless (b) is shown to be better.
   - The licence check and the static measurements are below, so a later run only has to add the strip lengths.
5. **Things #315 must handle, found in the spike:**
   - Some fold pieces' cut lines cross the fold by up to 9 mm (the V-neck facing and bodice front at the neck corner, size XXL). The spike cut them back to the fold line.
   - A half-circle skirt piece wider than the usable width is reported and left out, as ADR-312 item 4 says. That happened in 6 of 40 runs.

**Results, option (a)** (5 fixture patterns, sizes M and XXL, widths 140 and 115 cm, folded and open, 3 mm slices, 2 mm tolerance):

- The fixtures are `seedDress`, `vNeckHalfCircleDress`, `setInSleeveBlouse`, `gatheredKneeSkirt` and `linedSidePocketDress`.
- The area bound is total piece area ÷ usable width; no layout can be shorter. Waste = 1 − bound ÷ main length.
- The time is the whole worker run for all fabric kinds, the slowest of 3 runs: headless Chromium, Web Worker, 2.8 GHz Xeon vCPU.

| Pattern              | Size | Width  | Layout | Main (m) | Area bound (m) | Waste | Lining (m) | Interfacing (m) | Worker time (ms) | Too wide, left out      |
| -------------------- | ---- | ------ | ------ | -------- | -------------- | ----- | ---------- | --------------- | ---------------- | ----------------------- |
| Straight-skirt dress | M    | 140 cm | folded | 1.29     | 0.94           | 27 %  | -          | 0.18            | 158              | -                       |
| Straight-skirt dress | M    | 140 cm | open   | 1.24     | 0.94           | 24 %  | -          | 0.18            | 327              | -                       |
| Straight-skirt dress | M    | 115 cm | folded | 1.75     | 1.15           | 34 %  | -          | 0.18            | 123              | -                       |
| Straight-skirt dress | M    | 115 cm | open   | 1.54     | 1.15           | 25 %  | -          | 0.18            | 264              | -                       |
| Circle-skirt dress   | M    | 140 cm | folded | 1.86     | 1.31           | 29 %  | -          | 0.42            | 122              | -                       |
| Circle-skirt dress   | M    | 140 cm | open   | 1.83     | 1.31           | 28 %  | -          | 0.42            | 484              | -                       |
| Circle-skirt dress   | M    | 115 cm | folded | 0.89     | 0.55           | 38 %  | -          | 0.42            | 107              | skirt-front, skirt-back |
| Circle-skirt dress   | M    | 115 cm | open   | 1.73     | 1.08           | 38 %  | -          | 0.42            | 279              | skirt-front             |
| Blouse with sleeves  | M    | 140 cm | folded | 0.91     | 0.56           | 38 %  | -          | 0.18            | 117              | -                       |
| Blouse with sleeves  | M    | 140 cm | open   | 0.88     | 0.56           | 36 %  | -          | 0.18            | 168              | -                       |
| Blouse with sleeves  | M    | 115 cm | folded | 1.06     | 0.69           | 35 %  | -          | 0.18            | 95               | -                       |
| Blouse with sleeves  | M    | 115 cm | open   | 1.03     | 0.69           | 33 %  | -          | 0.18            | 193              | -                       |
| Gathered skirt       | M    | 140 cm | folded | 1.23     | 0.79           | 36 %  | -          | 0.85            | 64               | -                       |
| Gathered skirt       | M    | 140 cm | open   | 1.23     | 0.74           | 40 %  | -          | 0.85            | 35               | -                       |
| Gathered skirt       | M    | 115 cm | folded | 1.23     | 0.97           | 22 %  | -          | 0.85            | 43               | -                       |
| Gathered skirt       | M    | 115 cm | open   | 1.23     | 0.90           | 27 %  | -          | 0.85            | 29               | -                       |
| Lined dress          | M    | 140 cm | folded | 1.51     | 1.08           | 29 %  | 1.06       | 0.18            | 139              | -                       |
| Lined dress          | M    | 140 cm | open   | 1.32     | 1.08           | 18 %  | 1.06       | 0.18            | 413              | -                       |
| Lined dress          | M    | 115 cm | folded | 1.78     | 1.31           | 26 %  | 1.54       | 0.18            | 120              | -                       |
| Lined dress          | M    | 115 cm | open   | 1.65     | 1.31           | 20 %  | 1.26       | 0.18            | 405              | -                       |
| Straight-skirt dress | XXL  | 140 cm | folded | 1.63     | 1.16           | 29 %  | -          | 0.19            | 129              | -                       |
| Straight-skirt dress | XXL  | 140 cm | open   | 1.47     | 1.16           | 21 %  | -          | 0.19            | 263              | -                       |
| Straight-skirt dress | XXL  | 115 cm | folded | 2.27     | 1.42           | 38 %  | -          | 0.19            | 111              | -                       |
| Straight-skirt dress | XXL  | 115 cm | open   | 1.75     | 1.42           | 19 %  | -          | 0.19            | 273              | -                       |
| Circle-skirt dress   | XXL  | 140 cm | folded | 1.65     | 1.03           | 38 %  | -          | 0.40            | 147              | skirt-back              |
| Circle-skirt dress   | XXL  | 140 cm | open   | 2.21     | 1.52           | 31 %  | -          | 0.40            | 535              | -                       |
| Circle-skirt dress   | XXL  | 115 cm | folded | 1.06     | 0.67           | 37 %  | -          | 0.40            | 61               | skirt-front, skirt-back |
| Circle-skirt dress   | XXL  | 115 cm | open   | 1.86     | 1.27           | 31 %  | -          | 0.40            | 357              | skirt-front             |
| Blouse with sleeves  | XXL  | 140 cm | folded | 1.09     | 0.68           | 38 %  | -          | 0.19            | 111              | -                       |
| Blouse with sleeves  | XXL  | 140 cm | open   | 1.05     | 0.68           | 35 %  | -          | 0.19            | 196              | -                       |
| Blouse with sleeves  | XXL  | 115 cm | folded | 1.41     | 0.83           | 41 %  | -          | 0.19            | 103              | -                       |
| Blouse with sleeves  | XXL  | 115 cm | open   | 1.11     | 0.83           | 25 %  | -          | 0.19            | 195              | -                       |
| Gathered skirt       | XXL  | 140 cm | folded | 1.25     | 1.03           | 18 %  | -          | 1.09            | 51               | -                       |
| Gathered skirt       | XXL  | 140 cm | open   | 1.25     | 0.96           | 24 %  | -          | 1.09            | 31               | -                       |
| Gathered skirt       | XXL  | 115 cm | folded | 2.35     | 1.25           | 47 %  | -          | 1.09            | 54               | -                       |
| Gathered skirt       | XXL  | 115 cm | open   | 1.25     | 1.17           | 7 %   | -          | 1.09            | 31               | -                       |
| Lined dress          | XXL  | 140 cm | folded | 1.81     | 1.30           | 29 %  | 1.56       | 0.19            | 161              | -                       |
| Lined dress          | XXL  | 140 cm | open   | 1.63     | 1.30           | 20 %  | 1.10       | 0.19            | 378              | -                       |
| Lined dress          | XXL  | 115 cm | folded | 2.27     | 1.58           | 30 %  | 1.92       | 0.19            | 166              | -                       |
| Lined dress          | XXL  | 115 cm | open   | 1.97     | 1.58           | 20 %  | 1.67       | 0.19            | 325              | -                       |

- **Determinism:** every run was repeated 3 times in fresh workers. All 40 cases gave byte-identical placements. The code has no random numbers at all.
- **Time on a "mid laptop":** CDP CPU throttling does not slow a Web Worker (4× gave the same worker times as 1×). So the three slowest cases also ran on the page's main thread with a 4× slowdown:
  - circle-skirt dress XXL open: 1.88 s;
  - lined dress M open: 1.32 s (main) and 0.47 s (lining);
  - straight-skirt dress XXL open: 0.83 s.
  - All are under the 3 s target. With 2 mm slices the slowest was 3.3 s.
- **Bundle:** the prepare + place worker chunk is 6.1 kB minified, **2.8 kB gzip**, with no dependency.
- **Waste:** 7 to 47 % above the area bound. The bound ignores piece shape, so it cannot be reached; the real bar is Merna's hand layouts in #322 (±10 cm).
  - Folded layouts of skirts with two fold pieces (gathered skirt XXL at 115 cm) chain the fold pieces along the fold and come out long; the open layout is then much shorter (2.35 m against 1.25 m).
  - The fabric screen should show both layouts, or suggest the open one, as ADR-312 item 4 already does for pieces that are too wide.

**Option (b), SVGnest port: what is known**

- **Licences:** SVGnest is MIT (Jack Qiao, 2015). Its `geometryutil.js` is MIT. Its `clipper.js` is Clipper 6.1.3a (Angus Johnson), Boost Software License 1.0, and bundles Tom Wu's jsbn BigInteger (BSD-style). Its `filesaver.js` (MIT) is not needed. Everything is licence-clean; nothing is GPL or AGPL. Deepnest (GPL) was not tried.
- **Determinism as published:** no. `Math.random` is used in 6 places in `svgnest.js` (shuffle, GA mutation, crossover cut point, parent selection, random angle), plus once in the jsbn code inside `clipper.js`, and the GA runs until stopped. A port must swap these for a seeded generator and run a fixed number of generations. The spike port does that.
- **Bundle:** `clipper.js` + `geometryutil.js` + the port's placement and GA code is 115 kB minified, **32 kB gzip**. That is about 11 times option (a).
- **Strip lengths and time: not measured.** The port, the NFP cache and the runner were written (Minkowski NFPs through Clipper, SVGnest's placement with fold pieces held in a 1 mm band on the fold, seeded GA), but executing the downloaded SVGnest code was refused by the session's permission policy.
- **What can be said without numbers:**
  - SVGnest's GA makes its quality depend on how many generations fit in the time budget.
  - Its first individual (pieces by area, largest first) is the same idea as option (a)'s area order.
  - It also pays a Minkowski sum per pair of piece shapes and turns, before the first placement.

**Reason:** Option (a) meets every hard rule now. It is deterministic by construction (no random numbers, fixed orders, ties broken by piece id). It is our own code, so there is no licence question. It is 2.8 kB gzip and under 2 s for the slowest case with a 4× slowdown. Option (b) can only be chosen if it is shown to be more than 5 % shorter on 3 of the 5 patterns, and that could not be shown in this run. Choosing (a) is cheap to reverse: `fabric_calcs` stores `nesting_version` (ADR-312 item 5), so a later algorithm does not change stored layouts.

**Alternatives:**

- (b) SVGnest port as published: rejected for determinism (`Math.random`, a GA without a fixed end). As a seeded port, not measured; see revisit.
- Deepnest: GPL, rejected by ADR-312.
- Raster (bitmap) placement: simpler, but its accuracy is tied to the cell size in both directions. Slices keep y exact and only round x to 3 mm.
- 2 mm slices: slower, and not better in general (see item 2).

**Revisit when:**

- #322 shows the app's length more than 10 cm over Merna's hand layout on any of the 5 garments.
- A real pattern takes more than 3 s per fabric kind on Merna's laptop, or in the #316 CI benchmark.
- Someone can run the seeded SVGnest port, for example in a session that allows running the downloaded SVGnest code. If it beats the rule above (more than 5 % shorter on 3 of 5 patterns, within 3 s and the size budget), switch, and bump `nesting_version`.
