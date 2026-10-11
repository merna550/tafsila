---
paths:
  - "apps/web/**"
  - "packages/ui/**"
---

# RTL and i18n

- Every user-facing string is a key in both `messages/ar.json` and `messages/en.json`; JSX never holds literal text or `aria-label`/`placeholder`/`title`/`alt` text (ESLint fails on it).
- Layout uses logical properties only: `ms-*`, `me-*`, `ps-*`, `pe-*`, `start-*`, `end-*`, `text-start`, `text-end`. `ml-*`, `mr-*`, `left-*`, `right-*`, `text-left`, `rounded-l-*` are rejected by ESLint.
- Directional icons (arrows, chevrons) flip in RTL (`rtl:-scale-x-100`).
- Numbers use Western digits unless the user setting asks for Arabic-Indic (NFR-06).
- Every new screen is checked in both `ar` (RTL) and `en` (LTR) and at mobile width; Storybook shows each component in both.

```tsx
// WRONG
<div className="ml-4 text-left"><h2>الاسم</h2></div>

// RIGHT
<div className="ms-4 text-start"><h2>{t("client.name")}</h2></div>
```
