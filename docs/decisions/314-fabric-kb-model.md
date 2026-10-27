# ADR-314 · 2026-10-27 · Fabric knowledge base model

## Context

FR-REC-01/02 need a rules engine that maps a `DesignSpec` to fabric properties and returns 3 to 5 catalogue fabrics with reasons and an avoid list. The model must be predictable for a tailor and reusable by the API (#317) and web.

## Decision

1. Five properties (`drape`, `weight`, `body`, `stretch`, `sheen`), each an integer 0 to 4. `stretch` is 0 on every fabric in v1 (woven only). `body` is added to SRS §7.
2. A rule has conditions (`in`, `not-in`, `is-true` over DesignSpec paths), an effect (property, `min`/`max`, `strength` `prefer` or `must`), a priority 1 to 5 and a bilingual reason. A fabric breaking a matched `must` goes to the avoid list with that rule's reason; `prefer` only changes the score.
3. Score = sum over matched rules of `priority x fit`, `fit` = 1 inside the range, minus 0.5 per step outside (not below 0). Top 5 with a positive score; fewer than 3 are filled from the best non-avoided fabrics. Ties by fabric id. The reason is the one of the highest-priority matched rule the fabric satisfies (ties by rule id), else a neutral "versatile choice". An absent value (for example `skirt` on a blouse) matches no condition, not even `not-in`.
4. Valid rule paths are one typed table (`RULE_PATHS`) cross-checked against `designSpecSchema` by a test, instead of reflection over Zod.
5. The draft catalogue and rules live in `packages/fabric-kb` as the single source; the database copy (#317) is tested against it. They are marked DRAFT until Merna reviews them in the PR.

## Reason

A sum with one fall-off is easy to predict and explain. A typed path table fails loudly when the spec changes and is simpler than reflection. All of it is cheap to reverse before the beta.

## Alternatives

Weighted vectors or cosine similarity (hard for a tailor to predict); deriving paths from the Zod schema by reflection (fragile across Zod versions).
