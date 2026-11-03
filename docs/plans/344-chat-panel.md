## Plan #344: Chat panel on the pattern page

plan:sonnet · build:sonnet · size M (unchanged) · M6 wave 3 · FR-CHAT-01, FR-CHAT-03, FR-CHAT-04, FR-CHAT-06, NFR-06 · Screen: `docs/design/screens/ChatPanel.dc.html` (+ `images/ChatPanel.{desktop,mobile}.png`) · merged: chat API (#343: `POST/GET /api/designs/:id/chat`, `POST …/chat/:msgId/apply`, schemas in `packages/schemas/src/chat.ts`, error codes `CHAT_QUOTA_EXCEEDED`, `CHAT_DAILY_LIMIT`, `CHAT_PROPOSAL_STALE`, `CHAT_NOTHING_TO_APPLY`, `AI_CHAT_FAILED`), the pattern page (`features/pattern-page`: `PatternPageScreen`, `PatternSidePanel` with tabs, `usePatternPage`, save-version state), versions (`features/pattern-versions`)

### Approach

Use the `add-page` skill. A new feature `apps/web/src/features/chat-edit/` mounted as a tab of the pattern page's side panel (the screen shows the panel beside the viewer on desktop and below on mobile).

- **Data (hooks):** `use-chat-history(designId)` (GET, key `["chat", designId]`), `use-send-chat-message(designId)` (POST, optimistic user bubble, invalidates the history), `use-apply-chat-edit(designId)` (POST apply; on success invalidates `["chat", designId]`, the design and version queries (`["designs", id]`, `["versions", designId]` — use the keys exported by `design-picker`/`pattern-versions` through their `index.ts`) and tells the pattern page to reload the current version). Errors go through `ApiError`: `CHAT_QUOTA_EXCEEDED` and `CHAT_DAILY_LIMIT` disable the box with the reason; `CHAT_PROPOSAL_STALE` shows "the pattern changed since this proposal, ask again" with an "ask again" button that re-sends the same text; others as a toast (ADR-30).
- **Panel (components):** `ChatPanel` (header with "messages left: N", the history list, the composer), `MessageBubble` (user/assistant), `ProposalCard` (the bilingual change lines from the API, "Apply" and "Cancel"; applied proposals show "Applied: version n+1" with a link), `UnsupportedCard` (the polite text and the suggested closest option as a one-click proposal that sends it as a new message), `ChatComposer` (textarea, 500-character counter, send on Enter/Ctrl+Enter, disabled with a reason). Built from `packages/ui`; logical CSS only; the list is an `aria-live="polite"` region.
- **Gating:** the panel needs a saved version (`currentVersionId`); before that the tab shows "Save a version first" (the API needs `versionId`). The request carries the **current version id** from `usePatternPage`. When the quota is used up the composer is disabled and shows the used/limit text.
- **After apply:** the pattern page re-reads the design and shows version n+1 (the viewer regenerates from the new inputs); `PatternPageScreen` listens through a small callback prop `onChatApplied` exported by `chat-edit` (no cross-feature import except through `index.ts`).
- **Locale:** the request sends the UI language only for the change lines the API builds (`Accept-Language`/locale param as #343 defines; if the API returns both languages, the panel picks one — check `packages/schemas/src/chat.ts` and use whichever exists, without changing the API).
- **Messages:** `chatEdit.*` ar/en (tab title, composer placeholder/examples, counters, buttons, states, error texts per code). Merna reviews the Arabic.

### Files

Create: `apps/web/src/features/chat-edit/{index.ts, ChatPanel.tsx, components/*, hooks/*, model/{chat-view.ts, compose-rules.ts, apply-state.ts}}` (+ tests), `apps/web/e2e/chat-edit.spec.ts`, `docs/test-cases/ui/344-chat-edit.md`, `docs/decisions/344-chat-panel.md`, screenshots under `docs/test-cases/ui/screenshots/344/`.
Change: `features/pattern-page/components/PatternSidePanel.tsx` (new "Chat" tab through `chat-edit`'s `index.ts`) and `PatternPageScreen`/`usePatternPage` (pass the version id and `onChatApplied`), `messages/{ar,en}.json`, `docs/frontend/README.md`, `docs/CONTEXT_MAP.md`, glossary, learning log.

### Test plan

- **Model unit:** `chat-view` maps API messages to bubbles/cards (proposal pending, applied, unsupported with suggestion); `compose-rules` (empty/whitespace blocked, 500 limit, quota exhausted, no saved version); `apply-state` (idle, applying, applied with version number, stale, error).
- **Component:** user and assistant bubbles; a proposal card shows the change lines and Apply/Cancel; applied state link; unsupported card with the suggestion button sending a message; quota exhausted disables the composer with the reason; stale proposal shows "ask again"; Enter sends and Shift+Enter adds a new line; live region present.
- **E2E (ar-desktop full; en smoke) with the fake provider:** sign up, create a dress with the picker, save version 1, open the Chat tab, send "add side pockets" (the fake answers a pockets patch), see the proposal, apply, see "version 2" and the pattern updated; send "make it a jumpsuit" and see the polite unsupported answer with a suggestion; send messages until "messages left: 0" disables the box (set `CHAT_MESSAGES_PER_DESIGN` low through the e2e env or use 10 quick sends against the API helper).
- **Screenshots:** the panel (empty, proposal, applied, unsupported, quota used), ar/en, mobile and desktop.

Manual test cases (draft): TC-UI-344-01 supported edit; 02 unsupported with suggestion; 03 cancel a proposal; 04 apply creates version n+1 and history lists it as made by chat; 05 quota used up; 06 stale proposal; 07 no saved version; 08 Arabic and English messages; 09 mobile RTL; 10 (after #347) real provider on staging.

### Decisions to log (`docs/decisions/344-chat-panel.md`)

1. The chat is a tab of the pattern page's side panel, not a route.
2. Apply is explicit (a card button); nothing changes the pattern without it (FR-CHAT-03).
3. The suggested closest option is sent as a normal new message (it counts against the quota, as the API counts every user message).
4. A stale proposal is re-asked, never silently re-applied.

None is costly to reverse.

### Risks

- **Pattern page is shared** with several features: only the side-panel tab and two props change; merge main first and keep the existing pattern-page tests green.
- **Query-key coupling** to design/version hooks: use the keys exported by those features, never string literals copied.
- **Quota e2e** may be slow: the API helper sends the messages, not the UI.

### Labels and needs

Size M, `plan:sonnet`, `build:sonnet` stay. `needs-interactive` on the planned files: run below.

### Deviations

- The e2e runs three messages per design instead of ten: `playwright.config.ts` sets `CHAT_MESSAGES_PER_DESIGN=3` (the API rate limit of 5 per minute rules out ten UI sends). The quota is ended by the third message, the one-click suggestion.
- The history stores no version number for an applied proposal, so a proposal applied in an earlier session says "Saved as a new version" without the number; the number shows right after applying.
- A dismissed proposal is remembered only until the page reloads (no API for it).
- A proposal made on another version than the page shows is marked stale before any call (the base version id is in the history); the 409 is also handled.
- No "invalid proposal" card: the API turns an invalid patch into an unsupported answer.
