## Plan #319: Fabric recommendations with reasons and an avoid list

plan:sonnet · build:sonnet · size S (unchanged) · M5 wave 4 · FR-REC-02, NFR-06 · Screen: `docs/design/screens/FabricRecommend.dc.html` (+ `images/FabricRecommend.{desktop,mobile}.png`) · API from #317 (`GET /api/fabrics/recommend?versionId=`)

### Approach

Use the `add-page` skill. A new feature `apps/web/src/features/fabric/` with the recommendations panel, shown on the saved-version view, matching the screen. (#318 later adds the calculator into the same feature; this issue creates the feature folder and its `index.ts`.)

- **Data:** `hooks/use-fabric-recommendations.ts` (TanStack Query, key `["fabric-recommend", versionId]`, `staleTime` a few minutes) over `shared/api` (`apiRequest`) with the response type from `@tafsila/schemas` (`fabric-calc.ts`/`fabric.ts` from #317). Errors go through `ApiError`; the panel shows `DataState` loading, empty and error states.
- **Components** (`components/`): `FabricRecommendations.tsx` (container: tabs/sections as in the screen), `FabricCard.tsx` (localized name, property tags, the one-line reason, a "draft" note while `isDraft`), `AvoidList.tsx`, `PropertyTags.tsx` (drape/weight/body/sheen as small tags from a typed map to message keys). Built from `packages/ui` (cards, tags, `DataState`), logical CSS only, tokens only.
- **Mounting:** the panel is a section of `app/[locale]/(dashboard)/designs/[id]/versions/[versionId]/page.tsx` through the feature's `index.ts` (`FabricRecommendations({ versionId })`); the page stays thin. For an unsaved pattern (no version) nothing is shown (ADR-281 item 1).
- **Locale:** names and reasons come as `{ ar, en }` pairs from the API; the component picks by locale (a small helper in `model/` with a test). Numbers use Western digits.
- **Messages:** `messages/{ar,en}.json` under `fabric.recommend.*` (title, subtitle, avoid title, empty state, error, property labels and levels, draft note). Merna reviews the Arabic.

### Files

Create: `apps/web/src/features/fabric/{index.ts, components/*, hooks/use-fabric-recommendations.ts, hooks/query-keys.ts, model/localized.ts, model/property-labels.ts}` with tests; `apps/web/e2e/fabric-recommend.spec.ts`; `docs/test-cases/ui/319-fabric-recommend.md`; `docs/decisions/319-fabric-recommend-ui.md`; screenshots under `docs/test-cases/ui/screenshots/319/` (ar/en, 390/1280).
Change: the version page; `messages/ar.json`/`en.json`; `docs/frontend/README.md` (fabric feature paragraph); `docs/CONTEXT_MAP.md` row; glossary; learning log.

### Test plan

- **Component (Vitest + Testing Library):** shows 3 to 5 cards with the reason and property tags for a mocked response; the avoid list with reasons; Arabic vs English names by locale; loading skeleton; empty state when the list is empty; error state with retry; the draft note appears only while `isDraft`.
- **Model unit:** `pickLocalized` and the property-to-label map cover every property value 0 to 4 in both languages (ar/en parity test already enforces messages parity).
- **E2E (ar-desktop full, en smoke, one mobile):** sign up, create and save a version of the seeded dress (reuse the helpers from `pattern-versions` e2e), open the version view, see recommendations and the avoid list; repeat for a skirt and a blouse version (acceptance criterion).
- **Screenshots:** taken from a production build as for #25, committed under `docs/test-cases/ui/screenshots/319/`.
- Manual test cases (draft): TC-UI-319-01 dress; 02 skirt; 03 blouse; 04 English LTR; 05 mobile RTL; 06 server error state; 07 draft note.

### Decisions to log (`docs/decisions/319-fabric-recommend-ui.md`)

1. Panel lives on the saved-version view only; no route of its own.
2. Fetch on mount with a 5-minute `staleTime`; no polling.
3. Property tags show the level word (low/medium/high), not the number.

None is costly to reverse.

### Risks

- **Version page shared with other features:** the panel is one import; merge main before the PR (messages namespaced `fabric.*`).
- **Draft content shown to users:** the "draft" note makes that visible until Merna's review flips the flag.

### Labels and needs

Size S, `plan:sonnet`, `build:sonnet` stay. `node scripts/needs-interactive.mjs` on the files above: `no`.

## Deviations

- The recommend response gained `fabric: { id, nameAr, nameEn, properties }` on every recommended and avoided item (schemas `fabric-calc.ts`, `get-fabric-recommendations.ts`, OpenAPI, Postman), because #317 returned only ids and the panel needs names and properties. Logged as ADR-319 item 1.
- Property tags became a five-step meter with the level word for screen readers (as in the screen design) instead of visible level words.
- The e2e checks 3 to 5 cards, one "Best fit" mark and the draft note for dress, skirt and blouse; it does not assert the avoid list, because the default designs have none. The avoid list is covered by component tests.
- `hooks/query-keys.ts` key is `["fabric-recommend", versionId]`; components `PropertyMeter` and `FabricRecommendationsView` were added, `PropertyTags` became `PropertyMeter`.
