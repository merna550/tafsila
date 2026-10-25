# ADR-250 · 2026-10-25 · Designs list and entry points

**Context:** Issue #250 (FR-DES-08). The designs list, the profile's designs and the "New pattern" links share data and a link, and `clients` and `designs` features must not import each other's internals.
**Decision:**

1. Design hooks (`useDesigns`, `useDeleteDesign`), the row view model and `NewPatternLink` live in `apps/web/src/entities/design/` with the existing `designKeys`; both features import them from its `index.ts`.
2. The client filter is the URL parameter `clientId` (read on the server by the route); the title search is local debounced state, as on the clients screen.
3. A client's profile shows her latest 5 designs and a link to the list filtered by her.
4. The nav item is "My designs" (تصاميمي). A design without a saved version shows "No version" and "No pattern".
5. Delete asks for confirmation and removes the design with its versions (`DELETE /api/designs/:id`).

**Consequences:** No new endpoint. A design created by the category step but never saved stays in the list until deleted.
