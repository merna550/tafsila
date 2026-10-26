# ADR-292 · 2026-10-26 · Direct-cut step diagram

**Context:** #292 draws the current marking step on the piece diagram of the direct-cut checklist (#291, ADR-291).
**Decision:**

1. **Current step** = the tapped (or keyboard-focused) step, otherwise the first unticked one. Ticking clears the tap.
2. **Guides are computed in the worker adapter** (`shared/pattern-preview/cut-plan.ts`) from each point's frame distances: one segment from the reference line and one from the top line, each ending at the point and labelled with its length. `apps/web` only draws them and prints `formatCm`.
3. **Print** shows one diagram per step group (corners, curves, marks) instead of one per step; the adapter gives each step a `group`.
4. **The diagram never mirrors** (`dir="ltr"`, as the pattern viewer, ADR-243); only its guide labels and the page follow the language.
5. Phone: the diagram is sticky at the top, limited in height, so the highlight stays visible while the list scrolls.

**Reason:** No new engine geometry and no extra worker round trip; the highlight is pure rendering of data the plan already carries.
**Alternatives:** Computing guides in the component (geometry in the main bundle); one diagram per printed step (long sheets).
