---
paths:
  - "apps/web/**"
---

# RTL and i18n

- Every user-facing string is a key in both `messages/ar.json` and `messages/en.json`.
- Layout uses logical properties only (`ms-*`, `me-*`, `ps-*`, `pe-*`, `start`, `end`); `left`, `right`, `ml-*` and `mr-*` are not used.
- Directional icons (arrows, chevrons) flip in RTL.
- Numbers use Western digits unless the user setting asks for Arabic-Indic (NFR-06).
- Every new screen is checked in both `ar` (RTL) and `en` (LTR) and at mobile width.
