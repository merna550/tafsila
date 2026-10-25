# ADR-284 · 2026-10-25 · Direct-cut marking steps

**Context:** #284 adds `cutSteps` to the engine: numbered steps a tailor follows with a ruler to mark each piece on the fabric (FR-CUT-01, FR-CUT-02). ADR-281 item 5 fixed the reference lines. Several details were not written down: how corners and curves are found, how curve points are spaced, the frame's signs, labels, and what happens on tight bends.
**Decision:**

1. **Corners are found on the cut path**, not from the edge list (cut segments do not map one to one to edges). A turn sharper than 15° is a corner. Between two straight lines, any turn above 1° is a corner, because a ruler cannot follow a kink (a side seam bent 5° by a dart missed the 1 mm check under the 15° rule).
2. **Curve points:** `ceil(length / step)` equal gaps, so a gap is never longer than the step. The "step − 5 mm" lower bound holds on curves longer than 5 steps. A 30 mm curve at step 25 gets one 15 mm gap pair rather than a missing point.
3. **Frame:** `along` points down the piece (+y, or +x when the reference is horizontal). `across` is signed so the cut line is at across ≥ 0. The origin is on the reference, level with the top of the cut line. A grain piece's reference runs through its leftmost cut point (the selvedge side).
4. **Labels are Latin letters** (`A`..`Z`, `AA`..) in both languages, the same in the checklist and the diagram (#292). Digits are Western (NFR-06). The DirectCut screen mock shows Arabic letters (أ، ب، ج). #291 shows the engine's labels.
5. **Notch points** are the nearest cut-line point to the notch. **Dart points** stay on the stitch line, marked inside the cut line.
6. A mirrored or `quantity: 2` piece gets **one set of steps** for the piece as drafted. The `cut.cut` step reuses the piece label's wording (`cutInfoText`), so the checklist and the paper piece say the same thing.
7. **`ENGINE_VERSION` is not bumped:** `PatternResult` does not change. `CutSteps.engineVersion` records the version that drafted the pattern.
8. **Tight bends get extra points:** a smooth curve through the points (`connectionCurve`: a Catmull-Rom spline whose ends follow the parabola through the first and last three points) may stray at most 0.75 mm from the cut line. Where it strays further, the worst gap is halved until it fits, at most 24 times. Over the catalogue this adds 1 or 2 points on necklines and armholes. The other gaps stay in the step band.
9. **No connection is drawn along the fold:** the fold run's corners are marked, but the run is the reference line itself.
10. **Step texts use the feminine imperative of the approved DirectCut screen and the sewing order** ("قيسي", "صلي"), not the neutral form copy.md asks for elsewhere. All tailoring instructions in the engine then read the same. Merna reviews the texts in the PR.
11. **Texts are a separate entry point**, `@tafsila/engine/cut-text` (`src/i18n/cut-steps.ts`, no geometry). The checklist can render steps on the main thread while `cutSteps` itself runs in the worker, from the main `@tafsila/engine` entry.

**Reason:** The steps are exact by construction (each point within 0.5 mm, each connection within 1 mm, checked over the whole catalogue), short to follow, and the UI only shows them.
**Alternatives:** Corners from the edge list (wrong on mitred corners); a fixed step on tight bends (the rounded collar end missed by 2.5 mm); Arabic-letter labels (do not match the diagram's Latin labels and sort badly past 28 points); steps on the stitch line (the tailor adds seam allowance by hand, ADR-281).
