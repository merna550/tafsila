---
packages: [next]
level: beginner
adr: ADR-005
---

# Next.js

**In one line:** The React framework that serves our pages, hosts the API at `/api` and builds the Docker image.

## What it is (plain words)

Next.js is a framework on top of [React](react.md). It decides how pages are routed (by folders), renders them on the server so the first load is fast, and can also host backend routes. The App Router is its current routing system: every folder under `app/` is a URL.

## Why we chose it

- **Fast first load and SEO for Arabic landing pages.** Server rendering sends ready HTML, which matters for users on mobile data in Egypt and for search engines finding the marketing pages.
- **Server Components keep data loading on the server.** Pages fetch data without shipping that code to the phone; only interactive tools (viewer, projector, forms) are Client Components ([ARCHITECTURE section 1](../../ARCHITECTURE.md)).
- **One deploy for UI and API.** Route handlers host the [Hono](hono.md) API under `/api` in the same deployment ([ADR-005](../../DECISIONS.md)); a solo founder runs one thing, not two.
- **Routing that works with i18n and RTL.** Arabic is the default language, English the second; [next-intl](next-intl.md) plugs into the routing.
- **First-class on [Vercel](vercel.md):** a preview deployment per pull request that Merna reviews.
- **Exit path.** `output: "standalone"` produces a small self-contained server, which our Dockerfile packages ([ADR-004](../../DECISIONS.md), [docker](docker.md)).
- **The most widely known React framework,** so agents and any future hire already know it.

## Alternatives we considered (and why not)

- **Vite single page app plus a separate API:** no server rendering or SEO for Arabic marketing pages, and two deployments to run.
- **Remix / React Router 7:** good, but a smaller ecosystem and less Vercel integration.
- **Astro:** excellent for content sites, not for app-heavy tools like a pattern editor.
- **Nuxt / SvelteKit:** smaller hiring pool in Egypt and fewer compatible libraries; the engine and UI kit are React.

## When we would change it

If Next.js releases keep breaking our setup faster than we can follow, or hosting costs force a leaner stack, we can move the UI to Vite or React Router and keep `packages/api` unchanged, because the API is a separate Hono app.

## Where it lives in our code

- `apps/web/src/app/` (pages and layout), `apps/web/src/app/[locale]/layout.tsx`, `apps/web/src/app/[locale]/page.tsx`, `apps/web/src/proxy.ts` (locale routing).
- `apps/web/src/app/api/[[...route]]/route.ts` (forwards `/api/*` to Hono).
- `apps/web/next.config.ts` (standalone output, internal packages compiled from source).

## The 20% you need

- A folder with `page.tsx` is a route; `layout.tsx` wraps its children.
- Components are Server Components by default; add `"use client"` only for interactivity.
- Our catch-all route file is the whole backend bridge:

```ts
// apps/web/src/app/api/[[...route]]/route.ts
const app = createApp();
const handler = (request: Request): Response | Promise<Response> => app.fetch(request);
export { handler as DELETE, handler as GET, handler as PATCH, handler as POST, handler as PUT };
```

## Commands you'll use

```bash
pnpm dev            # dev server on http://localhost:3000
pnpm build          # next build (standalone output)
pnpm docker:build   # the same app as a container image
```

## Common mistakes

- Adding `"use client"` to a whole page when only one button needs it.
- Putting business logic in route handlers instead of `packages/api/src/services/`.
- Reading `process.env` in components instead of `packages/config`.

## Learn more

- [Next.js docs](https://nextjs.org/docs) (official), start with the App Router tutorial
- Glossary: [Next.js](../glossary.md#nextjs), [App Router](../glossary.md#app-router), [Server Component](../glossary.md#server-component), [route handler](../glossary.md#route-handler)
