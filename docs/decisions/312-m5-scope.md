# ADR-312 · 2026-10-27 · M5 scope: fabric yardage in the browser, catalogue and rules in the database

**Context:** M5 (Fabric) adds yardage with nesting, the fabric catalogue and rules, and recommendations (SRS §12). The brief is `docs/milestones/M5-fabric.md`, issues #312-#323. These points were not written down: where nesting runs and how it is kept reproducible, how a folded fabric is modelled, how grain and nap limit rotation, what is stored, where the catalogue lives, who supplies its content, and what the exit waits for. All are cheap to change before the beta (no production data, ADR-026).

**Decision:**

1. **Two new pure packages, as SRS §3.2 lists them.**
   - `packages/nesting` prepares the pieces and places them (#315, #316).
   - `packages/fabric-kb` holds the catalogue and rule types, the draft data and `recommend` (#314).
   - Neither imports from `apps/` or `packages/api` (dependency-cruiser rule).
2. **The algorithm is chosen by a spike with numbers** (#313).
   - The spike compares our own deterministic placement with an MIT or BSD nester. **No GPL or AGPL code:** Deepnest is rejected, because the browser bundle is distributed.
   - The result must be deterministic: the same pattern and options give the same layout. A seeded random generator is allowed; `Math.random` and the clock are not (NFR-08).
3. **Nesting runs in the browser, in its own Web Worker** (`shared/fabric-nesting`). It drafts the pattern again from the version's stored inputs, as the export worker does (ADR-281, ADR-289). No server job.
4. **Fabric model:**
   - **Folded layout:** the usable width is half the fabric. On-fold pieces sit with their fold edge on the fold; mirrored pairs are cut once through both layers.
   - **Open layout:** on-fold pieces are unfolded; mirrored pairs become a piece and its mirror image.
   - **Grain:** every piece is turned so its grain line is parallel to the selvedge. Allowed turns are 0° and 180°, and only 0° with directional nap. No cross-grain turns in v1; pieces that already cross the grain, like the belt (ADR-145), keep their own grain line.
   - **Length to buy:** the strip length plus shrinkage (default 5 %) plus the pattern repeat, rounded **up** to 0.1 m.
   - Main fabric, lining and interfacing are computed separately (FR-FAB-05). A piece wider than the usable width is reported, not squeezed in, and the UI suggests the open layout (FR-VAL-08).
5. **What is stored:**
   - The last fabric calculation per version and options is saved in `fabric_calcs`: the options and the result (length per fabric kind and the placements), plus `nesting_version`, so a stored layout reproduces even if the algorithm changes later.
   - The browser computes and the API validates the shape.
   - This is the first new table since M3; it is owner-only through RLS.
6. **The catalogue and rules live in the database:** tables `fabrics` and `fabric_rules` (SRS §7).
   - They are seeded by a **migration**, not the seed file, so staging has them, as for the default size chart (ADR-31a).
   - Admins edit them in the existing admin area with an audit row per change (ADR-32a, ADR-32b), so changes need no deploy (FR-REC-03).
   - A test keeps the migration equal to the package's reviewed draft data.
7. **Content is Merna's.** The agent drafts the fabric properties and rules from general sewing knowledge and marks them DRAFT; Merna reviews them in the #314 PR and can correct them in the admin later. This is sewing knowledge, like the size chart (ADR-158).
8. **Recommendations run on the server** (`GET /api/fabrics/recommend`), because the catalogue and rules are database data. `recommend` itself is pure and is tested in the package.
9. **The projector reuses M4:** "project the layout" opens the existing projector view with the marker scene (FR-FAB-04, ADR-286, ADR-287). Rotation is off for a marker.
10. **Out of M5:**
    - the AI-written explanation (FR-REC-04, C, M6);
    - fabric images, prices and suppliers;
    - stretch fabrics (post-launch);
    - credits (M7).
11. **Exit:**
    - The software half is #323 (e2e and staging test cases).
    - The physical half is Merna's #322: 5 garments laid by hand within ±10 cm of the app's length.
    - M5 does not wait for the M3 or M4 exits, which are Merna's physical checks.

**Reason:** The browser has the pattern already; a worker keeps the page responsive and the free tiers untouched. Determinism keeps a stored version reproducible (NFR-08). Database data with admin editing meets FR-REC-03 without code changes. A spike first avoids building the package around the wrong algorithm.

**Alternatives:**

- Server-side nesting job: needs a paid runtime or long requests.
- A GPL nester: licence conflict.
- Catalogue in code only: every change needs a deploy, against FR-REC-03.
- Storing only the options: a later algorithm change would silently change an old version's length.
