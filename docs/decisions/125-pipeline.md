# ADR-125 · 2026-10-15 · generatePattern pipeline

**Context:** Issue #125 (FR-PAT-01, NFR-08). Plan: `docs/plans/125-generate-pattern-pipeline.md`.
**Decision:**

1. **Context shape.** `DraftContext` is one frozen value. Modules add pieces and checks only through `withPiece`/`withCheck`; a change to a piece returns a new piece with the same id.
2. **Input hash.** FNV-1a 64-bit over canonical JSON (sorted keys, `-0` as `0`), written `fnv1a64:<16 hex>`. Synchronous, no dependency, same in browser and Node. It only detects "same input", so collisions do not matter. SHA-256 can replace it later by changing the prefix.
3. **Invalid input** returns a `fail` result with no pieces, keyed `FR-MEAS-01` plus a code (`SPEC_INVALID`, `MEAS_INVALID`, `OPTIONS_INVALID` or a `MEAS_*` rule code). Only programming errors throw `DraftingError` (`PIPELINE_DUPLICATE_MODULE`, `PIPELINE_UNSUPPORTED_COMBINATION`, `PIPELINE_NON_FINITE_NUMBER`).
4. **Steps** are fixed now; empty ones are identity functions that name the issue that fills them.
5. The engine does not depend on `zod` directly; it reads only the issue list of a schema error.
