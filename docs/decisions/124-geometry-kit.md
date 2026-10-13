# ADR-124 · 2026-10-14 · Geometry kit

**Context:** Issue #124 (NFR-01, NFR-08, NFR-10). Every later engine issue needs the same 2D maths; no module may write its own.
**Decision:**

1. **Shared types.** The engine uses the `Point`, `Segment` and `Path` types of `@tafsila/schemas` (#121). The old engine-only `CubicBezier { p0..p3 }` is gone; Bézier helpers take the schema's `cubic` segment (`from`, `c1`, `c2`, `to`). The sleeve-cap code moved to it with no change in output, so `ENGINE_VERSION` stays.
2. **Tolerances** are named constants in `packages/engine/src/constants/geometry.ts`, all far inside NFR-01's ± 1 mm:

   | Constant                    | Value | Use                                            |
   | --------------------------- | ----- | ---------------------------------------------- |
   | `GEOMETRY_EPSILON_MM`       | 0.01  | same point, closed path, merging crossings     |
   | `CURVE_LENGTH_TOLERANCE_MM` | 0.001 | curve length and length-to-parameter searches  |
   | `INTERSECTION_TOLERANCE_MM` | 0.001 | curve–curve subdivision stops                  |
   | `OFFSET_TOLERANCE_MM`       | 0.05  | largest error of an offset curve               |
   | `MITRE_LIMIT`               | 4     | mitre corner reach, in multiples of the offset |

3. **Offset method.** Lines exactly; cubics by Tiller–Hanson, split until within 0.05 mm (up to 1024 pieces, then `GEOMETRY_OFFSET_FAILED`). Outside corners meet at the mitre point, cut square past the limit; inside corners are trimmed where the offsets cross. Positive distances go outwards for a path with positive `signedArea` (anticlockwise in maths axes). Seam-specific corners (fold-back at darts and hems) belong to #130.
4. **Curve–curve intersections** use box subdivision down to 0.001 mm. Two cubics cross at most 9 times (Bézout), so more than 9 crossings means the curves overlap and the call throws `GEOMETRY_DEGENERATE_SEGMENT`.
5. **Error codes** for degenerate input: `GEOMETRY_DEGENERATE_SEGMENT`, `GEOMETRY_PATH_NOT_CLOSED`, `GEOMETRY_LENGTH_OUT_OF_RANGE`, `GEOMETRY_OFFSET_FAILED` (`GEOMETRY_ERROR_CODES`).
6. **Coverage tool.** `@vitest/coverage-v8` (MIT, free) as an engine dev dependency. The engine's `test` script runs with coverage and fails below 85% lines, branches or functions (NFR-10), so CI enforces it. The tech card is the Vitest card (one card for the runner and its coverage plugin).
7. **Purity lint.** An ESLint block for `packages/engine/src/**` bans `Math.random` and `Date`. Property tests deep-freeze their inputs, so any mutation throws.

**Consequences:** Later issues (#125 pipeline, #130 seam allowance, blocks, validation) import from `src/geometry/` only. A self-looping single cubic is not reported by `selfIntersections` (documented limit).
