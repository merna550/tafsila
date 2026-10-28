# Edit a fabric or a recommendation rule through the API

The catalogue and the rules live in the database (`fabrics`, `fabric_rules`), so an admin changes them without a deploy. There is no admin screen yet (a later issue); this tutorial uses the API. Decision: [317](../../decisions/317-fabric-api.md).

## Before you start

- An admin account and its token ([make a user an admin](make-a-user-admin.md)). The token must say `admin`; sign out and in again after the role change.
- The base URL: local `http://localhost:3000/api`, staging in the Vercel project.

## Read

```bash
curl -s -H "Authorization: Bearer $TOKEN" "$BASE/admin/fabrics"      # the catalogue
curl -s -H "Authorization: Bearer $TOKEN" "$BASE/admin/fabric-rules"  # the rules
```

Each row has `isDraft`, `updatedAt` and `updatedBy` (null for the seeded rows).

## Change a fabric after review

Set the properties (0 to 4) and mark the fabric as reviewed:

```bash
curl -s -X PATCH -H "Authorization: Bearer $TOKEN" -H "content-type: application/json" \
  -d '{"properties":{"drape":3,"weight":2,"body":2,"stretch":0,"sheen":1},"isDraft":false}' \
  "$BASE/admin/fabrics/crepe"
```

`properties` is replaced whole: send all five.

## Add or change a rule

A rule has `when` (tests over the design), `effect` (a property range and `prefer` or `must`), `priority` 1 to 5 and a bilingual `reason`. Paths and values must be ones the engine knows (`packages/fabric-kb/src/rule-paths.ts`):

```bash
curl -s -X POST -H "Authorization: Bearer $TOKEN" -H "content-type: application/json" \
  -d '{"id":"flutter-sleeve-light","when":[{"path":"sleeve.type","op":"in","values":["flutter"]}],"effect":{"property":"weight","max":1,"strength":"prefer"},"priority":3,"reason":{"ar":"الكم الفراشة يحتاج خامة خفيفة","en":"A flutter sleeve needs a light fabric"}}' \
  "$BASE/admin/fabric-rules"
```

A wrong path such as `skirt.typ` answers `422 FABRIC_RULE_INVALID` and `details.fields["when.0"]` names the problem. A used id answers `409 FABRIC_ID_TAKEN`.

## Check the result

1. `GET /api/fabrics/recommend?versionId=<a saved version>` now reflects the change (no deploy, no cache).
2. Every write left an audit row: `select at, who, action, target from public.admin_audit where action like 'fabric%' order by at desc;`.

## Good to know

- `must` rules put a fabric on the avoid list; `prefer` rules only change the score ([ADR-314](../../decisions/314-fabric-kb-model.md)).
- A token that still says admin after the role was removed gets `403 FORBIDDEN` and no audit row: the database checks the role again.
- Deleting a fabric or rule cannot be undone from the API; the audit row keeps its `before` data.
