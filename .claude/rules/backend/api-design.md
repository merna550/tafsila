---
paths:
  - "packages/api/src/routes/**"
---

# API routes

- A route validates input with a Zod schema from `packages/schemas`, calls one service, and maps the result; it holds no business logic.
- Request and response schemas carry `.openapi({ example })` so OpenAPI and Postman stay complete.
- Errors are thrown as catalogue errors (`backend/errors.md`) and leave the API as `{ code, message_ar, message_en, details?, request_id }`.
- A route that reads user data checks ownership; another user's resource returns 404.
- After any route change, run `pnpm api:openapi && pnpm api:postman && pnpm api:test`.

```ts
// WRONG: untyped body, logic in the route
app.post("/clients", async (c) => c.json(await db.insert(await c.req.json())));

// RIGHT: schema in, use case, schema out
app.post("/clients", zValidator("json", createClientInput), async (c) =>
  c.json(await createClient(container, c.get("user"), c.req.valid("json")), 201),
);
```
