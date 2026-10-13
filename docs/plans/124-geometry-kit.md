# Plan #124: geometry kit, paths, offset, intersections and transforms

Plan comment: <https://github.com/merna550/tafsila/issues/124#issuecomment-6155681769>.

Plan wave M2 (2026-10-13). Depends on #121 (`Point`, `Segment`, `Path` types).

## Approach

One pure geometry module in `packages/engine/src/geometry/` that every later issue uses. Rules:

- It works on the `@tafsila/schemas` types from #121. The engine's own `Point` interface becomes a re-export of the schema type, so the type is not declared twice.
- Every tolerance is a named constant in `src/constants/geometry.ts`.
- Degenerate input throws `DraftingError` with a stable code.
- Nothing mutates its input, and nothing is random.

## Files

All under `packages/engine/src/geometry/`, each with a `*.test.ts` file next to it.

- `point.ts` (change): `Point` from schemas, and the vector helpers `add`, `sub`, `scale`, `dot`, `cross`, `normalize`, `lerp` and `angleRad`.
- `bezier.ts` (extend):
  - `cubicLength`, by adaptive subdivision until chord and control-net lengths agree within `CURVE_LENGTH_TOLERANCE_MM` = 0.001.
  - `tangentOnCubic` and `splitCubic(t)` (de Casteljau).
  - `tAtLength`, by bisection on the length.
  - `curveThroughPoints(points, startTangent, endTangent)`: a Catmull-Rom curve turned into cubics, with the end tangents fixed. Used for necklines, armholes and hems.
- `path.ts` (new):
  - `lineSeg` and `cubicSeg` builders, `segmentLength` and `pathLength`.
  - `pointAtLength` and `tangentAtLength`.
  - `splitAtLength`, `subPath(fromMm, toMm)` and `reversePath`.
  - `isClosed` (± `GEOMETRY_EPSILON_MM` = 0.01) and `samplePath` (for the polygon helpers).
- `transform.ts` (new):
  - `translate`, `rotateAbout(point, angleRad)` and `mirrorAcross(lineA, lineB)`, for points, segments and paths.
  - `rotateSegmentAround(path, fromMm, toMm, pivot, angleRad)`, used to close a dart or pivot a section.
- `intersect.ts` (new):
  - `lineLine`, for segments or infinite lines.
  - `lineCubic`: solve the cubic polynomial on the line's normal (Cardano, roots kept in [0, 1]).
  - `cubicCubic`: recursive bounding-box subdivision down to 0.001 mm, with duplicate roots merged.
  - `selfIntersections(closedPath)`: neighbouring segments that only share their joint are ignored.
- `offset.ts` (new):
  - `offsetPath(path, distanceMmPerSegment[], { corner: "mitre" })`.
  - Lines are offset exactly.
  - Cubics use Tiller–Hanson, splitting until the sampled error is ≤ `OFFSET_TOLERANCE_MM` = 0.05.
  - Corners meet where the neighbouring offsets intersect (mitre). Past `MITRE_LIMIT` = 4 × distance, the corner is cut square.
  - Seam-specific corners (fold-back at darts and hems) are not here; they belong to #130.
- `polygon.ts` (new): `signedArea`, `bbox` and `pointInPolygon` (even–odd), all over sampled points.
- `index.ts`: export everything.
- `src/constants/geometry.ts` (new): the tolerances above, each with a reason in a comment.
- `src/errors/drafting-error.ts`: add the code list `GEOMETRY_DEGENERATE_SEGMENT`, `GEOMETRY_PATH_NOT_CLOSED`, `GEOMETRY_LENGTH_OUT_OF_RANGE` and `GEOMETRY_OFFSET_FAILED` as a const union type.
- `packages/engine/vitest.config.ts` (new): v8 coverage, thresholds 85% for lines, branches and functions (NFR-10).
- `eslint.config.mjs`: the engine purity block (see Tests).
- `packages/engine/package.json`: add `@vitest/coverage-v8` (dev, MIT) and `test:coverage`.

## Data, API, migrations

None.

## Tests

Every number is checked to ± 0.01 mm unless noted.

- **Known answers:**
  - A 3-4-5 line has length 5.
  - A quarter circle as a cubic (k = 0.5523) has length πr/2 ± 0.03 % for r = 100.
  - `splitAtLength(50)` on a 100 mm line gives 50 + 50.
  - Rotating (10, 0) by 90° about the origin gives (0, 10).
  - Mirroring across y = x swaps x and y.
  - The x-axis and a vertical line meet at a known point.
  - A line through a symmetric cubic gives 2 known roots.
  - Two cubics have 1 known crossing.
  - A figure-8 path has 1 self-intersection; a square has none.
  - A 100 mm square offset by 10 mm with mitre has perimeter 480 mm.
  - The unit square has signed area +1 when anticlockwise.
- **Property tests (fast-check):**
  - The lengths of the split parts add up to the whole.
  - Mirroring twice gives the same path (identity).
  - A rotation keeps the length.
  - `reversePath` twice is the identity.
  - Offsetting a convex polygon by d with mitre increases the perimeter by 2d·Σ tan(θᵢ/2) for its exterior angles θᵢ.
  - Inputs are deep-frozen before each call, so a mutation throws.
- Degenerate input throws the expected `DraftingError` code: a zero-length segment, or a non-finite coordinate.
- Lint: add an ESLint block for `packages/engine/src/**` that bans `Math.random` (`no-restricted-properties`) and `Date` (`no-restricted-globals`); no rule covers the engine today. A fixture file with `Math.random` fails the lint (checked once by hand during the build).
- Coverage ≥ 85% (`pnpm --filter @tafsila/engine test:coverage`).
- Manual test cases: none (no UI).

## Decisions

The build writes them as `docs/decisions/124-geometry-kit.md`.

1. **Shared types.** The engine uses the schemas' `Point`, `Segment` and `Path` types; it has no private copy.
2. **Tolerances** are named constants:

   | Constant                    | Value |
   | --------------------------- | ----- |
   | `GEOMETRY_EPSILON_MM`       | 0.01  |
   | `CURVE_LENGTH_TOLERANCE_MM` | 0.001 |
   | `OFFSET_TOLERANCE_MM`       | 0.05  |
   | `MITRE_LIMIT`               | 4     |

   All four are well inside NFR-01's ± 1 mm.

3. **Offset method.** Tiller–Hanson with subdivision, and mitre corners with a square cut. Seam-corner shapes are left to #130.
4. **Coverage tool.** Add `@vitest/coverage-v8` as a free dev dependency. The 85% engine threshold is enforced in its own test config.

## Docs

- `docs/engine/README.md`: a "Geometry kit" section with a table of each helper and what it is for.
- Handbook glossary: "Bézier curve", "path offset" and "mitre corner", if missing.
- A tech card for `@vitest/coverage-v8` (`docs:check` requires it).
- Learning-log row.

## Risks

- **Curve–curve intersection and cubic offset are the hard parts.** Both are bounded by tolerance constants and tested against analytic shapes. If either takes too long in the build, ship lines plus `lineCubic` first, and keep `cubicCubic` behind tests in the same PR. Do not drop it.
- **Floating-point drift.** Every comparison goes through `GEOMETRY_EPSILON_MM`.

## Size

L (raised from M: six files of non-trivial maths plus property tests). build:opus (unchanged).
