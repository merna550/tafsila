---
paths:
  - "packages/api/src/**"
---

# Backend layers

`route -> use case (services/) -> domain -> port -> adapter`. Dependencies point inward; `pnpm depcruise` fails when `services/` imports `adapters/` or a vendor SDK.

- **Route** (`routes/`): parse input with a Zod schema from `packages/schemas`, call one use case, map the result. No business logic, no queries.
- **Use case** (`services/<action>.ts`): one use case per file, named as an action (`create-pattern-version.ts`). It checks authorization, runs the rules, and calls ports.
- **Domain** (`domain/`): entities, rules, error classes. No I/O.
- **Port** (`ports/`): the interface a use case needs. **Adapter** (`adapters/<vendor>/`): the implementation; no business rules. Wired only in `container.ts`.
- Input and output of every use case are typed by `packages/schemas`; types are never redeclared.
- Authorization lives in the use case, not the route and not the adapter. Another user's resource answers `NOT_FOUND`.
- One transaction per use case that writes more than one row (credits + version). Retried writes are idempotent (key from the request or the provider event id).
- Time and ids come from the `Clock` and `IdGenerator` ports.

```ts
// WRONG: business logic and SQL in a route
app.post("/designs", async (c) => {
  const { data } = await supabase.from("designs").insert(await c.req.json());
  if (user.credits < 1) return c.json({ error: "no credits" }, 400);
  return c.json(data);
});

// RIGHT
app.post("/designs", zValidator("json", createDesignInput), async (c) => {
  const design = await createDesign(container, c.get("user"), c.req.valid("json"));
  return c.json(design, 201);
});
// services/create-design.ts: checks credits (throws AppError("INSUFFICIENT_CREDITS")), calls designRepository.create
```
