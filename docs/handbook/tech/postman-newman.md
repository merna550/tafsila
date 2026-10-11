---
packages: [newman, openapi-to-postmanv2]
level: beginner
adr: ADR-006
---

# Postman and Newman

**In one line:** A ready-made API collection Merna can run with one click, and the same collection run automatically in CI.

## What it is (plain words)

Postman is an app for sending requests to an API. A collection is a saved set of requests with checks. Newman is its command-line runner, so the same collection runs in CI or in Docker without the app.

## Why we chose it

- **Merna can test without code:** import, pick an environment, press Run ([postman README](../../../postman/README.md)).
- **Same collection in CI,** so a broken endpoint fails the pull request, not a customer.
- **Generated from OpenAPI,** so it never drifts from the real routes; the Zod schemas are the source ([zod](zod.md), [hono](hono.md)).
- **Journey ordered:** requests follow a real user flow and negative `ERR ...` cases check errors.

## Alternatives we considered (and why not)

- **Insomnia:** similar, smaller ecosystem for CI.
- **Bruno:** good local-first option, but Postman is what most agents and tutorials know.

## When we would change it

If Postman's pricing or account requirement for collaboration becomes a problem, switch to Bruno or plain Newman files; the generator `scripts/gen-postman.mjs` is the only place that knows the format.

## Where it lives in our code

- `postman/` (README, `collection-prerequest.js`, `collection-tests.js`, `environments/`).
- `scripts/gen-postman.mjs` (OpenAPI to collection), `scripts/api-check.mjs`, `scripts/api-test.mjs`, `postman/err-cases.json` (the `ERR` requests), `compose.yaml` (service `newman`, profile `tools`).
- Tutorial: [use-postman](../../backend/tutorials/use-postman.md); seeded test accounts: [seed-data](../../backend/seed-data.md).

## The 20% you need

- Never edit the collection by hand; change the route's schema and regenerate (`pnpm api:openapi && pnpm api:postman`; `pnpm api:check` fails when they are stale).
- Environments (`local`, `staging`, `prod`) hold the base URL and keys; secrets stay on your machine.

## Commands you'll use

```bash
pnpm api:openapi     # routes -> packages/api/openapi.json
pnpm api:postman     # openapi.json -> postman/tafsila.postman_collection.json (twice changes nothing)
pnpm api:check       # fails when either committed file is stale
pnpm api:test        # Newman against a throwaway local API (no Docker, no Supabase)
pnpm api:test --base-url https://staging.example.com   # same collection against a given API
docker compose --profile tools run newman
```

## Common mistakes

- Committing a Postman environment with real keys.
- Running production tests against live payments.

## Learn more

- [Postman docs](https://learning.postman.com/docs/), [Newman](https://github.com/postmanlabs/newman#readme)
- Glossary: [Postman](../glossary.md#postman), [OpenAPI](../glossary.md#openapi)
