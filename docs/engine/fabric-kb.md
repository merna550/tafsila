# Fabric knowledge base (`packages/fabric-kb`)

Pure package `@tafsila/fabric-kb`: `recommend(spec, catalogue, rules)` returns the best 3 to 5 fabrics with a bilingual reason each and an avoid list (FR-REC-01, FR-REC-02, NFR-06). It depends on `@tafsila/schemas` only (dependency-cruiser rule `fabric-kb-is-pure`). Decision: [ADR-314](../decisions/314-fabric-kb-model.md).

**Status of the data: DRAFT.** `src/draft-catalogue.ts` (16 woven fabrics, the 8 of FR-REC-02 plus common Egyptian market fabrics) and `src/draft-rules.ts` (21 rules) await Merna's review in the PR ([review checklist](../test-cases/engine/fabric-kb-review.md)). `DRAFT` in `src/draft-status.ts` becomes `false` after her review comment. The same data seeds the database in #317.

## Data model (`packages/schemas/src/fabric.ts`)

- `Fabric`: `id` (kebab-case), `nameAr`, `nameEn`, `properties` (`drape`, `weight`, `body`, `stretch`, `sheen`, integers 0 to 4), `careNotes` (ar/en). Scales: drape 0 stiff to 4 fluid, weight 0 very light to 4 heavy, body 0 limp to 4 crisp, sheen 0 matte to 4 glossy, stretch always 0.
- `FabricRule`: `id`, `when` (all conditions must hold), `effect` (`property`, `min`/`max`, `strength` `prefer` or `must`), `priority` 1 to 5, `reason` (ar/en).
- Condition: `{ path, op: "in" | "not-in" | "is-true", values? }`. Paths come from `RULE_PATHS` (`src/rule-paths.ts`), for example `skirt.type`, `sleeve.type`, `bodice.fit`, `neckline.collar`, `pockets`, `lining`. An absent value (no `skirt` on a blouse) matches nothing.

## Scoring

1. Keep the rules whose conditions all hold.
2. A fabric that breaks a matched `must` rule goes to the avoid list with that rule's reason (the highest-priority breaking rule) and is never recommended.
3. Every other fabric scores, for each matched rule, `priority x fit`. `fit` is 1 inside the range and drops by 0.5 per step outside it (not below 0).
4. Take the top 5 with a score above 0; if fewer than 3, fill up to 3 from the best remaining. Ties are broken by fabric id, so the result never depends on input order.
5. The reason is the one of the highest-priority matched rule the fabric satisfies; with none, the neutral "versatile choice" text.

Worked example, half-circle skirt: `circle-skirt-drape` (must, drape >= 2, priority 5) puts taffeta, linen and poplin on the avoid list. Crepe (drape 3, weight 2) earns 5 from that rule and 3 from `circle-skirt-light` (prefer, weight <= 2), so 8 plus any other matched rule. Chiffon (drape 4, weight 0) also fits both ranges. Add pockets and chiffon moves to the avoid list through `pockets-opaque` (must, weight >= 1).

## Add a fabric or a rule

1. Add the entry in `draft-catalogue.ts` or `draft-rules.ts` (a new path or value first goes into `rule-paths.ts`).
2. `pnpm --filter @tafsila/fabric-kb test`: the tests reject unknown paths and values, missing Arabic or English text, duplicate ids, and a changed DesignSpec enum.
3. Look at the result for a design: `pnpm --filter @tafsila/fabric-kb print puffSleeveBlouse`.
4. Update the snapshot only after reading the diff.
