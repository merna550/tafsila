# ADR-130 · 2026-10-17 · Seam allowance per edge and the cutting line

**Context:** Issue #130 (FR-PAT-03, FR-VAL-05, NFR-01). Plan: `docs/plans/130-seam-allowance-cutting-line.md`.
**Decision:**

1. **Edge `kind` is a field on `Edge`** (`side | neckline | armhole | hem | other | fold`, optional), not derived from the id. `fold` means "cut on the fold": its allowance is always 0, even when a per-edge override names it. An edge with no kind uses the `other` default. `EdgeKind` in `EngineOptions` keeps its five kinds; `fold` has no default.
2. **Waist and centre seams use the `other` default (15 mm).** The method has no separate waist allowance. Changing it is one line in `DEFAULT_SEAM_ALLOWANCE_MM`.
3. **Corners:** the **mirrored hem corner** where a hem meets a seam (any kind except `hem` and `fold`, including an uncovered segment), a mitre everywhere else (with the square cut past `MITRE_LIMIT` from decision 124). The mirrored corner extends the seam cut line to the hem stitch line (P), mirrors it across that line, and meets the hem cut line (Q). On a square corner it equals the mitre.
4. **Where the mirrored corner lives:** in the geometry kit (`src/geometry/mirror-corner.ts`), not in `finishing/hem-corner.ts` as the plan named it. It needs to trim and extend the offset pieces, which only `offsetPath` holds, and decision 124 keeps all maths in the kit. `offsetPath` takes `cornerAt(index) => "mitre" | "mirror-hem-after" | "mirror-hem-before"`. The hem stitch line is the hem segment's tangent at the corner, so no separate `mirrorLine` option is needed. When two of the lines are parallel the corner falls back to the mitre.
5. **Darts stay inside the outline** in v1 blocks and get no allowance treatment here. A module that opens a dart into the outline owns its corner.
6. **Segments and edges:** an edge covers `fromSegment..toSegment` inclusive and may wrap past the last segment. A segment no edge covers gets the `other` default quietly (the structural check in #132 reports incomplete edge lists). Two edges on one segment throw `FINISHING_EDGES_OVERLAP`; an index past the path end throws `FINISHING_EDGE_OUT_OF_RANGE` (both block bugs, not user input).
7. **Orientation:** the step negates the distances for a clockwise stitch path instead of reversing it, so segment indices stay valid.
8. **`ENGINE_VERSION` stays 0.1.0:** the default registry has no modules yet, so no real input gives different geometry. Only the test rectangle changes.
9. **Manual check:** `pnpm engine:print seam-rectangle <size>` prints the test rectangle through the pipeline (waist 15, side 15, hem 30, centre front on the fold).
