# ADR-131 · 2026-10-17 · Notches, grain line, labels, cut info and scale square

**Context:** Issue #131 (FR-PAT-02, FR-VAL-04, FR-VAL-06, NFR-06). Plan: `docs/plans/131-notches-grain-labels.md`.
**Decision:**

1. **Own deterministic label search, no `polylabel` dependency.** A grid search (5 mm) with two half-step refinements picks the fitting centre farthest from the outline. It avoids a dependency and any float difference between browser and Node. The text box must have all corners inside the stitch polygon and be 3 mm from every stitch, cut, grain and dart line.
2. **Text width is an estimate** (`characters x height x 0.6`, the longer of the two languages), because the engine has no font metrics. The 3 mm clearance absorbs the error; the print test case checks it on paper.
3. **Notch pairing:** a module writes a notch on one edge with `pairsWith`; `notchStep` writes the partner at the same distance from the shared end. `pairsWith.reversed` (on the notch or its edge, optional, default false) says the edges run in opposite directions, so the partner is at `partnerLength - atMm`. `Notch.marks` (`1 | 2`, default 1) is a schema field: single = front, double = back. A partner a module already wrote is kept. A missing partner edge throws `FINISHING_NOTCH_PARTNER_MISSING`.
4. **Grain line:** `defaultGrainLine` gives a centred line, 60 % of the height, at least 120 mm; modules may give their own (bias). The step only fails (`FINISHING_GRAIN_MISSING`) for a line shorter than 1 mm; FR-VAL-06 reporting is #132.
5. **Darts** are checked, not rewritten: legs within 0.1 mm of their edge, apex inside the piece (`FINISHING_DART_*` errors are block bugs). The fold direction is the rule "towards the centre line", written in the engine README.
6. **Label text lives in `src/i18n/pieces.ts`.** Piece names come from the catalogue by id, falling back to the name the piece carries. The engine stamp (`v0.1.0`) is part of the size line, since label kinds have no `stamp`. A new optional `EngineOptions.clientLabel` feeds the client part.
7. **Scale square is data:** a `scale-square` label (`at` = top-left, `sizeMm: 100`) on the largest piece that holds it (10 mm scan, first fit, 2 mm clear of lines and labels). When a piece carries one, the sheet draws that one and not its own; when none can, the sheet square from #127 is used. A print always shows exactly one.
8. **Label fallback:** when the block does not fit at 4 mm text, it goes just below the cut bounding box instead of failing, so a tiny piece (a belt loop) still gets its name.
9. **`ENGINE_VERSION` stays 0.1.0:** the default registry has no modules yet, so no real input changes.
10. **Arabic strings to review (Merna):** cut: "اقصّي N", "على الثنية", "(مع مقلوبها)", fabric "بطانة" / "حشوة لاصقة"; size: "المقاس M - client - v0.1.0"; piece names in `PIECE_NAMES`; square caption "10 سم".
