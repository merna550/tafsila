# Plan — #138 bodice shaping (princess seams and dart-free)

Copy of the approved plan comment on issue #138.

## Approach

Add bodice shaping modules after the base darted block. Princess variants pivot the existing dart intake into a shoulder- or armhole-origin style line, split front/back into centre and side panels, pair the curved seams, and place bust-level notches. `none` removes darts by distributing intake as style ease only for loose/semi-fitted designs; fitted dart-free requests keep safe geometry and emit the documented bilingual incompatibility warning.

## Files to create/change

- `packages/engine/src/constants/bodice-shaping.ts`: bust-point offset and style-line/ease limits.
- `packages/engine/src/modules/bodice/{dart-pivot,princess,dart-free}.ts` plus focused/property/snapshot tests.
- Shared geometry transform/split helpers only if they are reusable and separately tested.
- Registry and module validation/messages for seam pairing, notch alignment and unsupported fitted/no-dart input.
- Seed fixtures, `docs/plans/138-bodice-shaping.md`, decision, engine README/test-case/learning-log, snapshots and engine version.

No database, migration, HTTP/OpenAPI, or public schema change is expected.

## Test plan

- Unit: shoulder/armhole pivot endpoints, panel paths/edges, removed dart metadata, paired seam/notch refs, loose/semi-fitted dart-free distribution.
- Property: princess seam lengths within 2 mm, notches within 2 mm, finished bust/waist circumference within 5 mm, closed non-self-intersecting panels across the size matrix.
- Integration/snapshot: darts, both princess variants and none; deterministic output and stable validation codes.
- Manual drafts: `TC-BODICE-138-01` princess shoulder, `-02` princess armhole, `-03` loose dart-free, `-04` fitted incompatibility, `-05` bust-notch alignment; retain `needs:sew-test` for both princess variants in three sizes.

## Risks and handling

- Curve splitting/pivoting can change total seam length: true paired curves after the transform and assert circumference independently.
- Fitted woven without shaping is physically unsafe: warn explicitly and do not silently claim fitted output.

## Estimate, labels, and decisions

- Size `M`, `build:opus`; `needs-interactive`: no.
- ADR decisions: pivot preserves total intake/circumference; princess panels replace original pieces with stable ids; dart-free intake becomes ease only for supported fits.
- Comment-only plan per Merna; implementation adds plan/decision files.

## Deviations

- File names: `modules/bodice/{dart-pivot,style-line,panel-parts,panels,princess-front,princess-back,princess,dart-free}.ts`; the constants are in `src/constants/bodice-shaping.ts` as planned.
- The sleeve (#134) changed too: it finds the armhole pieces with `armholeParts` instead of the fixed `bodice-front` / `bodice-back` ids, so a princess armhole split between two panels still takes the sleeve (decision 138, 5). The plan did not list it; without it a princess bodice with set-in sleeves would fail.
- Dart-free: the plan said the intake becomes ease "only for supported fits"; the waist keeps its planned finished size (the fit's ease table already gives a loose bodice its ease) and the bust dart becomes length ease at the centre front. A fitted dart-free design is drawn the same way with a FR-VAL-08 warning (decision 138, 6).
- Validation reuses the core FR-VAL-01, -03 and -04 rules (the panels declare paired edges, notches and body lines); the only module rule is the dart-free fit check.
- The toile criterion moved to the follow-up issue #208 (sew-test rule, #184).
