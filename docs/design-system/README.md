# Tafsila — design system

Tafsila (تفصيلة) turns garment photos into ready-to-cut sewing patterns for home sewists, tailors and small workshops in Egypt. The interface should feel like a familiar, tidy workshop: warm linen, a spool of teal thread, a touch of henna. Calm enough for a 65-year-old tailor to read for an hour, lively enough that a young sewist feels it was made for her.

This is the first, small version: colours, type, spacing, radii and shadows. Components (Button, FormField, Card, Toast, EmptyState, ErrorState, AppShell…) are built next, from these tokens, in the "foundations" issue of the codebase.

## Principles

1. **Readable before pretty.** Body text is 17px with tall line heights; every text colour passes 4.5:1 on every surface it may sit on (most pass 6:1). Instructions are never in `caption` or `ink-muted` alone.
2. **Calm ground, lively details.** Large areas are `surface`, `surface-raised` and `surface-sunken`. Colour is spent in small, meaningful doses: `primary` for the main action, `accent` and `saffron` for highlights and progress. No large saturated backgrounds behind text.
3. **One main action per screen.** Exactly one `primary` filled button per view; everything else is secondary (outlined with `border-strong`) or a text link in `primary`.
4. **Arabic first.** Right-to-left by default, English as a second language. Layout uses logical sides (start/end); directional icons flip.
5. **Big, forgiving targets.** Every tappable control is at least `space-11` (44px) tall; spacing between controls at least `space-2`.
6. **Errors are kind and specific.** Messages say what happened and what to do, in plain Arabic, never codes. Field errors in `danger` under the field; non-blocking warnings (an unusual measurement) in `warning`.

## Colour

| Role                                 | Token                                                | Rule                                                        |
| ------------------------------------ | ---------------------------------------------------- | ----------------------------------------------------------- |
| Page                                 | `surface`                                            | Default background of every page.                           |
| Cards, fields, dialogs               | `surface-raised` + `shadow-card`                     | White only on top of linen, never as the page.              |
| Grouped areas                        | `surface-sunken`                                     | Filter bars, guide panels, table headers.                   |
| Text                                 | `ink`, `ink-muted`                                   | `ink` for reading, `ink-muted` for hints and metadata.      |
| Main action, links, selection, focus | `primary` / `on-primary` / `primary-soft`            | Teal thread: one filled primary button per screen.          |
| Highlight                            | `accent` / `on-accent` / `accent-soft`               | Henna: "new", the current step, onboarding tips. Sparingly. |
| Decoration                           | `saffron`                                            | Badges, progress bars, illustration details. Never text.    |
| States                               | `success`, `warning`, `danger`                       | Always with an icon or words, never colour alone.           |
| Lines                                | `line` (dividers), `border-strong` (control borders) |                                                             |

Colours that must be told apart (success vs danger) also differ in lightness and always carry an icon or label.

## Type

One family, **IBM Plex Sans Arabic** (Google Fonts, covers Arabic and Latin), falling back to Noto Kufi Arabic and system fonts. Seven styles: `display`, `title`, `heading`, `body`, `body-sm`, `label`, `caption`. Western digits by default (an Arabic-Indic setting comes later). Numbers in measurements always show their unit (سم).

## Space and shape

4px grid: `space-1` … `space-8`, plus `space-11` (44px) as the minimum control height. Radii are soft but not round: `radius-sm` for badges, `radius-md` for buttons and inputs, `radius-lg` for cards and dialogs. Shadows are warm and faint (`shadow-card`, `shadow-overlay`); separation comes mostly from surface colour, not shadow.

## Iconography

Outline icons, 1.5px stroke, 20–24px, drawn in `currentColor` so they take `ink`, `primary` or a state colour. Directional icons (arrows, chevrons, back) mirror in RTL. Sewing-specific icons (scissors, tape measure, needle, pattern piece) come later as their own asset group.

## Logo

No logo yet: the name is set in `title` or `display` weight 600 in `ink`, Arabic "تفصيلة" first, "Tafsila" second.

## Voice

Warm, short, encouraging Arabic that an Egyptian or Levantine sewist reads naturally: "قيسي محيط الصدر عند أعرض نقطة". Address the user directly, explain sewing terms once, no technical words (no "error 500", no "validation"). English copy follows the same tone.

## Status

Version 1, made without an existing brand: palette, type and scales were chosen for comfort across ages and a homey workshop feel. Light theme only. Everything here is a starting point Merna can change; components update automatically because they only use tokens.
