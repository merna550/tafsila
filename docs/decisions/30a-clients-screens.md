# ADR-30a · 2026-10-12 · Clients list and profile screens

**Context:** Issue #30 builds `/clients` and `/clients/[id]` (FR-MEAS-04), the first real feature on the web app.

**Decision:**

1. `Client` gains a `summary` `{ measurementSetCount, latestSizeLabel, lastMeasurementAt }` on every client response, computed in the repository with correlated subqueries in the same select (one query per page, no N+1). Additive.
2. Meta line is `size · relative time`, `custom measurements · relative time` or `no measurements yet`. The design's "with two overrides" needs data not stored yet (#31 may extend it).
3. Create and edit share one dialog; delete is a confirmation dialog. Only `ClientFormDialog` moves if a page is preferred.
4. Relative time and month names use `Intl` with Gregorian calendar and Western digits; the clock is a parameter.
5. TanStack Query is added to `apps/web` (it was only documented): keys `["clients", {q, limit}]`, `["clients", id]`, `["measurement-sets", {clientId}]`; 30 s stale time; mutations invalidate `["clients"]`; a delete refetches only inactive queries so the open profile does not flash "not found".
6. `/clients` is protected in `access-guard.ts`. The dashboard layout keeps its fixed `next=/dashboard` fallback: a Server Component layout cannot read the requested path, and the proxy (the primary guard) already keeps the full path.
7. Measurement links point at routes owned by #31 and show the not-found page until it merges.
8. Search text is component state (debounced 300 ms), not a URL parameter; moving it to `?q=` is cheap later.
9. The form schema has its own message keys (`clients.form.errors`) with the same limits as the API schema, because the API schema's messages are English.
10. Component tests render static markup like the rest of the repo (no jsdom or Testing Library is installed); interaction is covered by the Playwright flow.
11. Not built: the "3 free patterns" chip (M7), the "my designs" link, the greeting line (no profile name yet), the `Breadcrumb` Storybook story (snapshots must be generated on Linux with Docker).

**Reason:** Matches the approved plan and the designs with the least new surface.

**Alternatives:** one measurements call per row (N+1 on every keystroke); name only in rows; a separate create page.
