# Engine documentation (`packages/engine`)

Kept current in the same PR as every engine change (Definition of Done). Architecture: `docs/ARCHITECTURE.md` §3. Agent notes: `packages/engine/CLAUDE.md`. Requirements: SRS §4.4 (FR-PAT), §4.5 (FR-VAL), §6.

## Contract

`generatePattern(spec: DesignSpec, measurements: Measurements, options) → PatternResult`

The function is pure and deterministic and runs the same in the browser and on the server. Every result is stamped with `ENGINE_VERSION` (`src/version.ts`), so stored versions re-render identically. Bump it whenever an existing input produces different geometry.

## Pipeline

| Step          | Does                                             |
| ------------- | ------------------------------------------------ |
| `resolve`     | Drafting inputs from measurements + ease tables  |
| `blocks`      | Base blocks: bodice, skirt, sleeve               |
| `modules`     | Registered `FeatureModule`s transform the blocks |
| `finishing`   | Seam allowance, notches, grain, darts, cut info  |
| `layout`      | Collision-free label placement                   |
| `validate`    | FR-VAL checks → `ValidationReport`               |
| `sewingOrder` | Assembly steps for instructions and 3D           |

## Drafting methods and sources

Each module cites its method in JSDoc. Basis: the FreeSewing core (SRS §1.4; licence check is open, SRS §13 #2), with standard flat-pattern drafting for blocks. Add a row here when a module introduces a new method.

| Area   | Method                                                                           | Code                       |
| ------ | -------------------------------------------------------------------------------- | -------------------------- |
| Sleeve | Cap height solved by bisection so the cap exceeds the armhole by the target ease | `src/sleeve/sleeve-cap.ts` |

## Module catalogue

Target catalogue: SRS §6.1 (`DesignSpec`). Implemented modules:

| Module id | DesignSpec path | Status        | Sew-tested |
| --------- | --------------- | ------------- | ---------- |
| —         | —               | none yet (M1) | —          |

## Validation rules (SRS §4.5)

| ID        | Check                                      | Tolerance           |
| --------- | ------------------------------------------ | ------------------- |
| FR-VAL-01 | Paired seam lengths match                  | ≤ 2 mm unless eased |
| FR-VAL-02 | Sleeve cap ease (woven set-in)             | 10–40 mm            |
| FR-VAL-03 | Circumference = measurement + ease         | ± 5 mm              |
| FR-VAL-04 | Notches align on paired edges              | ± 2 mm              |
| FR-VAL-05 | Closed outlines, no self-intersection, SA  | exact               |
| FR-VAL-06 | Grain line, name, cut quantity per piece   | present             |
| FR-VAL-07 | Dart legs equal, point within limit        | ± 1 mm              |
| FR-VAL-08 | Plausibility (negative ease, fabric width) | warning             |

## Units and constants

- Millimetres everywhere; angles in radians. Numeric names end with the unit (`lengthMm`).
- Seam allowance defaults (FR-PAT-03): 15 mm sides, 10 mm necklines and armholes, 30 mm hems.
- Ease tables and other constants live in `src/constants/`, never inline.

## Testing

- Unit tests for key points.
- Property tests (fast-check) for every FR-VAL rule across the size matrix (`@tafsila/test-fixtures`).
- SVG snapshot per size.
- Physical QA: each garment type is sewn as a toile in ≥ 3 sizes (`needs:sew-test`).

## Tutorials and skills

| Task                    | Where                                          |
| ----------------------- | ---------------------------------------------- |
| New garment feature     | `.claude/skills/add-garment-module/SKILL.md`   |
| Step-by-step tutorial   | `docs/backend/tutorials/add-garment-module.md` |
| Path-scoped agent rules | `.claude/rules/engine/drafting.md`             |
