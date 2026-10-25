# Plan: #250 Designs list and new-pattern entry points

Plan wave M3 (planned with #244 and #246; shared names fixed there). Screens (#236) are not in the repo yet: the build must match `docs/design/screens/` once #236 lands.

### Approach

- **Boundaries** (no feature cycle; `features/*` may import another feature only through its `index.ts`, and `clients` must not import `designs`):
  - `apps/web/src/entities/design/` (shared domain pieces): `design-keys.ts` (shared with #244: `designKeys = { all: ["designs"], list(params), detail(id) }`; create it if #244 has not landed), `use-designs.ts`, `use-client-designs.ts`, `use-delete-design.ts`, `NewPatternLink.tsx`, `design-row.ts` (view model), `index.ts`. `NewPatternLink` is a `Link` styled as a `Button` to `/designs/new?clientId=<id>` (no `clientId` -> `/designs/new`).
  - `apps/web/src/features/designs/` (the `/designs` screen): `DesignsScreen.tsx`, `components/`, `model/`.
  - `features/clients` imports only from `entities/design` (New pattern link, the designs list of a client). `features/designs` may import `clients` through its index (`ClientSelect`, below).
  - Check `.dependency-cruiser.cjs`: if `entities/` has no rule, add "entities import only shared and packages".
- **`/designs`** (`app/[locale]/(dashboard)/designs/page.tsx` -> `<DesignsScreen />`): mirrors `ClientsScreen` (heading with count, primary "New pattern" button to `/designs/new`, debounced title search with `useDebouncedValue`, `DataState` with empty state and next action, list with "load more"). Hook `useDesigns({ q, clientId })` = `useInfiniteQuery` over `GET /api/designs?q&clientId&limit&offset` (#242, page size constant `DESIGNS_PAGE_SIZE = 20`, schema `designPageSchema`). `clientId` filter lives in the URL search params (rule: filters in URL), shown by `ClientSelect` (a select over `useClients`, exported from `features/clients/index.ts`; reuse the one #247 adds if it exists, else add it there). Row: title, category label, client name, version count, status badge (`pass`, `warn`, or "no version yet" for a design without a version), relative time from `shared/format` (`format-relative-time`). Row link -> `/designs/<id>`.
- **Delete**: `DeleteDesignDialog` (confirm, same pattern as `DeleteClientDialog` and `use-delete-client-action`), `DELETE /api/designs/:id`, invalidates `designKeys.all`, toast through `useApiErrorHandler`.
- **Entry points**: (1) nav item `designs` -> `/designs` in `NAV_ITEMS` of `shared/layout/AppNav.tsx` (key union gets `"designs"`, `nav.designs` = "تصاميمي" / "My designs" per `docs/design/copy.md`), (2) `ClientRow` (clients page) gets a "New pattern" `NewPatternLink` with the client's id, (3) `ClientProfileScreen` gets the same link in the card actions plus `ClientDesignsSection` (up to 5 designs of that client via `useClientDesigns` = `GET /api/designs?clientId=&limit=5`, with "see all" -> `/designs?clientId=`). Components stay prop-driven; hooks are called in the two screen files only.

### Files

Create: `entities/design/{index,design-keys,use-designs,use-client-designs,use-delete-design}.ts`, `entities/design/{NewPatternLink.tsx,design-row.ts}` (+ tests), `features/designs/{index.ts,DesignsScreen.tsx}`, `features/designs/components/{DesignsList,DesignRow,DesignsHeading,DeleteDesignDialog,DesignStatusBadge}.tsx`, `features/clients/components/ClientDesignsSection.tsx`, route `app/[locale]/(dashboard)/designs/page.tsx`, `apps/web/e2e/designs-list.spec.ts`, `docs/test-cases/ui/250-designs-list.md`.
Change: `shared/layout/AppNav.tsx`, `features/clients/components/{ClientRow,ClientProfileCard}.tsx`, `features/clients/{ClientProfileScreen,ClientsScreen}.tsx`, `features/clients/index.ts` (`ClientSelect` if missing), `messages/{ar,en}.json` (`nav.designs`, `designs.*`, `clients.newPattern`, `clients.profile.designs.*`), `docs/SRS.md`, `.dependency-cruiser.cjs` (only if needed).

### Data / API

Reads `GET /api/designs` (`q`, `clientId`, `limit`, `offset`; item with `summary { versionCount, currentStatus, clientName }`) and `DELETE /api/designs/:id` from #242. Schema names assumed from #242 (`designListItemSchema`, `designPageSchema`); use the merged names. No new endpoint.

### Tests

- Component: list renders rows with status badge and "no version yet"; empty state with "New pattern" action; search sends `q` (debounced) and shows "no results" with clear; delete opens confirmation, cancel keeps, confirm calls delete and the row goes; `ClientSelect` change sets `?clientId=`.
- `NewPatternLink` carries the id: `/designs/new?clientId=abc`; without id no query.
- Client profile shows its designs and the link; clients page rows each have the link (assert hrefs).
- Nav: `designs` item active on `/designs` and `/designs/<id>` (`isActive`).
- e2e (ar and en, 360 px): open a seed client -> "New pattern" lands on `/designs/new?clientId=<id>`; `/designs` lists the seed designs; delete one.
- Manual: TC-DESIGN-250-01 list and paging; -02 empty state; -03 search and client filter; -04 delete with confirmation; -05 New pattern from clients page and profile; -06 RTL, 360 px.

### Decisions (build writes `docs/decisions/250-designs-list.md`)

1. Design hooks and `NewPatternLink` live in `entities/design/` so `clients` and `designs` never import each other.
2. The client filter is a URL param `clientId`; title search is local debounced state (same as the clients screen).
3. The profile shows the latest 5 designs of a client with a link to the filtered list.
4. The nav item is "My designs" (glossary: تصاميمي).

### Risks

- #242 response names and the `summary` field are assumed; adapt to the merged schema.
- `ClientRow` change touches the M1 clients tests; update them in the same PR.
- Designs created by the category step but never saved appear as "no version yet"; delete covers cleanup.

**Size:** S (unchanged, near the top of S because of the nav and clients changes). **Build:** `build:sonnet` (unchanged). `needs-interactive`: no.

## Deviations

- Hooks of the design entity live in `entities/design/hooks/` (the `query-only-in-hooks` dependency rule needs a `/hooks/` folder); there is no separate `use-client-designs`: the profile calls `useDesigns({ clientId, limit: 5 })`.
- `DesignRow` view model lives in `entities/design/design-row.ts` and is shared by the list and the profile section.
- No `ClientSelect` component: `DesignsFilters` builds the select from `useClients` (exported by the clients index) so no feature imports another feature's component.
- `OptionIllustration` is exported from the design-picker index to draw the garment on each card (as in the approved screen).
- The route reads `clientId` from `searchParams` on the server (as the new-design route does) instead of `useSearchParams`.
- Visual baselines are not added (no Docker; tracked in #265).
