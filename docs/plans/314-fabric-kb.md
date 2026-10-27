## Plan #314: packages/fabric-kb, catalogue and recommendation rules

plan:sonnet · build:sonnet · size M (unchanged) · M5 wave 2 · FR-REC-01, FR-REC-02, NFR-06 · ADR-312 items 1, 6, 7, 8 · Screens: `FabricRecommend.dc.html` (#312, merged)

### Approach

A pure package with two layers: types and validation live in `@tafsila/schemas` (so the API and web can reuse them), logic lives in `@tafsila/fabric-kb`.

**Data model (decided here, see Decisions):**

- `Fabric`: `id` (kebab-case slug, stable), `nameAr`, `nameEn`, `properties { drape, weight, body, stretch, sheen }`, `careNotes { ar, en }`. Each property is an integer 0 to 4. `stretch` exists for the schema but is 0 on every draft fabric (woven only, SRS §2).
- `Rule`: `id`, `when` (a list of conditions that must all hold), `effect`, `priority` (1 to 5), `reason { ar, en }`.
  - Condition: `{ path, op: "in" | "not-in" | "is-true", values? }` over DesignSpec paths such as `skirt.type`, `sleeve.type`, `bodice.fit`, `neckline.collar`, `lining`, `pockets`, `skirt.length`.
  - Effect: `{ property, min?, max?, strength: "prefer" | "must" }`. A `must` that a fabric breaks puts it on the avoid list with that rule's reason; a `prefer` only changes the score.
- `recommend(spec, catalogue, rules) → { recommended: Recommendation[3..5], avoid: AvoidItem[] }`.
  - Score per fabric = sum over matched rules of `priority × fit`, `fit` = 1 inside the range, falling by 0.5 per step outside it for `prefer`.
  - Fabrics breaking a matched `must` go to `avoid` and are never recommended.
  - Take the best 5 with a positive score; if fewer than 3, fill with the best remaining non-avoided fabrics. Ties by `id` ascending (deterministic, NFR-08).
  - Each recommendation's one-line reason is the reason of the highest-priority matched rule it satisfies (ties by rule id); if none matched, a neutral "versatile choice" key from the package.
- **Which paths and values are valid** is one typed table `RULE_PATHS` (path → allowed values). A test cross-checks it against `designSpecSchema` enums so a schema change breaks the test, and a rule with an unknown path or value fails validation (acceptance criterion).

**Draft data (marked DRAFT, for Merna's review):**

- `draft-catalogue.ts`: the 8 fabrics in FR-REC-02 (كريب، شيفون، جورجيت، ستان، كتان، قطن بوبلين، فسكوز، تافتا) plus about 8 common woven fabrics of the Egyptian market (for example دانتيل، مخمل، جاكار، تل، قطن مطبوع، كريب ساتان، لينن مخلوط، بوليستر ثقيل).
- `draft-rules.ts`: about 18 rules: circle and gathered skirts (need drape, avoid stiff and heavy), fitted bodice (needs body and low stretch behaviour), puff and bishop sleeves (need body or crispness), flutter sleeve (needs drape), collars (need body), lining present (sheer fabrics preferred away), pleats (need crease holding), tiered skirt, straight skirts (body), pockets (avoid very sheer).
- Exports `DRAFT = true` per entry plus a file header "DRAFT: reviewed by Merna in the PR"; the review status is shown in the package docs.
- This data is also the source for the database migration in #317; a test there keeps the two equal.

### Files

Create:

- `packages/schemas/src/fabric.ts` (+ `fabric.test.ts`), export from `packages/schemas/src/index.ts`.
- `packages/fabric-kb/package.json` (name `@tafsila/fabric-kb`, depends on `@tafsila/schemas` only; devDeps like the engine), `tsconfig.json`, `vitest.config.ts`, `README.md`.
- `packages/fabric-kb/src/`: `index.ts`, `rule-paths.ts`, `conditions.ts` (does a condition match a spec), `score.ts`, `recommend.ts`, `validate-rules.ts`, `draft-catalogue.ts`, `draft-rules.ts`, `reasons.ts` (neutral reason), and `*.test.ts` next to each.
- `docs/engine/fabric-kb.md` (package page: data model, scoring, how to add a fabric or rule, DRAFT status).
- `docs/test-cases/engine/fabric-kb-review.md` (Merna's review checklist, below).
- `docs/decisions/314-fabric-kb-model.md`.

Change:

- `docs/SRS.md` §7: add `body` to `fabrics.properties` (the table lists drape, weight, stretch, sheen; the issue adds body, FR-REC-01 names it) and add the `strength` field to `fabric_rules` (rule 5: same PR).
- `docs/ARCHITECTURE.md`: one line for `packages/fabric-kb`; `docs/CONTEXT_MAP.md`: a row for fabric work; `docs/engine/README.md`: link.
- `.dependency-cruiser.cjs`: `packages/fabric-kb` may import only `@tafsila/schemas` (and not `apps/`, `packages/api`, `packages/engine`).
- `docs/handbook/` glossary: drape, body, hand of a fabric; `docs/handbook/learning-log.md` row. Workspace/turbo config picks the package up through the existing globs; verify with `pnpm install` and a `turbo` dry run.

No API route, no table, no migration here (all #317).

### Test plan

- **Schemas:** a fabric with a property of 5 or a missing Arabic name is rejected; a rule with an empty `when` or priority 0 is rejected.
- **Rule validation (acceptance):** every draft rule references a path in `RULE_PATHS` and values the schema allows; a rule with `skirt.typ` or `skirt.type in ["spiral"]` fails; `RULE_PATHS` equals the `designSpecSchema` enums (breaks when the schema changes).
- **Catalogue:** every fabric has Arabic and English names and care notes; ids unique and kebab-case; the 8 FR-REC-02 names are present.
- **Conditions:** table tests for `in`, `not-in`, `is-true` including optional fields that are absent (`skirt` undefined on a blouse: no match, no throw).
- **recommend, concrete inputs:**
  - `vNeckHalfCircleDress` (circle-half skirt): crepe/chiffon/georgette/viscose class fabrics recommended; taffeta and stiff heavy cotton on avoid with the circle-skirt reason.
  - `puffSleeveBlouse`: a fabric with body ranks above chiffon.
  - `linedCircleSkirt`: result has 3 to 5 entries, reason text in both languages.
  - A spec that matches no rule still returns 3 fabrics with the neutral reason.
- **Snapshot** (`toMatchSnapshot` of ids, scores, reasons) for these fixture designs: `vNeckHalfCircleDress`, `dartedBlouse`, `puffSleeveBlouse`, `gatheredKneeSkirt`, `pleatedKneeSkirt`, `linedCircleSkirt`, `seedDress`.
- **Every fixture design** (all `DesignSpec` exports of `@tafsila/test-fixtures` that pass `designSpecSchema`): 3 to 5 recommendations, each with non-empty ar/en reason, avoid list present (may be empty), no fabric in both lists.
- **Property (fast-check):** over generated valid specs, `recommend` is deterministic (two calls equal), shuffling the catalogue or rule order does not change the result, length always 3 to 5, no overlap between the lists.
- **Coverage** follows the engine package config.

### Manual test cases (draft)

`docs/test-cases/engine/fabric-kb-review.md`:

- TC-FAB-314-01: Merna reads each draft fabric's five scales and care notes and corrects any that a tailor would dispute.
- TC-FAB-314-02: Merna reads each rule's reason in Arabic and English (wording and sewing sense).
- TC-FAB-314-03: for 5 designs she knows well, the printed recommendations (run `pnpm --filter @tafsila/fabric-kb print <fixture>`, a small `tsx` script in the package) match what she would suggest.
- TC-FAB-314-04: Egyptian market names are the ones shops use.

### Decisions to log (build writes `docs/decisions/314-fabric-kb-model.md`)

1. Property scale 0 to 4 integers for all five properties; `stretch` always 0 in v1; `body` added to SRS §7.
2. Rules have `strength: prefer | must`; `must` breaks feed the avoid list.
3. Scoring formula above, ties by id, 3 to 5 results with a neutral fallback reason.
4. Valid paths are a typed table cross-checked against the Zod schema rather than derived by reflection (simpler and fails loudly).
5. Draft data lives in the package as the single source; the database copy (#317) is checked against it.

None is costly to reverse before the beta, so no `needs:decision`.

### Docs to update

SRS §7, ARCHITECTURE, CONTEXT_MAP, engine README link, `docs/engine/fabric-kb.md`, glossary, learning log, the decision file, the test-case file.

### Risks

- **Content quality:** the rules are only as good as the sewing knowledge. Mitigation: DRAFT label, Merna's review in the PR, admin editing after launch (#320).
- **Scoring too clever:** kept to a sum with one fall-off so a tailor can predict it; the docs show a worked example.
- **Schema drift** (new spec fields in M6+): the `RULE_PATHS` cross-check test fails loudly.

### Labels and needs

Size M, `plan:sonnet`, `build:sonnet` stay. `node scripts/needs-interactive.mjs` on the files above: `no`. Status stays `status:plan-review` until Merna approves.

**Needs from Merna:** approval of this plan now; the real review of the fabric and rule content in the build PR.

## Deviations

- Rule `lining-not-heavy` is a `prefer weight <= 2` rule (a lining adds bulk). The plan only said "lining present", and the allowed operators cannot express "unlined and sheer".
- Rule `fitted-bodice-body` is `prefer` only (no `must`), so chiffon and viscose stay recommendable for fitted dresses with a circle skirt.
- 21 rules instead of "about 18"; 16 fabrics.
