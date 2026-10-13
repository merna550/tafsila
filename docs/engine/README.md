# Engine documentation (`packages/engine`)

Kept current in the same PR as every engine change (Definition of Done). Architecture: `docs/ARCHITECTURE.md` §3. Agent notes: `packages/engine/CLAUDE.md`. Requirements: SRS §4.4 (FR-PAT), §4.5 (FR-VAL), §6.

## Contract

`generatePattern(spec: DesignSpec, measurements: Measurements, options) → PatternResult`

The shapes of `PatternResult` and `EngineOptions` are Zod schemas in `packages/schemas/src/pattern.ts` and `engine-options.ts` ([decision 121](../decisions/121-pattern-contract.md)).

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

## Geometry kit (`src/geometry/`)

One set of pure 2D helpers; drafting code never writes its own maths ([decision 124](../decisions/124-geometry-kit.md)). Millimetres, x right, y down; angles in radians. Tolerances live in `src/constants/geometry.ts`. Degenerate input throws `DraftingError` with a `GEOMETRY_*` code.

| File           | Helpers                                                                                                                        | For                                    |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------- |
| `point.ts`     | `pt`, `add`, `sub`, `scale`, `dot`, `cross`, `norm`, `normalize`, `perpendicular`, `lerp`, `angleRad`, `distance`, `samePoint` | vector maths                           |
| `segment.ts`   | `lineSeg`, `cubicSeg`, `mapSegment`, `reverseSegment`, `assertSegment`, `assertPath`                                           | building segments, input checks        |
| `bezier.ts`    | `pointOnCubic`, `tangentOnCubic`, `splitCubic`, `cubicLength`, `tAtLength`, `curveThroughPoints`                               | necklines, armholes, hems              |
| `path.ts`      | `pathLength`, `pointAtLength`, `tangentAtLength`, `splitAtLength`, `subPath`, `reversePath`, `isClosed`, `samplePath`          | seam lengths, notches, edges           |
| `transform.ts` | `translate`, `rotateAbout`, `mirrorAcross` (points, segments, paths), `rotateSegmentAround`                                    | symmetric halves, dart closing, pivots |
| `intersect.ts` | `lineLine`, `lineCubic`, `cubicCubic`, `intersectSegments`, `selfIntersections`                                                | construction points, FR-VAL-05         |
| `offset.ts`    | `offsetPath(path, distanceMm or one per segment)` with mitre corners                                                           | seam allowance (FR-PAT-03)             |
| `polygon.ts`   | `signedArea`, `bbox`, `bboxOverlap`, `pointInPolygon`                                                                          | orientation, nesting, inside tests     |
| `roots.ts`     | `solveQuadratic`, `solveCubic`                                                                                                 | intersections                          |

Coverage of the engine must stay at 85% or more (NFR-10): `pnpm --filter @tafsila/engine test` fails below it.

## Drafting methods and sources

Each module cites its method in JSDoc. Basis: the FreeSewing core (SRS §1.4; licence check is open, SRS §13 #2), with standard flat-pattern drafting for blocks. Add a row here when a module introduces a new method.

| Area     | Method                                                                                        | Code                       |
| -------- | --------------------------------------------------------------------------------------------- | -------------------------- |
| Sleeve   | Cap height solved by bisection so the cap exceeds the armhole by the target ease              | `src/sleeve/sleeve-cap.ts` |
| Geometry | Gravesen adaptive Bézier length, de Casteljau split, Catmull-Rom curves, Tiller–Hanson offset | `src/geometry/`            |

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

## Measurement validation (FR-MEAS-01, -03, -05)

Pure functions in `src/measurements/`, used by the API and the measurements form; the database does not repeat the ranges (ADR-28a).

- `validateMeasurements(m)` returns `{ errors, warnings }`. Each item has a stable `code`, the `fields` involved and `message_ar` / `message_en`. Problems are data, never thrown. Errors block a pattern; warnings never do.
- `fromStandardSize(chart, label, overrides)` returns the chart row with the overrides on top. `undefined` overrides do not erase values; an unknown label throws `UnknownSizeError`. Inputs are not mutated.
- Ranges and ratios are named constants in `src/constants/measurement-ranges.ts`. Outside a range is an **error** (proposal, Merna reviews it):

| Measurement       | Min (mm) | Max (mm) | Why                                        |
| ----------------- | -------- | -------- | ------------------------------------------ |
| height            | 1400     | 2000     | adult women's height                       |
| bust              | 700      | 1500     | smallest adult to plus sizes               |
| highBust          | 650      | 1400     | always a little below bust                 |
| underBust         | 600      | 1300     | below bust                                 |
| waist             | 500      | 1400     | narrow waist to plus sizes                 |
| hip               | 800      | 1700     | smallest adult to plus sizes               |
| hipDepth          | 120      | 280      | waist to hip line                          |
| neck              | 250      | 500      | neck circumference                         |
| shoulderWidth     | 280      | 520      | shoulder point to shoulder point           |
| backLength        | 300      | 550      | nape to waist                              |
| frontLength       | 320      | 600      | shoulder point over bust to waist          |
| bustPointDistance | 120      | 300      | distance between bust points               |
| bustHeight        | 150      | 420      | shoulder point to bust point               |
| armLength         | 400      | 750      | shoulder to wrist                          |
| upperArm          | 180      | 500      | upper arm circumference                    |
| wrist             | 110      | 260      | wrist circumference                        |
| waistToKnee       | 400      | 800      | waist to knee, shorter than waist to floor |
| waistToFloor      | 700      | 1300     | waist to floor, skirt and trouser length   |

Cross-checks:

| Code                             | Severity | Rule                                      |
| -------------------------------- | -------- | ----------------------------------------- |
| `MEAS_OUT_OF_RANGE`              | error    | value outside the range above             |
| `MEAS_HIGH_BUST_EXCEEDS_BUST`    | error    | highBust > bust                           |
| `MEAS_UNDER_BUST_NOT_BELOW_BUST` | error    | underBust >= bust (when present)          |
| `MEAS_KNEE_BELOW_FLOOR_LENGTH`   | error    | waistToKnee >= waistToFloor               |
| `MEAS_WAIST_NOT_BELOW_HIP`       | warning  | waist >= hip                              |
| `MEAS_BUST_POINTS_TOO_WIDE`      | warning  | bustPointDistance > bust / 2              |
| `MEAS_FRONT_SHORTER_THAN_BACK`   | warning  | frontLength < backLength                  |
| `MEAS_WAIST_TO_FLOOR_UNUSUAL`    | warning  | waistToFloor outside 50% to 70% of height |

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
