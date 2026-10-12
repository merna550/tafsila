# M1 screen designs

Approved reference designs for the M1 screens. **Every UI issue that builds one of these screens must match its file here.**

Source of truth: Merna's design canvas "Tafsila — M1 screens" on claude.ai (private). These files are a copy of it. When the canvas changes, the copy here is updated in the same PR as any code that depends on it.

## Images

`images/` has a rendered picture of every screen, with the sample data filled in, in two sizes:

- `<Screen>.desktop.png` (1280 px wide)
- `<Screen>.mobile.png` (390 px wide)

Look at the image first to understand the screen, then read the `.dc.html` file for exact values. If they ever disagree, the `.dc.html` file wins. Compare your built screen against both images before opening the PR.

## How to read a design file

Each `*.dc.html` file is plain HTML with inline styles, drawn in **Arabic (RTL)**, at desktop width, fluid down to phone width.

- **Layout, spacing, sizes, states:** read them from the markup. Colours and type sizes map 1:1 to the tokens in `docs/design-system/tokens.json` / `packages/ui/src/tokens.css` (for example `#0E6B65` = `primary`, `15px/22px 600` = `label`). Never copy a raw hex or pixel value into code; use the token or the `packages/ui` component.
- **Lists:** `<sc-for list="{{rows}}" as="r">` repeats its child for each item; the sample data is in the `renderVals()` function at the bottom of the file. It is **sample data only**, never seed or fixture data.
- **Text:** the Arabic strings are the approved copy. Put them in `apps/web/messages/ar.json`, never inline in JSX. English goes in `en.json` (see `docs/design/copy.md`).
- `support.js` and the `<x-dc>` / `<helmet>` wrappers belong to the canvas tool; ignore them.
- Links between files (`href="Clients.dc.html"`) show the navigation flow, not real routes. Routes are in the table below.

## Screens

| File                    | Screen                    | Route (under `/[locale]`)        | Issue | States shown                                                     |
| ----------------------- | ------------------------- | -------------------------------- | ----- | ---------------------------------------------------------------- |
| `Main.dc.html`          | Sign in / sign up         | `/sign-in`                       | #25   | sign-in tab, filled form                                         |
| `Verify.dc.html`        | Phone verification (OTP)  | `/verify`                        | #26   | code half-entered, resend countdown (built, PR #116)             |
| `Clients.dc.html`       | Clients list              | `/clients`                       | #30   | list with 5 clients, search                                      |
| `ClientsEmpty.dc.html`  | Clients list, first visit | `/clients`                       | #30   | empty state (the "3 free patterns" chip is not built until M7)   |
| `ClientProfile.dc.html` | Client profile            | `/clients/[id]`                  | #30   | notes, 2 measurement sets                                        |
| `Measurements.dc.html`  | New measurement set       | `/clients/[id]/measurements/new` | #31   | base size M, one override, one warning, one error, save disabled |
| `Guide.dc.html`         | How to measure (dialog)   | opens over the measurement form  | #31   | bust guide                                                       |
| `Settings.dc.html`      | Settings                  | `/settings`                      | #27   | account, display, delete account                                 |
| `AdminUsers.dc.html`    | Admin: users              | `/admin/users`                   | #32   | stats, filter, table                                             |
| `AdminSizes.dc.html`    | Admin: size chart         | `/admin/sizes`                   | #32   | 2 edited cells, 1 invalid cell                                   |

Routes are proposals; if an issue already fixed a different route, keep the issue's route and update this table.

States not drawn (loading, server error, no results for a search) follow the shared patterns: skeletons from `packages/ui`, errors through the shared error display (ADR-72).

## Arabic and English

The product is bilingual (`ar` default, `en`), built on next-intl (#90). The designs are drawn in Arabic only. The English UI is the **same layout mirrored**, not a separate design:

- Use logical CSS only (`ms-*`, `me-*`, `ps-*`, `pe-*`, `start`, `end`, `text-start`). No `left`/`right`, no `ml-*`/`mr-*`.
- Direction comes from `<html dir>` set by the locale layout; components never hard-code `dir`, except:
  - phone numbers, emails, OTP inputs and numeric code fields are always `dir="ltr"`, in both languages;
  - measurement values and units read naturally in both (`92 سم` / `92 cm`).
- Directional icons flip with the language (back/forward chevrons, arrows). Non-directional icons (search, close, check, plus) never flip.
- Numbers use Western digits (0-9) in both languages, as in the designs.
- English text is often 20-40% longer than the Arabic. Buttons and chips must wrap or grow, never truncate a label; check every screen at 360 px width in both languages.
- The language switch in Settings changes the locale route; nothing else in the layout changes.
- Font: IBM Plex Sans Arabic (covers both scripts). Keep the type scale from the tokens for both languages.

## The logo

The logo in the designs is a **placeholder** (a teal square with a dashed cutting line and a pin head). Build it once as a `Logo` component in `packages/ui` and use that everywhere, so the real logo (after M1) is a one-file change.
