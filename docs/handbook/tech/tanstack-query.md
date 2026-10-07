---
packages: ["@tanstack/react-query"]
level: intermediate
adr: ADR-011
---

# TanStack Query

**In one line:** Fetches, caches and refreshes server data in the browser, so components do not hand-write loading and retry code. Planned for M1.

## What it is (plain words)

A small library with two ideas: a `query` reads data (and remembers it), a `mutation` changes data (and tells the cache what is stale). It tracks loading, error and refetch states for you.

## Why we chose it

- **Caching and refetching without hand-written effects.** Client lists, measurements and pattern versions are read often and edited occasionally; the cache avoids repeated requests on slow mobile connections.
- **It enforces our rule that components never call `fetch`.** Each feature has hooks such as `useMeasurements` that wrap queries ([CODING_STANDARDS section 2](../../CODING_STANDARDS.md)).
- **Works with the typed Hono client** ([hono](hono.md)): query functions call the typed API and keep types end to end.

## Alternatives we considered (and why not)

- **Redux:** too much ceremony for server data.
- **`fetch` inside components:** forbidden by our rules (hard to test, duplicates loading logic).
- **Server Actions only:** good for forms, but not for cached, interactive screens.

## When we would change it

If most reads move to Server Components and few client queries remain, we may drop it. Cheap to remove because only `hooks/` folders use it.

## Where it lives in our code

Not installed yet. Planned: `apps/web/src/features/<feature>/hooks/` per the feature layout in [CODING_STANDARDS section 2](../../CODING_STANDARDS.md); one provider in `apps/web/src/app/`.

## The 20% you need

- `useQuery({ queryKey, queryFn })` reads; `useMutation` writes then invalidates the key.
- Keys are arrays like `["clients", clientId, "measurements"]`; invalidating a prefix refreshes everything under it.
- See the glossary entry [query client](../glossary.md#query-client).

## Commands you'll use

None of its own. Tests mock the API port or the typed client.

## Common mistakes

- Putting server data in [Zustand](zustand.md) instead of the query cache.
- Using unstable object keys that change every render.

## Learn more

- [TanStack Query docs](https://tanstack.com/query/latest/docs/framework/react/overview) (official)
