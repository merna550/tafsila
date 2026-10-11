# Plan #94: OpenAPI generation, Postman collection and Newman tests

Approved plan comment: <https://github.com/merna550/tafsila/issues/94#issuecomment-6113495013>. Decisions: [ADR-94](../decisions/94-openapi-postman-newman.md).

1. Move `/api/health`, `/api/me` and `/api/debug/error` to `@hono/zod-openapi` (`createRoute` + `.openapi`); add `healthResponseSchema` to `packages/schemas`; `errorResponses(...)` documents errors with the standard body; bearer auth registered as a security scheme; `defaultHook` throws `ValidationError`.
2. `packages/api/src/openapi/` builds a byte-stable document; `pnpm api:openapi` writes `packages/api/openapi.json` with `tsx`. `/api/openapi.json` always, `/api/docs` (Scalar) outside production.
3. `scripts/gen-postman.mjs` reads the document, strips random ids, drops the `debug` folder and appends `ERR` cases from `postman/err-cases.json`; `pnpm api:postman` is idempotent.
4. `packages/api/src/dev/test-server.ts` (local key pair, ready token) and `scripts/api-test.mjs` (`pnpm api:test`, `--base-url`, `--break=health`).
5. `scripts/api-check.mjs` (`pnpm api:check`, in `pnpm quality`); `api` target in `scripts/ci-paths.mjs`; two `if`-gated steps in the quality job.
6. Docs: remove "(planned)" notes, tech cards (`tsx`, Hono), glossary, tutorials, skill, rules, SRS §8, test cases `docs/test-cases/api/94-openapi-postman-newman.md`.
