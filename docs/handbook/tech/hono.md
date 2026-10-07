---
packages: [hono]
level: beginner
adr: ADR-005
---

# Hono

**In one line:** The small web framework that powers our API, written once and runnable inside Next.js today or standalone later.

## What it is (plain words)

Hono defines HTTP routes (`GET /health`, `POST /designs`) as functions that receive a standard web `Request` and return a standard `Response`. Because those are the same objects browsers and edge runtimes use, a Hono app runs almost anywhere.

## Why we chose it

- **Web-standard, so it moves.** The same app runs inside a Next.js route today and as a standalone Node, Docker or edge service later with no rewrite ([ADR-005](../../DECISIONS.md)).
- **Typed RPC client.** The frontend can call routes with types inferred from the server, so a renamed field fails typecheck in the UI.
- **Tiny and fast,** with built-in middleware (CORS, validation hooks) and first-class [Zod](zod.md) integration, which also feeds the generated OpenAPI and [Postman](postman-newman.md) collection.
- **Fits hexagonal layering.** Routes only validate, call a service and map the result ([CODING_STANDARDS section 2](../../CODING_STANDARDS.md)).

## Alternatives we considered (and why not)

- **Express:** old, not web-standard, weak types.
- **Fastify:** Node-only.
- **NestJS:** heavy structure for a solo project.
- **tRPC:** great with TypeScript clients, but awkward for Postman, mobile apps and webhooks, which need plain HTTP.

## When we would change it

If the API must scale beyond what one Next.js deployment gives, we extract `packages/api` to `apps/api` (still Hono). Replacing Hono itself would only touch `packages/api/src/routes` and `app.ts`.

## Where it lives in our code

- `packages/api/src/app.ts` (`createApp`), `packages/api/src/routes/health.ts`.
- `packages/api/src/middleware/error-handler.ts`, `packages/api/src/container.ts` (composition root).
- Mounted by `apps/web/src/app/api/[[...route]]/route.ts`.
- Tests: `packages/api/src/app.test.ts`.

## The 20% you need

```ts
// packages/api/src/routes/health.ts
return new Hono().get("/health", (c) =>
  c.json({ status: "ok", environment: container.appInfo.environment /* ... */ }),
);
```

- Routes live in sub-apps combined with `app.route("/", healthRoutes(container))`.
- Tests call `app.request("/api/health")` directly; no server needs to start.

## Commands you'll use

`pnpm test` (API tests), `pnpm dev` then `curl http://localhost:3000/api/health`.

## Common mistakes

- Business logic in a route (it belongs in `services/`).
- Importing an adapter (Supabase, Paymob) from a route or service; use the container and ports.

## Learn more

- [Hono docs](https://hono.dev/docs/) (official)
- Glossary: [Hono](../glossary.md#hono), [middleware](../glossary.md#middleware), [route](../glossary.md#route)
