---
paths:
  - "packages/api/src/routes/**"
---

# API routes

- A route validates input with a Zod schema from `packages/schemas`, calls one service, and maps the result; it holds no business logic.
- Routes are declared with `createRoute` + `.openapi(...)` from `@hono/zod-openapi`; request and response schemas carry `.meta({ example })` (Zod 4) so OpenAPI and Postman stay complete. Document errors with `errorResponses(...)`; never build an error body by hand.
- Errors are thrown as catalogue errors (`backend/errors.md`) and leave the API as `{ code, message_ar, message_en, details?, request_id }`.
- A route that reads user data checks ownership; another user's resource returns 404.
- After any route change, run `pnpm api:openapi && pnpm api:postman && pnpm api:test` (`pnpm api:check` is part of `pnpm quality`).

```ts
// WRONG: untyped body, logic in the route
app.post("/clients", async (c) => c.json(await db.insert(await c.req.json())));

// RIGHT: schema in, use case, schema out
app.post("/clients", zValidator("json", createClientInput), async (c) =>
  c.json(await createClient(container, c.get("user"), c.req.valid("json")), 201),
);
```
