# packages/engine — agent notes

Pure, deterministic pattern engine: `DesignSpec + Measurements + Options → PatternResult`. Root rules in `/CLAUDE.md` still apply; this file adds only what is specific to the engine.
Full guide: `docs/engine/README.md` · Architecture: `docs/ARCHITECTURE.md` §3 · SRS: §4.4 (FR-PAT), §4.5 (FR-VAL), §6.

## Purity (SRS §3.3)

- No I/O, no network, no `Math.random`, no `Date`, no globals or mutation of inputs.
- The same input always returns identical output, in the browser and on the server.
- Bump `ENGINE_VERSION` (`src/version.ts`) whenever output geometry changes for an existing input.

## Units and constants

- Millimetres everywhere. Numeric names carry the unit (`capEaseMm`, `angleRad`).
- No magic numbers: ease tables, seam allowances and limits live in named constants (`src/constants/`).

## Pipeline and modules

`resolve → blocks → modules → finishing → layout → validate → sewingOrder`

- Garment features are `FeatureModule`s (`id`, `appliesTo`, pure `draft`, optional `validations`), registered in the module registry.
- A module never edits another module; it returns a new `DraftContext`.
- Reuse geometry helpers in `src/geometry/` (points, Béziers) instead of writing new maths.
- Drafting failures throw `DraftingError` (`src/errors/drafting-error.ts`).
- New feature: use the `add-garment-module` skill (plan with `plan:opus`).

## Validation (FR-VAL-01…09)

- Each module registers the rules it needs. Tolerances come from the SRS:
  - seams ±2 mm
  - sleeve-cap ease 10–40 mm
  - circumference ±5 mm
  - notches ±2 mm
  - dart legs ±1 mm
- Results go into the `ValidationReport` with bilingual (ar/en) messages. Never silently "fix" geometry.

## Tests

- Unit tests for key points.
- Property tests (fast-check) for every FR-VAL check across the size matrix from `@tafsila/test-fixtures`.
- SVG snapshot per size for visual output.
- New garment geometry gets the `needs:sew-test` label until a toile is sewn in 3 sizes.
