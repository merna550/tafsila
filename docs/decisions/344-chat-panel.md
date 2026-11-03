# ADR-344 · 2026-11-03 · Chat panel on the pattern page

**Context:** Issue #344 (M6) is the UI of the chat edit API (#343): write a request, review a proposal, apply it as a new version (FR-CHAT-01, FR-CHAT-03, FR-CHAT-04, FR-CHAT-06).

**Decision:**

1. The chat is a tab ("Assistant") of the pattern page's side panel, not a route. It needs a saved version (the API ties a proposal to a version id); before that the tab says "Save a version first".
2. Apply is explicit, a button on the proposal card; nothing changes the pattern without it (FR-CHAT-03). "Dismiss" only hides the card in this browser session.
3. The suggested closest option of an unsupported answer is sent as a normal new message (it counts against the quota, as the API counts every user message).
4. A stale proposal (the page shows another version than the proposal's base, or the API answers `CHAT_PROPOSAL_STALE`) is re-asked with the same text, never silently re-applied.
5. After an apply the pattern page takes the new version through `onChatApplied` (the editor and page stores, as a restore does); the chat feature never imports pattern-page stores.
6. Quota (`CHAT_QUOTA_EXCEEDED`) and daily-limit (`CHAT_DAILY_LIMIT`) answers switch the box off with the reason instead of a toast.

**Reason:** None is costly to reverse. A tab keeps the pattern in view next to the conversation; explicit apply keeps the AI as a suggester (ADR-002).

**Alternatives:** a separate `/chat` route (the pattern would be out of sight); auto-apply valid proposals (breaks FR-CHAT-03).
