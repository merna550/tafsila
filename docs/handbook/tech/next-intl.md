---
packages: [next-intl]
level: intermediate
adr: ADR-011
---

# next-intl

**In one line:** Translations and locale-aware routing for Arabic (default, right-to-left) and English. Planned for M1.

## What it is (plain words)

next-intl loads message files (`ar.json`, `en.json`), picks the language from the URL, and provides helpers to format text, numbers, dates and plurals correctly per language.

## Why we chose it

- **Arabic first.** The product is for Egyptian users; every user-facing string comes from `apps/web/messages/{ar,en}.json`, never hard-coded ([.claude/rules/frontend/rtl-i18n.md](../../../.claude/rules/frontend/rtl-i18n.md)).
- **Built for the Next.js App Router,** including Server Components, so translations do not bloat the browser bundle.
- **Correct formatting and plurals.** Arabic has six plural forms and its own digits; the library uses standard ICU message syntax ([glossary: i18n](../glossary.md#i18n)).

## Alternatives we considered (and why not)

- **react-i18next:** popular, but needs more wiring with Server Components.
- **Hand-rolled dictionary:** misses plurals and formatting rules.

## When we would change it

If we add many languages with a translation service, the message format may need a different workflow; the files are standard JSON so migration is small.

## Where it lives in our code

Not installed yet. Planned: apps/web/messages/ar.json, apps/web/messages/en.json, routing under `apps/web/src/app/`. Today the one page in `apps/web/src/app/page.tsx` is not yet translated.

## The 20% you need

- `const t = useTranslations("measurements"); t("bust")` returns the Arabic or English string.
- Layout direction follows the locale: `<html lang="ar" dir="rtl">`, with [logical Tailwind classes](tailwind.md).

## Commands you'll use

None; a missing key fails the planned i18n test.

## Common mistakes

- Concatenating translated pieces into a sentence (word order differs in Arabic); use one message with placeholders.
- Adding a key to `en.json` and forgetting `ar.json`.

## Learn more

- [next-intl docs](https://next-intl.dev/docs/getting-started) (official)
- Glossary: [next-intl](../glossary.md#next-intl), [RTL](../glossary.md#rtl)
