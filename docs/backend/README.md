# Backend documentation

Kept current in the same PR as every backend change (Definition of Done).

| Doc               | What it answers                                                                     |
| ----------------- | ----------------------------------------------------------------------------------- |
| `architecture.md` | Layers (engine → services → adapters), request flow, where code goes                |
| `api-reference`   | Generated from OpenAPI at `/api/docs` (Scalar UI) — every endpoint, schema, example |
| `seed-data.md`    | Test accounts and records created in every non-prod environment                     |
| `environments.md` | dev / preview / staging / prod: URLs, data, keys, how to switch                     |
| `tutorials/`      | Step-by-step how-tos (below)                                                        |
| `../plans/`       | One file per issue: the approved plan (copied from the issue comment)               |
| `../test-cases/`  | Manual test scenarios per feature                                                   |
| `../../postman/`  | Ready-to-run Postman collection + environments                                      |

## Tutorials

| Tutorial                          | When                                                                      |
| --------------------------------- | ------------------------------------------------------------------------- |
| `tutorials/run-locally.md`        | First time on a machine; daily start                                      |
| `tutorials/add-endpoint.md`       | New API route (schema → service → adapter → tests → OpenAPI → Postman)    |
| `tutorials/add-migration.md`      | Any DB change (migration, RLS, seed update, types regen)                  |
| `tutorials/use-postman.md`        | Testing the API by hand                                                   |
| `tutorials/switch-environment.md` | Pointing the app/tools at dev, staging or prod                            |
| `tutorials/docker.md`             | Images, containers, compose profiles, prod-like local run                 |
| `tutorials/add-garment-module.md` | New pattern feature in the engine (geometry, validation, tests, sew test) |
